'use client';

import React, { useEffect, useState, useRef } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

export const ConnectButton = () => {
  const { wallet, connected, publicKey, wallets, select } = useWallet();
  const [globalState, setGlobalState] = useState<{
    connected: boolean;
    publicKey: string | null;
    walletName: string | null;
  } | null>(null);
  const hasSentInitialState = useRef(false);
  const isUpdatingFromLocal = useRef(false);

  // Subscribe to global wallet state changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.subscribeToGlobalWalletState) {
      return;
    }

    const unsubscribe = window.subscribeToGlobalWalletState((newGlobalState) => {
      console.log('ConnectButton: Received global state update', newGlobalState);
      // When we receive a global state update, we should update our state
      setGlobalState(newGlobalState);
      // Reset the flag so we can send updates again if needed
      isUpdatingFromLocal.current = false;
      
      // If we receive a wallet selection from another button, try to select the same wallet
      if (newGlobalState.walletName && !wallet && wallets.length > 0) {
        const matchingWallet = wallets.find(w => w.adapter.name === newGlobalState.walletName);
        if (matchingWallet) {
          console.log('ConnectButton: Auto-selecting wallet', newGlobalState.walletName);
          try {
            select(matchingWallet.adapter.name);
          } catch (error) {
            console.error('ConnectButton: Error auto-selecting wallet', error);
          }
        }
      }
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
  }, [wallet, wallets, select]);

  // Emit events when this button's state changes (but only for genuine user actions)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.updateGlobalWalletState || isUpdatingFromLocal.current) {
      return;
    }

    // Only send updates when we have a real connection state change initiated by user
    if (connected && publicKey && !hasSentInitialState.current) {
      console.log('ConnectButton: Updating global state - connected', {
        connected: true,
        publicKey: publicKey.toBase58(),
        walletName: wallet?.adapter?.name || null
      });
      
      window.updateGlobalWalletState({
        connected: true,
        publicKey: publicKey.toBase58(),
        walletName: wallet?.adapter?.name || null
      });
      
      hasSentInitialState.current = true;
    } else if (connected && publicKey) {
      // Update global state when connection details change
      window.updateGlobalWalletState({
        connected: true,
        publicKey: publicKey.toBase58(),
        walletName: wallet?.adapter?.name || null
      });
    } else if (!connected && hasSentInitialState.current) {
      // Only send disconnect if we previously sent a connect event
      console.log('ConnectButton: Updating global state - disconnected');
      window.updateGlobalWalletState({
        connected: false,
        publicKey: null,
        walletName: null
      });
      hasSentInitialState.current = false;
    }
    
    // Also send wallet selection updates
    if (wallet?.adapter?.name && (!globalState || globalState.walletName !== wallet.adapter.name)) {
      console.log('ConnectButton: Updating global state - wallet selected', wallet.adapter.name);
      window.updateGlobalWalletState({
        walletName: wallet.adapter.name
      });
    }
  }, [connected, publicKey, wallet, globalState]);

  // Determine which state to use (global state is the absolute truth)
  const effectiveConnected = globalState?.connected ?? false;
  const effectivePublicKey = globalState?.publicKey ?? null;
  const effectiveWalletName = globalState?.walletName ?? null;
  const walletInstance = wallet;

  console.log('ConnectButton: Render with state', {
    localConnected: connected,
    globalConnected: globalState?.connected,
    effectiveConnected,
    localPublicKey: publicKey?.toBase58(),
    globalPublicKey: globalState?.publicKey,
    effectivePublicKey,
    walletName: wallet?.adapter?.name,
    effectiveWalletName,
    localWallet: wallet?.adapter?.name
  });

  // State 3: Wallet connected - show wallet icon and public key
  if (effectiveConnected && effectivePublicKey) {
    return (
      <WalletMultiButton className="wallet-btn">
        <div className="flex items-center relative">
          <span className="w-caption">{effectivePublicKey.substring(0, 4) + '..' + effectivePublicKey.substring(effectivePublicKey.length - 4)}</span>
        </div>
      </WalletMultiButton>
    );
  }

  // State 2: Wallet selected but not connected - show wallet icon and "Connect"
  if (walletInstance && walletInstance.adapter) {
    return (
      <WalletMultiButton className="wallet-btn">
        <div className="flex items-center relative">
          <span className="w-caption">Connect</span>
        </div>
      </WalletMultiButton>
    );
  }

  // State 1: No wallet selected - show pi-wallet icon and "Wallet"
  return (
    <WalletMultiButton className="wallet-btn">
      <div className="flex items-center btn-s-wallet">
        <i className="pi-wallet"></i>
        <span className="w-caption">Wallet</span>
      </div>
    </WalletMultiButton>
  );
};