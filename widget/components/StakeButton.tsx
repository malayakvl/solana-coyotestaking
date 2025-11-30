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

  // Subscribe to global wallet state changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.subscribeToGlobalWalletState) {
      return;
    }

    const unsubscribe = window.subscribeToGlobalWalletState((newGlobalState) => {
      console.log('StakeButton: Received global state update', newGlobalState);
      setGlobalState(newGlobalState);
    });

    // Also get the initial state
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

  // Determine which state to use (global state is the absolute truth)
  const effectiveConnected = globalState?.connected ?? false;

  console.log('StakeButton: Render with state', {
    localConnected: connected,
    globalConnected: globalState?.connected,
    effectiveConnected,
  });

  const handleStake = () => {
    if (!effectiveConnected) return alert('Connect wallet first!');
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <>
      <button 
        onClick={handleStake} 
        style={{ 
          padding: '8px 12px', 
          marginLeft: 8,
          border: 'none',
          borderRadius: '5em',
          backgroundColor: '#ff8480',
          color: '#ffffff',
          fontSize: '22px',
          fontWeight: 700,
          textTransform: 'uppercase',
          cursor: 'pointer'
        }}
      >
        Stake SOL
      </button>
      <StakePopup isOpen={isPopupOpen} onClose={handleClosePopup} />
    </>
  );
};