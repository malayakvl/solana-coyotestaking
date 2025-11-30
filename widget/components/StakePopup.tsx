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
import { StakeButton } from './StakeButton';

const VOTE_ACCOUNT = new PublicKey('53RJBy7aBGA7Aag6AryxEmBbsHDgwfBWag6PbGHnfvR');
const MIN_STAKE = 0.01;

interface StakePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StakePopup: React.FC<StakePopupProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);

  const wallet = useWallet();

  // Мемоизированное подключение к RPC (иначе на каждом рендере создается новый Connection)
  const connection = useMemo(
    () => new Connection('http://103.167.235.81/api/rpc-proxy'),
    []
  );

  // Получение текущего баланса
  useEffect(() => {
    if (!isOpen || !wallet.connected || !wallet.publicKey) return;

    let isMounted = true;

    const fetchBalance = async () => {
      try {
        const lamports = await connection.getBalance(wallet.publicKey);
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
  }, [isOpen, wallet.connected, wallet.publicKey, connection]);

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
    if (!wallet.connected || !wallet.publicKey) {
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
        fromPubkey: wallet.publicKey,
        stakePubkey: stakeAccount.publicKey,
        authorized: {
          staker: wallet.publicKey,
          withdrawer: wallet.publicKey
        },
        lamports
      });

      // 2. Делегирование на валидатора
      const delegateIx = StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: wallet.publicKey,
        votePubkey: VOTE_ACCOUNT
      });

      const tx = new Transaction().add(createIx, delegateIx);

      if (!window.confirm(`Вы хотите застейкать ${num} SOL на валидатор?`)) {
        setMessage('❌ Пользователь отменил стейк');
        return;
      }

      setMessage('⏳ Отправка транзакции...');

      const signature = await wallet.sendTransaction(tx, connection, {
        signers: [stakeAccount]
      });

      await connection.confirmTransaction(signature, 'finalized');

      setMessage(`✅ Stake успешно отправлен! Tx: ${signature}`);

      // Закрываем попап спустя 1 сек
      setTimeout(onClose, 1000);

    } catch (err: unknown) {
      console.error(err);
      setMessage(err instanceof Error ? '❌ Ошибка: ' + err.message : '❌ Неизвестная ошибка');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="stake-popup-overlay">
      <div className="stake-popup-content">

        <h2>Stake SOL</h2>
        <p>Wallet: {wallet.connected ? wallet.publicKey?.toBase58() : 'Not connected'}</p>
        <p>
          Available balance:{' '}
          {availableBalance !== null
            ? `${availableBalance.toFixed(3)} SOL`
            : wallet.connected
              ? 'Loading...'
              : 'Connect wallet'}
        </p>

        <input
          type="number"
          placeholder={`${MIN_STAKE} SOL`}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 12 }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose}>Cancel</button>
          <StakeButton onClick={handleConfirm} />
        </div>

        {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </div>
    </div>
  );
};
