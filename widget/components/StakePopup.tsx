'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  Keypair,
  StakeProgram,
  Authorized,
  Lockup
} from '@solana/web3.js';
import { StakeButton } from './StakeButton'; // 👈 Импортируем локально

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

  // Используем proxy роут Laravel
  const connection = new Connection('http://103.167.235.81/api/rpc-proxy');

  // Получение баланса кошелька
  useEffect(() => {
    if (!isOpen || !wallet.connected || !wallet.publicKey) return;

    const fetchBalance = async () => {
      try {
        const lamports = await connection.getBalance(wallet.publicKey);
        setAvailableBalance(lamports / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error('Ошибка получения баланса:', err);
        setAvailableBalance(null);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 15000); // обновляем каждые 15 сек
    return () => clearInterval(interval);
  }, [isOpen, wallet.connected, wallet.publicKey]);

  // Обработчик стейка
  const handleConfirm = async () => {
    const num = parseFloat(amount);
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
      const stakeAccount = Keypair.generate();
      const rentExempt = 0.00228288 * LAMPORTS_PER_SOL;
      const lamports = num * LAMPORTS_PER_SOL + rentExempt;

      const createTx = StakeProgram.createAccount({
        fromPubkey: wallet.publicKey,
        stakePubkey: stakeAccount.publicKey,
        authorized: { staker: wallet.publicKey, withdrawer: wallet.publicKey },
        lamports
      });

      const delegateTx = StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: wallet.publicKey,
        votePubkey: VOTE_ACCOUNT
      });

      const transaction = new Transaction().add(createTx, delegateTx);

      if (!window.confirm(`Вы хотите застейкать ${num} SOL на валидатор?`)) {
        setMessage('❌ Пользователь отменил стейк');
        return;
      }

      setMessage('⏳ Отправка транзакции...');
      const signature = await wallet.sendTransaction(transaction, connection, { signers: [stakeAccount] });
      await connection.confirmTransaction(signature, 'finalized');

      setMessage(`✅ Stake успешно отправлен! Tx: ${signature}`);
      onClose();

    } catch (err: unknown) {
      console.error(err);
      setMessage(err instanceof Error ? '❌ Ошибка: ' + err.message : '❌ Неизвестная ошибка');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position:'fixed', top:0, left:0, right:0, bottom:0,
      background:'rgba(0,0,0,0.5)', display:'flex',
      justifyContent:'center', alignItems:'center', zIndex:9999
    }}>
      <div style={{ background:'white', padding:20, borderRadius:10, minWidth:320 }}>
        <h2>Stake SOL</h2>
        <p>Wallet: {wallet.connected ? wallet.publicKey?.toBase58() : 'Not connected'}</p>
        <p>Available balance: {availableBalance !== null ? availableBalance.toFixed(3) + ' SOL' : wallet.connected ? 'Loading...' : 'Connect wallet'}</p>

        <input
          type="number"
          placeholder={`${MIN_STAKE} SOL`}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ width:'100%', padding:8, marginBottom:12 }}
        />

        <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button onClick={onClose}>Cancel</button>
          <StakeButton onClick={handleConfirm} />
        </div>

        {message && <p style={{ marginTop:12 }}>{message}</p>}
      </div>
    </div>
  );
};
