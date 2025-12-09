'use client';
import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { StakePopup } from './StakePopup';

export const StakeButton = () => {
  const { connected } = useWallet();
  const [globalState, setGlobalState] = useState<{
    connected: boolean;
    publicKey: string | null;
    walletName: string | null;
  } | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Subscribe to global wallet state changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.subscribeToGlobalWalletState) {
      return;
    }

    const unsubscribe = window.subscribeToGlobalWalletState((newGlobalState) => {
      console.log('StakeButton: Received global state update', newGlobalState);
      setGlobalState(newGlobalState);
    });

    setTimeout(() => {
      if (window.globalWalletState) {
        setGlobalState(window.globalWalletState);
      }
    }, 0);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Determine which state to use
  const effectiveConnected = globalState?.connected ?? false;

  console.log('StakeButton: Render with state', {
    localConnected: connected,
    globalConnected: globalState?.connected,
    effectiveConnected,
  });

  const handleStake = () => {
    if (!effectiveConnected) {
      setErrorMessage('Please connect your wallet first!');
      // Clear the error message after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <>
      <button 
        onClick={handleStake} 
        className="stake-sol-btn"
        title="Click to stake your SOL tokens"
      >
        Stake SOL
      </button>
      {errorMessage && (
        <div className="stake-btn-error">
          {errorMessage}
        </div>
      )}
      <StakePopup isOpen={isPopupOpen} onClose={handleClosePopup} devModeEnabled={true} />
    </>
  );
};