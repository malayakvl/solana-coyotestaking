'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  wallet?: {
    connected: boolean;
    publicKey: PublicKey | null;
    sendTransaction?: (tx: Transaction, connection: Connection) => Promise<string>;
    signTransaction?: (tx: Transaction) => Promise<Transaction>;
  };
  devModeEnabled?: boolean;
}

export const StakePopup: React.FC<StakePopupProps> = ({ isOpen, onClose, wallet: propWallet }) => {
  const walletContext = useWallet();
  const effectiveWallet = propWallet || walletContext;

  const getPublicKey = (): PublicKey | null => {
    if (effectiveWallet?.publicKey) return effectiveWallet.publicKey;
    if (walletContext.publicKey) return walletContext.publicKey;
    if (typeof window !== 'undefined' && (window as any).solana?.publicKey) {
      try {
        return new PublicKey((window as any).solana.publicKey.toString());
      } catch (e) { console.error(e); }
    }
    return null;
  };

  const publicKeyToUse = getPublicKey();
  const isConnected = !!publicKeyToUse;

  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);

  const [jitoValue, setJitoValue] = useState<number | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);
  const [skipRate, setSkipRate] = useState<number | null>(null);

  // ✅ Инициализация Connection без WebSocket
  const connection = useMemo(
    () => new Connection('https://vladika.love/wp-content/themes/yootheme/proxy.php'),
    []
  );
  // const connection = useMemo(
  //   () => new Connection('https://solspy.org/api/rpc-proxy', { wsEndpoint: '', commitment: 'confirmed' }),
  //   []
  // );

  const cachedBlockhash = useRef<{ blockhash: string; lastValidBlockHeight: number } | null>(null);
  const cachedRentExempt = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const updateCache = async () => {
      try {
        const [blockhashInfo, rentExempt] = await Promise.all([
          connection.getLatestBlockhash(),
          connection.getMinimumBalanceForRentExemption(StakeProgram.space)
        ]);
        cachedBlockhash.current = blockhashInfo;
        cachedRentExempt.current = rentExempt;
      } catch (err: any) { console.error('Cache error:', err.message); }
    };
    updateCache();
    const interval = setInterval(updateCache, 30000);
    return () => clearInterval(interval);
  }, [isOpen, connection]);

  useEffect(() => {
    if (!isOpen || !isConnected || !publicKeyToUse) {
      setAvailableBalance(null);
      return;
    }
    const controller = new AbortController();
    connection.getBalance(publicKeyToUse, { signal: controller.signal })
      .then(lamports => setAvailableBalance(lamports / LAMPORTS_PER_SOL))
      .catch(() => setAvailableBalance(null));
    return () => controller.abort();
  }, [isOpen, isConnected, publicKeyToUse, connection]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("https://kobe.mainnet.jito.network/api/v1/steward_events?limit=1&event_type=ScoreComponentsV2&vote_account=53RJBy7aBGA7Aag6AryxEmBbsHDgwfBWagLrPbGHnfvR")
      .then(res => res.json())
      .then(data => {
        const score = Math.round(data.events[0].data.score * 10000) / 100;
        setJitoValue(score);
      }).catch(() => { });

    fetch("https://api.stakewiz.com/validator/53RJBy7aBGA7Aag6AryxEmBbsHDgwfBWagLrPbGHnfvR")
      .then(res => res.json())
      .then(data => {
        setSkipRate(Math.round(data.skip_rate * 100) / 100);
        setUptime(data.uptime);
      }).catch(() => { });
  }, [isOpen]);

  const handleConfirm = () => {
    if (!publicKeyToUse) { setAmountError('Wallet not connected'); return; }
    if (!cachedBlockhash.current || !cachedRentExempt.current) { setAmountError('Loading details...'); return; }

    const num = parseFloat(amount);
    if (isNaN(num) || num < MIN_STAKE) { setAmountError(`Minimum ${MIN_STAKE} SOL`); return; }
    if (availableBalance && num > availableBalance) { setAmountError(`Insufficient balance`); return; }

    try {
      const blockhashInfo = cachedBlockhash.current;
      const rentExempt = cachedRentExempt.current;
      const lamports = Math.floor(num * LAMPORTS_PER_SOL) + rentExempt;
      const stakeAccount = Keypair.generate();

      const tx = new Transaction().add(
        StakeProgram.createAccount({
          fromPubkey: publicKeyToUse,
          stakePubkey: stakeAccount.publicKey,
          authorized: { staker: publicKeyToUse, withdrawer: publicKeyToUse },
          lamports,
        }),
        StakeProgram.delegate({
          stakePubkey: stakeAccount.publicKey,
          authorizedPubkey: publicKeyToUse,
          votePubkey: VOTE_ACCOUNT,
        })
      );

      tx.feePayer = publicKeyToUse;
      tx.recentBlockhash = blockhashInfo.blockhash;
      tx.partialSign(stakeAccount);

      const provider = (window as any).solana || (window as any).phantom?.solana;
      if (!provider?.signAndSendTransaction) throw new Error('No wallet provider available');

      setIsSubmitting(true);
      setMessage('Waiting for wallet signature...');

      provider.signAndSendTransaction(tx)
        .then((result: any) => {
          const signature = typeof result === 'string' ? result : (result.signature || result);
          console.log('✅ Signed:', signature);
          return signature;
        })
        .then(async (signature: string) => {
          setMessage('Confirming on-chain...');
          let confirmed = false;
          for (let i = 0; i < 30; i++) {
            const { value: statuses } = await connection.getSignatureStatuses([signature]);
            const status = statuses[0];
            if (status?.err) throw new Error('Transaction failed on-chain');
            if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
              confirmed = true;
              break;
            }
            await new Promise(r => setTimeout(r, 2000));
          }
          if (!confirmed) throw new Error('Confirmation timeout');
          return signature;
        })
        .then((signature: string) => {
          if (typeof window !== 'undefined' && (window as any).showSuccessPopup) {
            (window as any).showSuccessPopup(`Success! Signature: ${signature}`);
          }
          setTimeout(() => { setIsSubmitting(false); onClose(); }, 1000);
        })
        .catch((err: any) => {
          console.error('TX Error:', err);
          setIsSubmitting(false);
          if (err.code === 4001 || err.message?.includes('rejected')) {
            setAmountError('Transaction cancelled');
          } else if (err.code === -32603) {
            setAmountError('Internal wallet error (-32603). Check balance or try again.');
          } else {
            setAmountError(err.message || 'Transaction failed');
          }
        });
    } catch (err: any) {
      setIsSubmitting(false);
      setAmountError(err.message);
    }
  };

  useEffect(() => { if (isOpen) { setMessage(''); setAmountError(null); } }, [isOpen]);

  if (!isOpen) return null;

  // Render Success Popup inside effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showSuccessPopup = (msg: string) => {
        const container = document.createElement('div');
        container.id = 'success-popup-container';
        container.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1100;font-family:sans-serif;';
        const popup = document.createElement('div');
        popup.style.cssText = 'background:#fff;border-radius:16px;padding:30px;width:90%;max-width:450px;text-align:center;position:relative;';
        popup.innerHTML = `
            <h3 style="margin-top:0">Delegation Successful!</h3>
            <p style="font-size:14px;color:#666;word-break:break-all">${msg}</p>
            <button onclick="document.body.removeChild(document.getElementById('success-popup-container'))" style="margin-top:20px;padding:12px 24px;background:#ff8480;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">Close</button>
          `;
        container.appendChild(popup);
        document.body.appendChild(container);
      };
    }
    return () => {
      const el = document.getElementById('success-popup-container');
      if (el) document.body.removeChild(el);
    };
  }, []);

  return (
    <div className="stake-popup-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="stake-popup-content">
        <div className="stake-popup-header"></div>
        <div className="stake-popup-tips">
          This is your staking jackpot 0% comission + MEV rewards.
          Stake smart, earn more. Your SOL deserves this kind of luck!
        </div>

        <div className="flex">
          <div className="col-param">{uptime ?? '?'}%<br /><span>Uptime</span></div>
          <div className="col-param">{skipRate ?? '?'}%<br /><span>Skip Rate</span></div>
          <div className="col-param">{jitoValue ?? '?'}<br /><span>Jito Score</span></div>
        </div>

        <button onClick={onClose} style={{ position: 'absolute', top: '-60px', right: '10px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#fff' }}>x</button>

        <div className="red-content-popup">
          <div className="red-content">
            <p className="text-amount">
              Available amount: <span className="amount-value">{availableBalance !== null ? availableBalance.toFixed(3) : (isConnected ? 'Loading...' : 'Connect wallet')}</span>
            </p>

            <div className="input-container">
              <span className="input-icon i-sol"></span>
              <input
                type="text"
                placeholder={`${MIN_STAKE} SOL`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="stake-input"
                disabled={isSubmitting}
                style={{ borderColor: amountError ? '#ff554f' : '#ccc', borderWidth: amountError ? 2 : 1 }}
              />
              {amountError && <div style={{ color: '#fff', marginTop: 5, fontWeight: 'bold', fontSize: '12px' }}>❌ {amountError}</div>}
              {message && <div style={{ color: '#fff', marginTop: 5, fontSize: '12px' }}>ℹ️ {message}</div>}
            </div>

            <div className="stake-button-container">
              <button
                onClick={handleConfirm}
                className="stake-submit-btn"
                disabled={isSubmitting || !isConnected}
                style={{ opacity: (isSubmitting || !isConnected) ? 0.4 : 1 }}
              >
                {isSubmitting ? 'Sending...' : 'Stake'}
              </button>
            </div>
            <span className="text-footer">The maximum stake is your balance minus 0.01, to ensure you have some SOL left for future transactions.</span>
          </div>
        </div>
      </div>
    </div>
  );
};