'use client';

import React, { useEffect, useState, useRef } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

export const ConnectButton = () => {
  const { wallet, connected, publicKey, wallets, select, disconnect } = useWallet();
  const [globalState, setGlobalState] = useState<{
    connected: boolean;
    publicKey: string | null;
    walletName: string | null;
  } | null>(null);
  const hasSentInitialState = useRef(false);
  const isUpdatingFromLocal = useRef(false);
  const previousWalletName = useRef<string | null>(null);
  const previousConnectedState = useRef<boolean>(false);

  // Subscribe to global wallet state changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.subscribeToGlobalWalletState) {
      return;
    }

    const unsubscribe = window.subscribeToGlobalWalletState((newGlobalState) => {
      console.log('ConnectButton: Received global state update', newGlobalState);
      setGlobalState(newGlobalState);
      
      // Handle disconnect - reset to initial state
      if (!newGlobalState.connected) {
        console.log('ConnectButton: Global disconnect received');
        // Always disconnect locally if we're connected
        if (connected) {
          try {
            disconnect();
          } catch (error) {
            console.error('ConnectButton: Error disconnecting', error);
          }
        }
      }
      
      // Handle wallet selection from other buttons
      if (newGlobalState.walletName && wallets.length > 0 && !connected) {
        const matchingWallet = wallets.find(w => w.adapter.name === newGlobalState.walletName);
        if (matchingWallet && (!wallet || wallet.adapter.name !== newGlobalState.walletName)) {
          console.log('ConnectButton: Auto-selecting wallet', newGlobalState.walletName);
          try {
            select(matchingWallet.adapter.name);
          } catch (error) {
            console.error('ConnectButton: Error auto-selecting wallet', error);
          }
        }
      }
    });

    // Get initial state
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
  }, [wallet, wallets, select, disconnect, connected]);
  
  // Emit events when this button's state changes (but only for genuine user actions)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.updateGlobalWalletState) {
      return;
    }

    const currentWalletName = wallet?.adapter?.name || null;
    const currentConnected = connected;
    
    // Detect changes in wallet or connection state
    const walletChanged = currentWalletName !== previousWalletName.current;
    const connectedChanged = currentConnected !== previousConnectedState.current;
    
    // Update previous states
    previousWalletName.current = currentWalletName;
    previousConnectedState.current = currentConnected;
    
    console.log('ConnectButton: State change detected', {
      walletChanged,
      connectedChanged,
      currentWalletName,
      currentConnected,
      hasSentInitialState: hasSentInitialState.current
    });

    // Handle connection
    if (connectedChanged && currentConnected && publicKey) {
      console.log('ConnectButton: Wallet connected', {
        connected: true,
        publicKey: publicKey.toBase58(),
        walletName: currentWalletName
      });
      
      window.updateGlobalWalletState({
        connected: true,
        publicKey: publicKey.toBase58(),
        walletName: currentWalletName
      });
      
      hasSentInitialState.current = true;
    } 
    // Handle disconnection - reset to initial state completely
    else if (connectedChanged && !currentConnected) {
      console.log('ConnectButton: Wallet disconnected, resetting to initial state');
      window.updateGlobalWalletState({
        connected: false,
        publicKey: null,
        walletName: null  // This is crucial - reset wallet name to null
      });
      hasSentInitialState.current = false;
    }
    // Handle wallet selection
    else if (walletChanged && currentWalletName) {
      console.log('ConnectButton: Wallet selected', currentWalletName);
      window.updateGlobalWalletState({
        walletName: currentWalletName
      });
    }
    // Handle wallet deselection (return to initial state)
    else if (walletChanged && !currentWalletName && !currentConnected) {
      console.log('ConnectButton: Wallet deselected, returning to initial state');
      window.updateGlobalWalletState({
        connected: false,
        publicKey: null,
        walletName: null
      });
    }
  }, [connected, publicKey, wallet]);

  // Determine which state to use (global state is the absolute truth)
  const effectiveConnected = globalState?.connected ?? false;
  const effectivePublicKey = globalState?.publicKey ?? null;
  const effectiveWalletName = globalState?.walletName ?? null;
  
  // If global state has a wallet selected but not connected, use that wallet
  const walletInstance = effectiveWalletName && !effectiveConnected 
    ? wallets.find(w => w.adapter.name === effectiveWalletName) || wallet
    : wallet;

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
      <WalletMultiButton 
        className="wallet-btn"
        onClick={async (e) => {
          // Handle disconnect action
          e.preventDefault();
          console.log('ConnectButton: User initiated disconnect');
          try {
            await disconnect();
          } catch (error) {
            console.error('ConnectButton: Error during disconnect', error);
          }
        }}
      >
        <div className="flex items-center relative">
          <span className="w-caption">{effectivePublicKey.substring(0, 4) + '..' + effectivePublicKey.substring(effectivePublicKey.length - 4)}</span>
        </div>
      </WalletMultiButton>
    );
  }

  // State 2: Wallet selected but not connected - show wallet icon and "Connect"
  if (walletInstance && walletInstance.adapter && effectiveWalletName) {
    return (
      <WalletMultiButton 
        className="wallet-btn"
        onClick={async (e) => {
          // Handle connect action
          e.preventDefault();
          console.log('ConnectButton: User initiated connect');
          // The wallet adapter will handle the connection flow
        }}
      >
        <div className="flex items-center relative">
          <span className="w-caption">Connect</span>
        </div>
      </WalletMultiButton>
    );
  }

  // State 1: No wallet selected - show pi-wallet icon and "Wallet"
  return (
    <WalletMultiButton 
      className="wallet-btn"
      onClick={async (e) => {
        // Handle wallet selection
        e.preventDefault();
        console.log('ConnectButton: User initiated wallet selection');
        // The wallet adapter will handle the wallet selection flow
      }}
    >
      <div className="flex items-center btn-s-wallet">
        <i className="pi-wallet"></i>
        <span className="w-caption">Wallet</span>
      </div>
    </WalletMultiButton>
  );
};