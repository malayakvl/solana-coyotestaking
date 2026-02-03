'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

import { StakePopup } from './StakePopup';

interface StakeButtonProps {
  className?: string;
  onClick?: () => void;
}

export const StakeButton = ({ className, onClick }: StakeButtonProps) => {
  const walletContext = useWallet(); // ✅ Получаем ПОЛНЫЙ объект кошелька
  const walletData = useWallet();
  const { connected, publicKey, connecting, disconnecting, wallet } = useWallet();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [globalState, setGlobalState] = useState<GlobalWalletState>({
    connected: false,
    publicKey: null,
    walletName: null,
  });

  // Подписываемся на глобальное состояние
  useEffect(() => {
    if (window.subscribeToGlobalWalletState) {
      const unsubscribe = window.subscribeToGlobalWalletState(setGlobalState);
      // сразу берём текущее значение
      setGlobalState(window.globalWalletState || { connected: false, publicKey: null, walletName: null });
      return unsubscribe;
    }
  }, []);

  // 🔍 Проверяем подключение НАПРЯМУЮ через window
  const checkWalletDirectly = (): boolean => {
    if (typeof window !== 'undefined' && window.solana?.isConnected) return true;
    if (typeof window !== 'undefined' && window.phantom?.solana?.isConnected) return true;

    return false;
  };

  const handleStake = () => {
    if (onClick) onClick();

    // Самая надёжная проверка — глобальное состояние
    if (globalState.connected && globalState.publicKey) {
      console.log('Открываем попап по глобальному состоянию:', globalState.walletName);
      setIsPopupOpen(true);
      return;
    }

    // ✅ Сначала проверяем через wallet-adapter
    if (walletContext.connected && walletContext.publicKey) {
      setIsPopupOpen(true);
      return;
    }

    // ✅ Затем проверяем НАПРЯМУЮ через window
    if (checkWalletDirectly()) {
      setIsPopupOpen(true);
      return;
    }

    // ✅ Если не подключены - показываем ошибку
    setErrorMessage('Wallet not connected. Please connect your wallet first.');
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <>
      <button onClick={handleStake} className={className || "stake-sol-btn"}>
        Stake SOL
      </button>

      {errorMessage && (
        <div className="stake-btn-error" style={{
          marginTop: '10px',
          padding: '12px',
          backgroundColor: '#fff8e6',
          color: '#e67e22',
          border: '1px solid #ffd54f',
          borderRadius: '8px',
          fontSize: '14px',
          textAlign: 'center',
          fontWeight: 500,
        }}>
          {errorMessage}
        </div>
      )}

      {isPopupOpen && (
        <StakePopup
          isOpen={isPopupOpen}
          onClose={handleClosePopup}
          wallet={walletContext} // ✅ Передаём ПОЛНЫЙ объект кошелька
          globalPublicKey={globalState.publicKey}          // ← добавляем
          globalWalletName={globalState.walletName}        // на всякий случай
          devModeEnabled={true}
        />
      )}
    </>
  );
};