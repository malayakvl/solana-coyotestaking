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
}

export const StakePopup: React.FC<StakePopupProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [jitoValue, setJitoValue] = useState<number | null>(null);
  const [uptime, setUptime] = useState<number | null>(null); // Add uptime state
  const [skipRate, setSkipRate] = useState<number | null>(null); // Add skip rate state
  const [amountError, setAmountError] = useState<string | null>(null); // Add amount validation error state
  const [globalWalletState, setGlobalWalletState] = useState<{
    connected: boolean;
    publicKey: string | null;
    walletName: string | null;
  } | null>(null);

  const wallet = useWallet();

  // Subscribe to global wallet state changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.subscribeToGlobalWalletState) {
      return;
    }

    const unsubscribe = window.subscribeToGlobalWalletState((newGlobalState) => {
      console.log('StakePopup: Received global state update', newGlobalState);
      setGlobalWalletState(newGlobalState);
    });

    // Also get the initial state
    setTimeout(() => {
      if (window.globalWalletState) {
        setGlobalWalletState(window.globalWalletState);
      }
    }, 0);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Determine which state to use (global state is the absolute truth)
  const effectiveConnected = globalWalletState?.connected ?? wallet.connected;
  const effectivePublicKey = globalWalletState?.publicKey ?? (wallet.publicKey?.toBase58() ?? null);

  // Мемоизированное подключение к RPC (иначе на каждом рендере создается новый Connection)
  const connection = useMemo(
    () => new Connection('http://103.167.235.81/api/rpc-proxy'),
    []
  );

  // Получение текущего баланса
  useEffect(() => {
    if (!isOpen || !effectiveConnected || !effectivePublicKey) return;

    let isMounted = true;

    const fetchBalance = async () => {
      try {
        // Convert string publicKey to PublicKey object
        const pubKey = new PublicKey(effectivePublicKey);
        const lamports = await connection.getBalance(pubKey);
        if (isMounted) {
          setAvailableBalance(lamports / LAMPORTS_PER_SOL);
        }
      } catch (err) {
        console.error('Ошибка получения баланса:', err);
        if (isMounted) setAvailableBalance(null);
      }
    };

    fetchBalance();

    const interval = setInterval(fetchBalance, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, effectiveConnected, effectivePublicKey, connection]);

  // Fetch Jito data when popup opens
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    
    const fetchJito = async () => {
      try {
        const response = await fetch("https://kobe.mainnet.jito.network/api/v1/steward_events?limit=1&event_type=ScoreComponentsV2&vote_account=53RJBy7aBGA7Aag6AryxEmBbsHDgwfBWagLrPbGHnfvR");
        const data = await response.json();
        const jitoScore = Math.round(data.events[0].data.score * 100 * 100) / 100;
        
        if (!cancelled) {
          setJitoValue(jitoScore);
        }
      } catch (error) {
        console.error("Failed to fetch Jito:", error);
        if (!cancelled) {
          setJitoValue(null);
        }
      }
    };

    fetchJito();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Fetch Stakewiz data when popup opens
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    
    const fetchStakewizData = async () => {
      try {
        const validatorResponse = await fetch("https://api.stakewiz.com/validator/53RJBy7aBGA7Aag6AryxEmBbsHDgwfBWagLrPbGHnfvR");
        const validatorData = await validatorResponse.json();
        
        if (!cancelled) {
          const skipRateValue = Math.round(validatorData.skip_rate * 100) / 100;
          const uptimeValue = validatorData.uptime;
          
          setSkipRate(skipRateValue);
          setUptime(uptimeValue);
        }
      } catch (error) {
        console.error("Failed to fetch Stakewiz data:", error);
        if (!cancelled) {
          setSkipRate(null);
          setUptime(null);
        }
      }
    };

    fetchStakewizData();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Обработчик отправки стейка
  const handleConfirm = async () => {
    // Check for validation errors before proceeding
    if (amountError) {
      setMessage(`❌ ${amountError}`);
      return;
    }
    
    const num = parseFloat(amount);

    // Валидация
    if (isNaN(num) || num < MIN_STAKE) {
      setMessage(`❌ Минимум ${MIN_STAKE} SOL`);
      return;
    }
    if (availableBalance !== null && num > availableBalance) {
      setMessage('❌ Недостаточно SOL на кошельке');
      return;
    }
    if (!effectiveConnected || !effectivePublicKey) {
      setMessage('❌ Сначала подключите кошелек');
      return;
    }

    try {
      setMessage('🔄 Подготовка транзакции...');

      // Rent-exempt — динамический, не hardcode!
      const stakeAccount = Keypair.generate();
      const rentExempt = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

      const lamports = num * LAMPORTS_PER_SOL + rentExempt;

      // 1. Создание аккаунта для стейка
      const createIx = StakeProgram.createAccount({
        fromPubkey: new PublicKey(effectivePublicKey),
        stakePubkey: stakeAccount.publicKey,
        authorized: {
          staker: new PublicKey(effectivePublicKey),
          withdrawer: new PublicKey(effectivePublicKey)
        },
        lamports
      });

      // 2. Делегирование на валидатора
      const delegateIx = StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: new PublicKey(effectivePublicKey),
        votePubkey: VOTE_ACCOUNT
      });

      const tx = new Transaction().add(createIx, delegateIx);

      if (!window.confirm(`Вы хотите застейкать ${num} SOL на валидатор?`)) {
        setMessage('❌ Пользователь отменил стейк');
        return;
      }

      setMessage('⏳ Отправка транзакции...');

      // For now, we'll show a message that the transaction is prepared
      // In a real implementation, we would need to handle signing differently
      // since we don't have direct access to the wallet's signTransaction function
      // in this isolated context
      setMessage(`✅ Transaction prepared. In a full implementation, this would be sent to your wallet for signing.`);

      // Закрываем попап спустя 2 сек
      setTimeout(onClose, 2000);

    } catch (err: unknown) {
      console.error(err);
      setMessage(err instanceof Error ? '❌ Ошибка: ' + err.message : '❌ Неизвестная ошибка');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="stake-popup-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="stake-popup-content">
        <div className="stake-popup-header"></div>
        <div className="stake-popup-tips">
          This is your staking jackpot 0% comission + MEV rewards. Stake smart, earn more.
          Your SOL deserves this kind of luck!
        </div>
        <div className="flex">
          <div className="col-param">
            {uptime !== null ? `${uptime}%` : '?'}
            <br />
            <span>Uptime:</span>
          </div>
          <div className="col-param">
            {skipRate !== null ? `${skipRate}%` : '?'}<br />
            <span>Skip Rate</span>
          </div>
          <div className="col-param">
            {jitoValue !== null ? jitoValue : '?'}<br />
            <span>Jito MEV score</span>
          </div>
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
          {/* <p>Wallet: {effectiveConnected ? effectivePublicKey : 'Not connected'}</p> */}
          <p className="text-amount">
            Available amount:{' '}
            <span className="amount-value">
              {availableBalance !== null
                ? `${availableBalance.toFixed(3)}`
                : effectiveConnected
                  ? 'Loading...'
                  : 'Connect wallet'}
            </span>
          </p>

          <input
            type="text"
            placeholder={`${MIN_STAKE} SOL`}
            value={amount}
            onChange={(e) => {
              const value = e.target.value;
              setAmount(value);
              
              // Validate the amount as user types
              if (value === '') {
                setAmountError(null);
              } else {
                const num = parseFloat(value);
                if (isNaN(num)) {
                  setAmountError('Please enter a valid number');
                } else if (num < MIN_STAKE) {
                  setAmountError(`Minimum amount is ${MIN_STAKE} SOL`);
                } else if (availableBalance !== null && num > availableBalance) {
                  setAmountError(`Amount exceeds available balance of ${availableBalance.toFixed(3)} SOL`);
                } else {
                  setAmountError(null);
                }
              }
            }}
            className="stake-input"
            style={{ 
              borderColor: amountError ? '#ff554f' : '#ccc',
              borderWidth: amountError ? '2px' : '1px'
            }}
          />
          {amountError && (
            <div style={{ 
              color: '#ff554f', 
              fontSize: '14px', 
              marginTop: '5px',
              fontWeight: 'bold'
            }}>
              {amountError}
            </div>
          )}
          <div className="stake-button-container">
              <button 
                onClick={handleConfirm}
                className="stake-submit-btn"
              >
                Stake
              </button>
          </div>
          <span className="text-footer">
            The maximum stake is your balance minus 0.01, to ensure you have some SOL left for fucture transaction
          </span>

          
          </div>
        </div>

        {message && <p style={{ marginTop: 12, color: message.includes('✅') ? 'green' : 'red' }}>{message}</p>}
      </div>
    </div>
  );
};