'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  Keypair,
  StakeProgram
} from '@solana/web3.js';

const VOTE_ACCOUNT = new PublicKey('53RJBy7aBGA7Aag6AryxEmBbsHDgwfBWagLrPbGHnfvR');
const MIN_STAKE = 0.01;

interface StakePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StakePopup: React.FC<StakePopupProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);

  const [jitoValue, setJitoValue] = useState<number | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);
  const [skipRate, setSkipRate] = useState<number | null>(null);

  const [amountError, setAmountError] = useState<string | null>(null);

  // 🔥 Developer Mode
  const [devMode, setDevMode] = useState(false);

  // GLOBAL WALLET
  const [globalWalletState, setGlobalWalletState] = useState<{
    connected: boolean;
    publicKey: string | null;
    walletName: string | null;tx
  } | null>(null);

  const wallet = useWallet();

  // GLOBAL SUBSCRIBE
  useEffect(() => {
    if (typeof window === 'undefined' || !window.subscribeToGlobalWalletState) return;

    const unsubscribe = window.subscribeToGlobalWalletState((newState) => {
      setGlobalWalletState(newState);
    });

    setTimeout(() => {
      if (window.globalWalletState) {
        setGlobalWalletState(window.globalWalletState);
      }
    }, 0);

    return () => unsubscribe && unsubscribe();
  }, []);

  const effectiveConnected = globalWalletState?.connected ?? wallet.connected;
  const effectivePublicKey = globalWalletState?.publicKey ?? wallet.publicKey?.toBase58() ?? null;

  // RPC
  const connection = useMemo(
    () => new Connection('http://103.167.235.81/api/rpc-proxy'),
    []
  );

  // BALANCE
  useEffect(() => {
    if (!isOpen || !effectiveConnected || !effectivePublicKey) return;

    let active = true;

    const pubkey = new PublicKey(effectivePublicKey);

    const load = async () => {
      try {
        const lamports = await connection.getBalance(pubkey);
        if (active) setAvailableBalance(lamports / LAMPORTS_PER_SOL);
      } catch (e) {
        if (active) setAvailableBalance(null);
      }
    };

    load();
    const timer = setInterval(load, 15000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isOpen, effectiveConnected, effectivePublicKey, connection]);

  // JITO
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          "https://kobe.mainnet.jito.network/api/v1/steward_events?limit=1&event_type=ScoreComponentsV2&vote_account=53RJBy7aBGA7Aag6AryxEmBbsHDgwfBWagLrPbGHnfvR"
        );
        const data = await res.json();
        if (!cancelled) {
          const score = Math.round(data.events[0].data.score * 100 * 100) / 100;
          setJitoValue(score);
        }
      } catch {
        if (!cancelled) setJitoValue(null);
      }
    };

    load();
    return () => (cancelled = true);
  }, [isOpen]);

  // Stakewiz
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          "https://api.stakewiz.com/validator/53RJBy7aBGA7Aag6AryxEmBbsHDgwfBWagLrPbGHnfvR"
        );
        const data = await res.json();
        if (!cancelled) {
          setSkipRate(Math.round(data.skip_rate * 100) / 100);
          setUptime(data.uptime);
        }
      } catch {
        if (!cancelled) {
          setSkipRate(null);
          setUptime(null);
        }
      }
    };

    load();
    return () => (cancelled = true);
  }, [isOpen]);

  // HANDLE STAKE
  const handleConfirm = async () => {
    if (amountError) {
      setMessage(`❌ ${amountError}`);
      return;
    }

    const num = parseFloat(amount);

    if (isNaN(num) || num < MIN_STAKE) {
      setMessage(`❌ Минимум ${MIN_STAKE} SOL`);
      return;
    }
    if (!effectiveConnected || !effectivePublicKey) {
      setMessage('❌ Connect wallet first');
      return;
    }

    try {
      setMessage('🔄 Preparing transaction...');

      const stakeAccount = Keypair.generate();
      const rentExempt = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

      const lamports = num * LAMPORTS_PER_SOL + rentExempt;

      // BUILD IXS
      const createIx = StakeProgram.createAccount({
        fromPubkey: new PublicKey(effectivePublicKey),
        stakePubkey: stakeAccount.publicKey,
        authorized: {
          staker: new PublicKey(effectivePublicKey),
          withdrawer: new PublicKey(effectivePublicKey)
        },
        lamports
      });

      const delegateIx = StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: new PublicKey(effectivePublicKey),
        votePubkey: VOTE_ACCOUNT
      });

      const tx = new Transaction().add(createIx, delegateIx);
      
      // Set fee payer — обовʼязково
      tx.feePayer = new PublicKey(effectivePublicKey);

      // Set recent blockhash — обовʼязково
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      // 🔥 DEVELOPER MODE
      if (devMode) {
        setMessage('🛠 Developer mode: simulating...');

        const sim = await connection.simulateTransaction(tx);

        if (sim.value.err) {
          setAmountError(`Simulation error: ${JSON.stringify(sim.value.err)}`);
          return;
        }

        const fakeSignature = [...Array(88)]
          .map(() => Math.random().toString(36)[2])
          .join('');

        setMessage(`✅ Developer simulation SUCCESS

Signature: ${fakeSignature}
Slot: ${Math.floor(Math.random() * 100000000)}
Status: simulated only
(Not broadcast to network)
`);

        setTimeout(onClose, 3000);
        return;
      }

      // NORMAL SIMULATION
      setMessage('🔍 Simulating...');
      const simulation = await connection.simulateTransaction(tx);

      if (simulation.value.err) {
        setAmountError(`Transaction fee payer required`);
        return;
      }

      setMessage('✅ Transaction prepared (not sent)');

      setTimeout(onClose, 2000);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setAmountError(err.message);
      } else {
        setAmountError('An unknown error occurred');
      }
      setMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="stake-popup-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div className="stake-popup-content">
        <div className="stake-popup-header"></div>

        <div className="stake-popup-tips">
          This is your staking jackpot 0% comission + MEV rewards.
        </div>

        <div className="flex">
          <div className="col-param">{uptime ?? '?'}%<br /><span>Uptime</span></div>
          <div className="col-param">{skipRate ?? '?'}%<br /><span>Skip Rate</span></div>
          <div className="col-param">{jitoValue ?? '?'}<br /><span>Jito Score</span></div>
        </div>

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-60px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>

        <div className="red-content-popup">
          <div className="red-content">

            {/* ❗ DEVELOPER MODE TOGGLE */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '10px',
                marginTop: '10px',
                padding: '8px 12px',
                backgroundColor: '#2d2d2d',
                borderRadius: '6px',
                border: devMode ? '1px solid #ff554f' : '1px solid #444'
              }}
            >
              <input
                type="checkbox"
                checked={devMode}
                onChange={() => setDevMode(!devMode)}
                id="devModeToggle"
                style={{ 
                  marginRight: '8px',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: '#ff554f'
                }}
              />
              <label 
                htmlFor="devModeToggle" 
                style={{ 
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: devMode ? '600' : 'normal'
                }}
              >
                Developer mode (simulation only)
              </label>
            </div>

            <p className="text-amount">
              Available amount:{' '}
              <span className="amount-value">
                {availableBalance !== null
                  ? availableBalance.toFixed(3)
                  : effectiveConnected
                  ? 'Loading...'
                  : 'Connect wallet'}
              </span>
            </p>

            {/* INPUT */}
            <input
              type="text"
              placeholder={`${MIN_STAKE} SOL`}
              value={amount}
              onChange={(e) => {
                const v = e.target.value;
                setAmount(v);

                const n = parseFloat(v);
                if (v === '') setAmountError(null);
                else if (isNaN(n)) setAmountError('Enter valid number');
                else if (n < MIN_STAKE)
                  setAmountError(`Minimum ${MIN_STAKE} SOL`);
                else if (availableBalance && n > availableBalance)
                  setAmountError(`Exceeds balance (${availableBalance.toFixed(3)} SOL)`);
                else setAmountError(null);
              }}
              className="stake-input"
              style={{
                borderColor: amountError ? '#ff554f' : '#ccc',
                borderWidth: amountError ? 2 : 1
              }}
            />
            {amountError && (
              <div style={{ color: '#fff', marginTop: 5, fontWeight: 'bold' }}>
                ❌ {amountError}
              </div>
            )}

            <div className="stake-button-container">
              <button onClick={handleConfirm} className="stake-submit-btn">
                Stake
              </button>
            </div>

            <span className="text-footer">
              The maximum stake is your balance minus 0.01
            </span>
          </div>
        </div>

        {message && (
          <div
            style={{
              marginTop: -310,
              padding: '8px 12px',
              borderRadius: '4px',
              backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
              color: message.includes('✅') ? '#155724' : '#721c24',
              border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
