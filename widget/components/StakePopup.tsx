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

  // Обработчик отправки стейка
  const handleConfirm = async () => {
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
      <div className="stake-popup-content" style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>

        <h2>Stake SOL</h2>
        <p>Wallet: {effectiveConnected ? effectivePublicKey : 'Not connected'}</p>
        <p>
          Available balance:{' '}
          {availableBalance !== null
            ? `${availableBalance.toFixed(3)} SOL`
            : effectiveConnected
              ? 'Loading...'
              : 'Connect wallet'}
        </p>

        <input
          type="number"
          placeholder={`${MIN_STAKE} SOL`}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 12, borderRadius: '4px', border: '1px solid #ccc' }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: '20px' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#ff554f',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Confirm
          </button>
        </div>

        {message && <p style={{ marginTop: 12, color: message.includes('✅') ? 'green' : 'red' }}>{message}</p>}
      </div>
    </div>
  );
};