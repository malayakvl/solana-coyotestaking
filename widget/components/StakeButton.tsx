'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { StakePopup } from './StakePopup';

export const StakeButton = () => {
  const wallet = useWallet(); // ← ВАЖНО: берём ВЕСЬ wallet объект
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [globalWalletState, setGlobalWalletState] = useState<any>(null);
  const [effectiveWalletState, setEffectiveWalletState] = useState<any>(null);

  // 🔹 Подписка на глобальный кошелек (mobile / WebView)
  useEffect(() => {
    if (!window.subscribeToGlobalWalletState) return;

    const unsubscribe = window.subscribeToGlobalWalletState((newState) => {
      setGlobalWalletState(newState);
    });

    if (window.globalWalletState) {
      setGlobalWalletState(window.globalWalletState);
    }

    return () => unsubscribe && unsubscribe();
  }, []);

  const effectiveWallet =
  // 🟢 DESKTOP PHANTOM (через wallet-adapter, БЕЗ signTransaction)
  wallet.sendTransaction && globalWalletState?.connected
    ? {
        connected: true,
        publicKey: new PublicKey(globalWalletState.publicKey), // 🔥 ВАЖНО
        sendTransaction: wallet.sendTransaction,              // 🔥 ЕДИНСТВЕННО НУЖНО
      }

  // 🟡 MOBILE / WEBVIEW
  : globalWalletState?.connected &&
    window.globalWalletSendTransaction
    ? {
        connected: true,
        publicKey: new PublicKey(globalWalletState.publicKey),
        sendTransaction: window.globalWalletSendTransaction,
        signTransaction: window.globalWalletSignTransaction,
      }

  : null;

  useEffect(() => {
  if (globalWalletState?.connected) {
    setEffectiveWalletState({
      connected: true,
      publicKey: new PublicKey(globalWalletState.publicKey),
      sendTransaction: wallet.sendTransaction || window.globalWalletSendTransaction,
      signTransaction: wallet.signTransaction || window.globalWalletSignTransaction,
    });
  } else {
    setEffectiveWalletState(null);
  }
}, [wallet, globalWalletState]);

  console.log('🧪 StakeButton DEBUG');
  console.log('wallet.connected:', wallet.connected);
  console.log('wallet.publicKey:', wallet.publicKey?.toBase58?.());
  console.log('wallet.sendTransaction:', typeof wallet.sendTransaction);
  console.log('globalWalletState:', globalWalletState);
  console.log('effectiveWallet:', effectiveWallet);

  const handleStake = () => {
    if (!effectiveWalletState || !effectiveWalletState.connected) {
      setErrorMessage('Please connect your wallet first!');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setIsPopupOpen(true);
  };

  const handleClosePopup = () => setIsPopupOpen(false);

  return (
    <>
      <button onClick={handleStake} className="stake-sol-btn">
        Stake SOL
      </button>

      {errorMessage && <div className="stake-btn-error">{errorMessage}</div>}

      {/* 🔥 Рендерим popup ТОЛЬКО если effectiveWallet есть */}
      {effectiveWallet && (
        <StakePopup
          isOpen={isPopupOpen}
          onClose={handleClosePopup}
          wallet={effectiveWalletState}
          devModeEnabled={true}
        />
      )}
    </>
  );
};
