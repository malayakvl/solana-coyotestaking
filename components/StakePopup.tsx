'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  StakeProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  Keypair,
  Connection
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
  const [uptime, setUptime] = useState<string>('Loading...');
  const [skipRate, setSkipRate] = useState<string>('Loading...');
  const [jiitoMev, setJiitoMev] = useState<string>('Loading...');
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);

  const wallet = useWallet();
  // const connection = new Connection('http://103.167.235.81:8899');
  const PROXY_URL = 'http://103.167.235.81/api/rpc-proxy'; // или /rpc-proxy-test для теста
  const connection = new Connection(PROXY_URL);
  const hasFetchedRef = React.useRef(false);

  // Получение метрик валидатора
  const fetchValidatorMetrics = async () => {
    try {
      const resp = await fetch(`https://api.stakewiz.com/validator/${VOTE_ACCOUNT.toBase58()}`);
      const data = await resp.json();
      setUptime(`${data.uptime}%`);
      setSkipRate(`${Math.round(data.skip_rate * 100) / 100}%`);
    } catch {
      setUptime('?');
      setSkipRate('?');
    }

    try {
      const resp = await fetch(
        `https://kobe.mainnet.jito.network/api/v1/steward_events?limit=1&event_type=ScoreComponentsV2&vote_account=${VOTE_ACCOUNT.toBase58()}`
      );
      const data = await resp.json();
      const score = Math.round(data.events[0].data.score * 100 * 100) / 100;
      setJiitoMev(score.toString());
    } catch {
      setJiitoMev('?');
    }
  };

  // Clear message and reset fetch flag when popup opens
  React.useLayoutEffect(() => {
    if (isOpen) {
      setMessage('');
      hasFetchedRef.current = false;
    }
  }, [isOpen]);

  // Fetch validator metrics when popup opens
  React.useEffect(() => {
    if (isOpen && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchValidatorMetrics();
    }
  }, [isOpen]);

  // Получение баланса кошелька
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchBalance = async () => {
      if (!wallet.connected || !wallet.publicKey) {
        setAvailableBalance(null);
        return;
      }
      
      try {
        const lamports = await connection.getBalance(wallet.publicKey);
        const balanceInSol = lamports / LAMPORTS_PER_SOL;
        setAvailableBalance(balanceInSol);
      } catch (err) {
        console.error('Ошибка получения баланса:', err);
        setAvailableBalance(null);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 15000); // обновляем каждые 15 секунд
    return () => clearInterval(interval);
  }, [isOpen, wallet.connected, wallet.publicKey]);

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

      console.log('Prepared stake transaction:', transaction);
      setMessage(`⚡ Готово к отправке: ${num} SOL`);

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
    <div className="stake-popup-overlay">
      <div className="stake-popup-content">
        <div className="stake-popup-header-logo"></div>
        <h2>Stake SOL</h2>

        <div style={{ marginBottom:12 }}>
          <p><strong>Validator Metrics:</strong></p>
          <p>Uptime: {uptime}</p>
          <p>Skip Rate: {skipRate}</p>
          <p>Jiito MEV Score: {jiitoMev}</p>
        </div>

        <p>Wallet: {wallet.connected ? wallet.publicKey?.toBase58() : 'Not connected'}</p>
        <p>Available balance: {availableBalance !== null ? availableBalance.toFixed(3) + ' SOL' : wallet.connected ? 'Loading...' : 'Connect wallet'}</p>

        <input
          type="number"
          placeholder={`${MIN_STAKE} SOL`}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ width:'100%', padding:8, marginBottom:12 }}
        />

        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button onClick={handleConfirm} style={{ padding:'8px 12px', background:'purple', color:'white', borderRadius:6 }}>Confirm</button>
          <button onClick={onClose} style={{ padding:'8px 12px', marginLeft:10 }}>Cancel</button>
        </div>

        {message && <p style={{ marginTop:12 }}>{message}</p>}
      </div>
    </div>
  );
};