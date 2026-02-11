'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { StakePopup } from './StakePopup';
import { GlobalWalletState } from '../types';
import { relative } from 'path';

interface StakeButtonProps {
  className?: string;
  onClick?: () => void;
}

export const StakeButton = ({ className, onClick }: StakeButtonProps) => {
  const wallet = useWallet(); // adapter
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [globalState, setGlobalState] = useState<GlobalWalletState>({
    connected: false,
    publicKey: null,
    walletName: null,
  });
  const hasWallet = wallet.connected && wallet.publicKey
    || globalState.connected && globalState.publicKey;
  console.log('hasWallet', hasWallet);

  // Подписка на глобальный state
  useEffect(() => {
    if (window.subscribeToGlobalWalletState) {
      const unsub = window.subscribeToGlobalWalletState(setGlobalState);
      setGlobalState(window.globalWalletState || { connected: false, publicKey: null, walletName: null });
      return unsub;
    }
  }, []);

  // Wait for Solflare to be ready
  const waitForSolflare = async () => {
    if (typeof window === 'undefined' || !window.solflare) return false;
    try {
      await window.solflare.connect(); // если уже подключен, вернется сразу
      return window.solflare.isConnected && !!window.solflare.publicKey;
    } catch (e) {
      console.warn('Solflare connect failed', e);
      return false;
    }
  };

  const handleStake = async () => {
    if (onClick) onClick();

    // Adapter напрямую (Phantom / Solflare)
    const adapterConnected = wallet.connected && wallet.publicKey;

    // Глобальное состояние (Backpack)
    const backpackConnected = globalState.connected && globalState.publicKey;

    // 1️⃣ Adapter напрямую
    if (wallet.connected && wallet.publicKey) {
      setIsPopupOpen(true);
      return;
    }

    // 2️⃣ Глобальное состояние
    if (globalState.connected && globalState.publicKey) {
      setIsPopupOpen(true);
      return;
    }

    // 3️⃣ Solflare special case через localStorage
    const stored = localStorage.getItem('walletState');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.connected && parsed.walletName === 'Solflare') {
        console.log('⚡ Solflare detected in localStorage, waiting for adapter...');
        try {
          // ждем пока adapter реально подключится
          const solflareWallet = await window.solflare.connect();
          if (window.solflare.isConnected && window.solflare.publicKey) {
            // теперь передаем в popup корректные props
            const newState = {
              connected: true,
              publicKey: window.solflare.publicKey.toString(),
              walletName: 'Solflare',
            };
            if (window.updateGlobalWalletState) {
              window.updateGlobalWalletState(newState);
            }
            setGlobalState(newState);
            setIsPopupOpen(true);
            return;
          }
        } catch (e) {
          console.warn('Solflare connect failed', e);
        }
      }
    }
    // if (globalState.walletName === 'Backpack' && !globalState.connected) {
    //   console.log('⚡ Backpack detected in localStorage, waiting for adapter...');
    //   try {
    //     await window.backpack.connect();
    //     if (window.backpack.connected && window.backpack.publicKey) {
    //       // теперь передаем в popup корректные props
    //       const newState = {
    //         connected: true,
    //         publicKey: window.backpack.publicKey.toString(),
    //         walletName: 'Backpack',
    //       };
    //       if (window.updateGlobalWalletState) {
    //         window.updateGlobalWalletState(newState);
    //       }
    //       setGlobalState(newState);
    //       setIsPopupOpen(true);
    //       return;
    //     }
    //   } catch (e) {
    //     console.warn('Backpack connect failed', e);
    //   }
    // }

    setErrorMessage('Please connect your wallet first.');
    setTimeout(() => setErrorMessage(null), 5000);
  };


  const handleClosePopup = () => setIsPopupOpen(false);

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={handleStake} className={className || "stake-sol-btn"}>
        Stake SOL
      </button>

      {errorMessage && (

        <div className="stake-btn-error" style={{
          padding: '0px',
          backgroundColor: '#fff8e6',
          color: '#e67e22',
          border: '1px solid #ffd54f',
          borderRadius: '8px',
          fontSize: '13px',
          textAlign: 'center',
          position: 'absolute',
          top: '90px',
          left: '0',
          right: '0',
          fontWeight: 500,
          zIndex: 10,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}>
          {errorMessage}
        </div>

      )}

      {isPopupOpen && (
        <StakePopup
          isOpen={isPopupOpen}
          onClose={handleClosePopup}
          wallet={wallet}
          globalPublicKey={globalState.publicKey}
          globalWalletName={globalState.walletName}
          devModeEnabled={true}
        />
      )}
    </div>
  );
};