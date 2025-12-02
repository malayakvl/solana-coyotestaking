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
  const handleConfirmOld = async () => {
    setMessage('');
    setAmountError(null);

    const num = parseFloat(amount);
    if (isNaN(num) || num < MIN_STAKE) {
      setAmountError(`Минимум ${MIN_STAKE} SOL`);
      return;
    }

    if (!effectiveConnected || !effectivePublicKey) {
      setAmountError('Подключи кошелёк');
      return;
    }

    if (!window.globalWalletSignTransaction) {
      setAmountError('Кошелёк не готов. Переподключись.');
      return;
    }

    try {
      setMessage('Готовим транзакцию...');

      const stakeAccount = Keypair.generate();
      const rentExempt = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
      const lamports = Math.floor(num * LAMPORTS_PER_SOL) + rentExempt;

      const createIx = StakeProgram.createAccount({
        fromPubkey: new PublicKey(effectivePublicKey),
        stakePubkey: stakeAccount.publicKey,
        authorized: {
          staker: new PublicKey(effectivePublicKey),
          withdrawer: new PublicKey(effectivePublicKey),
        },
        lamports,
      });

      const delegateIx = StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: new PublicKey(effectivePublicKey),
        votePubkey: VOTE_ACCOUNT,
      });

      const tx = new Transaction().add(createIx, delegateIx);
      tx.feePayer = new PublicKey(effectivePublicKey);
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      setMessage('Подписываем транзакцию...');

      // ←←← ЭТО БОЕВОЙ ШАГ: ПОДПИСЫВАЕМ ЧЕРЕЗ КОШЕЛЁК
      const signedTx = await window.globalWalletSignTransaction(tx);
      const serializedTx = signedTx.serialize();
      const signature = signedTx.signatures[0].signature?.toString('base64');

      console.log('%c[STAKE] Транзакция подписана!', 'color: #51cf66; font-weight: bold; font-size: 16px;');
      console.log('Signature:', signature);
      console.log('Serialized size:', serializedTx.length, 'bytes');

      setMessage('Симулируем в сети...');

      // ←←← Симуляция подписанной транзакции
      const sim = await connection.simulateTransaction(signedTx);

      if (sim.value.err) {
        console.error('Simulation failed:', sim.value.err);
        setAmountError(`Ошибка симуляции: ${JSON.stringify(sim.value.err)}`);
        return;
      }

      // ←←← ВСЁ ГОТОВО, НО НЕ ОТПРАВЛЯЕМ
      setMessage(`ГОТОВО К ОТПРАВКЕ!\n\nСигнатура:\n${signature}\n\nТранзакция подписана и прошла симуляцию\n(без отправки в сеть — безопасно)`);

      console.log('%c[STAKE] БОЕВОЙ РЕЖИМ — ВСЁ УСПЕШНО, НО НЕ ОТПРАВЛЕНО', 'color: #9775fa; font-weight: bold; font-size: 18px; background: #000; padding: 10px;');

      setTimeout(onClose, 8000);

    } catch (err: any) {
      console.error('Stake error:', err);
      setAmountError(err?.message || 'Ошибка подписи/симуляции');
    }
  };

const handleConfirm = async () => {
  setMessage('');
  setAmountError(null);

  const num = parseFloat(amount);
  if (isNaN(num) || num < MIN_STAKE) return setAmountError(`Минимум ${MIN_STAKE} SOL`);
  if (!effectiveConnected || !effectivePublicKey) return setAmountError('Подключи кошелёк');
  if (!window.globalWalletSignTransaction || !window.globalWalletSendTransaction) 
    return setAmountError('Кошелёк не готов');

  try {
    setMessage('Готовим...');

    const rentExempt = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
    const lamports = Math.floor(num * LAMPORTS_PER_SOL) + rentExempt;
    const stakeAccount = Keypair.generate();

    const createIx = StakeProgram.createAccount({
      fromPubkey: new PublicKey(effectivePublicKey),
      stakePubkey: stakeAccount.publicKey,
      authorized: {
        staker: new PublicKey(effectivePublicKey),
        withdrawer: new PublicKey(effectivePublicKey),
      },
      lamports,
    });

    const delegateIx = StakeProgram.delegate({
      stakePubkey: stakeAccount.publicKey,
      authorizedPubkey: new PublicKey(effectivePublicKey),
      votePubkey: VOTE_ACCOUNT,
    });

    const tx = new Transaction().add(createIx, delegateIx);
    tx.feePayer = new PublicKey(effectivePublicKey);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // ←←← ЭТО ГЛАВНОЕ ИСПРАВЛЕНИЕ
    tx.partialSign(stakeAccount);

    setMessage('Подпиши в кошельке...');
    const signedTx = await window.globalWalletSignTransaction(tx);

    setMessage('Симуляция...');
    const sim = await connection.simulateTransaction(signedTx);
    if (sim.value.err) throw new Error(JSON.stringify(sim.value.err));

    setMessage('Отправляем в сеть...');
    const signature = await window.globalWalletSendTransaction(signedTx, connection);

    setMessage(`ГОТОВО!\n\n${signature}\n\nsolana.fm/tx/${signature}`);
    console.log('VLADIKA STAKED:', signature);
    setTimeout(onClose, 15000);

  } catch (err: any) {
    console.error(err);
    setAmountError(err?.message || 'Ошибка');
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
              position: 'absolute',
              top: '-170px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 40px)',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
              color: message.includes('✅') ? '#155724' : '#721c24',
              border: `2px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              zIndex: 1001,
              maxWidth: '500px',
              textAlign: 'left'
            }}
          >
            <div 
              style={{ 
                whiteSpace: 'pre-line',
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                lineHeight: '1.4'
              }}
            >
              {message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
