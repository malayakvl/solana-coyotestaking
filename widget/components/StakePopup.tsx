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
import bs58 from 'bs58';

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

  // 🔍 Получаем публичный ключ ЛЮБЫМ способом
  const getPublicKey = (): PublicKey | null => {
    if (effectiveWallet?.publicKey) return effectiveWallet.publicKey;
    if (walletContext.publicKey) return walletContext.publicKey;
    if (typeof window !== 'undefined' && window.solana?.publicKey) {
      try {
        return new PublicKey(window.solana.publicKey.toString());
      } catch (e) {
        console.error('Error parsing window.solana publicKey:', e);
      }
    }
    if (typeof window !== 'undefined' && window.phantom?.solana?.publicKey) {
      try {
        return new PublicKey(window.phantom.solana.publicKey.toString());
      } catch (e) {
        console.error('Error parsing window.phantom publicKey:', e);
      }
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

  // JITO & Stakewiz данные
  const [jitoValue, setJitoValue] = useState<number | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);
  const [skipRate, setSkipRate] = useState<number | null>(null);

  // ✅ 1. СНАЧАЛА объявляем connection (убрали пробел в конце!)
  const connection = useMemo(
      () => new Connection('https://solspy.org/api/rpc-proxy'),
      []
  );

  // ✅ 2. ЗАТЕМ объявляем кэш
  const cachedBlockhash = useRef<{ blockhash: string; lastValidBlockHeight: number } | null>(null);
  const cachedRentExempt = useRef<number | null>(null);

  // ✅ 3. ЗАТЕМ эффект обновления кэша (использует connection)
  useEffect(() => {
    if (!isOpen) return;

    console.log('🔄 Updating transaction cache...');

    const updateCache = async () => {
      try {
        const [blockhashInfo, rentExempt] = await Promise.all([
          connection.getLatestBlockhash(),
          connection.getMinimumBalanceForRentExemption(StakeProgram.space)
        ]);

        cachedBlockhash.current = blockhashInfo;
        cachedRentExempt.current = rentExempt;

        console.log('✅ Cache updated successfully');
        console.log('  → Blockhash:', blockhashInfo.blockhash);
        console.log('  → Rent exempt:', rentExempt / LAMPORTS_PER_SOL, 'SOL');
      } catch (err: any) {
        console.error('❌ Failed to update cache:', err.message);
      }
    };

    updateCache();
    const interval = setInterval(updateCache, 30000);
    return () => clearInterval(interval);
  }, [isOpen, connection]);

  // 🔥 ПОЛУЧЕНИЕ БАЛАНСА
  useEffect(() => {
    console.log('useEffect БАЛАНСУ ЗАПУЩЕНО');
    console.log('isOpen:', isOpen, 'connected:', isConnected, 'pubkey:', publicKeyToUse?.toBase58());

    if (!isOpen || !isConnected || !publicKeyToUse) {
      console.log('Вих conditions не пройдено — виходимо');
      setAvailableBalance(null);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.error('ТАЙМАУТ 15 секунд — валідатор не відповів!');
      controller.abort();
      setAvailableBalance(null);
    }, 15000);

    connection.getBalance(publicKeyToUse, { signal: controller.signal })
        .then(lamports => {
          clearTimeout(timeout);
          const sol = lamports / LAMPORTS_PER_SOL;
          console.log('БАЛАНС ОТРИМАНО:', sol.toFixed(6), 'SOL');
          setAvailableBalance(sol);
        })
        .catch(err => {
          clearTimeout(timeout);
          console.error('getBalance помилка:', err);
          setAvailableBalance(null);
        });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [isOpen, isConnected, publicKeyToUse, connection]);

  // JITO (убрали пробел в конце!)
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

  // Stakewiz (убрали пробел в конце!)
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

  // ✅ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: СИНХРОННЫЙ ВЫЗОВ КОШЕЛЬКА (без async/await!)
  const handleConfirm = () => {
    console.log('🔍 Cache check:');
    console.log('  → Blockhash:', cachedBlockhash.current?.blockhash);
    console.log('  → Rent exempt:', cachedRentExempt.current);

    if (!publicKeyToUse) {
      setAmountError('Wallet not connected. Please reconnect.');
      return;
    }

    if (!cachedBlockhash.current || !cachedRentExempt.current) {
      setAmountError('Transaction data loading. Please wait a moment...');
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num < MIN_STAKE) {
      setAmountError(`Minimum ${MIN_STAKE} SOL`);
      return;
    }

    if (availableBalance && num > availableBalance) {
      setAmountError(`Insufficient balance. Max: ${availableBalance.toFixed(3)} SOL`);
      return;
    }

    try {
      const blockhashInfo = cachedBlockhash.current;
      const rentExempt = cachedRentExempt.current;

      const lamports = Math.floor(num * LAMPORTS_PER_SOL) + rentExempt;
      const stakeAccount = Keypair.generate();

      // ✅ Создаём транзакцию БЕЗ partialSign!
      const tx = new Transaction().add(
          StakeProgram.createAccount({
            fromPubkey: publicKeyToUse,
            stakePubkey: stakeAccount.publicKey,
            authorized: {
              staker: publicKeyToUse,
              withdrawer: publicKeyToUse,
            },
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

      // ✅ ВЫЗЫВАЕМ КОШЕЛЁК СРАЗУ (без await!) — это решает проблему блокировки
      let walletCall: Promise<any>;

      if (typeof window !== 'undefined' && window.solana?.signAndSendTransaction) {
        console.log('✅ Calling wallet SIGNANDSEND synchronously');
        walletCall = window.solana.signAndSendTransaction(tx); // ← СИНХРОННЫЙ ВЫЗОВ!
      }
      else if (typeof window !== 'undefined' && window.phantom?.solana?.signAndSendTransaction) {
        console.log('✅ Calling Phantom SIGNANDSEND synchronously');
        walletCall = window.phantom.solana.signAndSendTransaction(tx); // ← СИНХРОННЫЙ ВЫЗОВ!
      }
      else {
        throw new Error('No wallet provider available');
      }

      // ✅ Обновляем состояние ПОСЛЕ вызова кошелька (но до ожидания результата)
      setIsSubmitting(true);
      setMessage('Waiting for wallet signature...');

      // ✅ Обрабатываем результат через цепочку промисов
      walletCall
          .then(result => {
            const signature = typeof result === 'string' ? result : (result.signature || result);
            console.log('✅ Transaction signed! Signature:', signature);
            return signature;
          })
          .then(signature => {
            // Подтверждаем транзакцию
            return connection.confirmTransaction({
              blockhash: blockhashInfo.blockhash,
              lastValidBlockHeight: blockhashInfo.lastValidBlockHeight,
              signature,
            }, 'confirmed')
                .then(() => signature);
          })
          .then(signature => {
            console.log('✅ Transaction confirmed:', signature);

            // ✅ Показываем попап успеха
            if (typeof window !== 'undefined' && window.showSuccessPopup) {
              window.showSuccessPopup(
                  `Transaction Successful!\n\nSignature: ${signature}\n\nView on Solana Explorer: solana.fm/tx/${signature}`
              );
            }

            // ✅ ЗАКРЫВАЕМ попап стейкинга с задержкой (чтобы успел появиться попап успеха)
            setTimeout(() => {
              setIsSubmitting(false);
              onClose();
            }, 1000);
          })
          .catch(err => {
            console.error('❌ Transaction error:', err);
            setIsSubmitting(false);

            if (err?.message?.includes('User rejected') || err?.code === 4001) {
              setAmountError('Transaction cancelled');
              setMessage('');
            } else {
              setAmountError(err?.message || 'Transaction failed. Please try again.');
            }
          });

      // Возвращаем промис (опционально)
      return walletCall;
    } catch (err: any) {
      console.error('❌ Preparation error:', err);
      setIsSubmitting(false);
      setAmountError(err?.message || 'Transaction error');
      return Promise.reject(err);
    }
  };

  // Clear messages when popup opens
  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setAmountError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ✅ Success popup function
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showSuccessPopup = (message: string) => {
        const container = document.createElement('div');
        container.id = 'success-popup-container';
        container.style.position = 'fixed';
        container.style.inset = '0';
        container.style.background = 'rgba(0,0,0,0.6)';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.zIndex = '1000';
        container.style.fontFamily = 'Open Sans, sans-serif';

        const popup = document.createElement('div');
        popup.style.background = '#fff';
        popup.style.borderRadius = '16px';
        popup.style.padding = '30px';
        popup.style.width = '90%';
        popup.style.maxWidth = '457px';
        popup.style.textAlign = 'center';
        popup.style.position = 'relative';

        const closeIcon = document.createElement('div');
        closeIcon.className = 'success-popup-close';
        closeIcon.innerHTML = '&times;';
        closeIcon.onclick = () => {
          document.body.removeChild(container);
        };

        const signatureMatch = message.match(/Signature: ([A-Za-z0-9]+)/);
        const signatureContainer = document.createElement('div');
        signatureContainer.className = 'success-popup-signature-container';

        if (signatureMatch && signatureMatch[1]) {
          const signatureTitle = document.createElement('div');
          signatureTitle.textContent = 'You`ve successfully delegated SOL to Vladika. Your stake will start earning rewards from the next epoch.';
          signatureTitle.style.color = '#000';
          signatureTitle.style.fontSize = '16px';
          signatureTitle.style.marginBottom = '8px';

          const signatureText = document.createElement('div');
          signatureText.textContent = signatureMatch[1];
          signatureText.style.color = '#ff8480';
          signatureText.style.fontFamily = 'monospace';
          signatureText.style.fontSize = '13px';
          signatureText.style.wordBreak = 'break-all';
          signatureText.style.display = 'none';

          signatureContainer.appendChild(signatureTitle);
          signatureContainer.appendChild(signatureText);
        }

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.className = 'success-popup-close-button';
        closeButton.onclick = () => {
          document.body.removeChild(container);
        };

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'success-popup-button-container';

        const buttonText = document.createElement('div');
        buttonText.textContent = "You can stake tokens in your wallet's `Staking` tab. Feeling fancy already? You should - your SOL in the right hands";
        buttonText.className = 'success-popup-button-text';

        buttonContainer.appendChild(buttonText);
        buttonContainer.appendChild(closeButton);

        popup.appendChild(closeIcon);
        if (signatureMatch && signatureMatch[1]) {
          popup.appendChild(signatureContainer);
        }
        popup.appendChild(buttonContainer);
        container.appendChild(popup);

        document.body.appendChild(container);
      };
    }

    return () => {
      if (typeof window !== 'undefined' && window.showSuccessPopup) {
        delete window.showSuccessPopup;
      }
      const existingContainer = document.getElementById('success-popup-container');
      if (existingContainer) {
        document.body.removeChild(existingContainer);
      }
    };
  }, []);

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
            Stake smart, earn more. Your SOL deserves this kind of luck!
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
            x
          </button>

          <div className="red-content-popup">
            <div className="red-content">
              <p className="text-amount">
                Available amount:{' '}
                <span className="amount-value">
                {availableBalance !== null
                    ? availableBalance.toFixed(3)
                    : isConnected
                        ? 'Loading...'
                        : 'Connect wallet'}
              </span>
              </p>

              <div className="input-container">
                <span className="input-icon i-sol"></span>
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
                    disabled={isSubmitting}
                    style={{
                      borderColor: amountError ? '#ff554f' : '#ccc',
                      borderWidth: amountError ? 2 : 1,
                      opacity: isSubmitting ? 0.3 : 1
                    }}
                />
                {amountError && (
                    <div style={{ color: '#fff', marginTop: 5, fontWeight: 'bold' }}>
                      ❌ {amountError}
                    </div>
                )}
              </div>

              <div className="stake-button-container">
                <button
                    onClick={handleConfirm} // ← СИНХРОННЫЙ ОБРАБОТЧИК (без async!)
                    className="stake-submit-btn"
                    disabled={isSubmitting || !isConnected}
                    style={{
                      opacity: isSubmitting || !isConnected ? 0.3 : 1,
                      cursor: isSubmitting || !isConnected ? 'not-allowed' : 'pointer'
                    }}
                >
                  {isSubmitting ? 'Sending...' : 'Stake'}
                </button>
              </div>

              <span className="text-footer">
              The maximum stake is your balance minus 0.01,
              to ensure you have some SOL left for future transactions.
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
                <div style={{ whiteSpace: 'pre-line', wordBreak: 'break-all', lineHeight: '1.4' }}>
                  {message}
                </div>
              </div>
          )}
        </div>
      </div>
  );
};