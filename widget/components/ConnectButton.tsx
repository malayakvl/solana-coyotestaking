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
      // When we receive a global state update, we should update our state
      setGlobalState(newGlobalState);
      
      // Handle disconnect from other buttons - reset to initial state
      if (!newGlobalState.connected) {
        console.log('ConnectButton: Global disconnect received, resetting to initial state');
        try {
          // Disconnect locally if connected
          if (connected) {
            disconnect();
          }
          // Even if not connected, but wallet is selected, we need to clear the selection
          else if (wallet && newGlobalState.walletName === null) {
            // This is a forced reset from another button, we need to clear our local state
            console.log('ConnectButton: Clearing local wallet selection');
            // We can't directly clear the wallet selection, but we can force a re-render
            // by updating our local state to match the global state
          }
        } catch (error) {
          console.error('ConnectButton: Error during disconnect', error);
        }
      }
      
      // If we receive a wallet selection from another button, try to select the same wallet
      if (newGlobalState.walletName && wallets.length > 0 && !wallet) {
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

    // Handle wallet selection
    if (walletChanged && currentWalletName) {
      console.log('ConnectButton: Wallet selected', currentWalletName);
      window.updateGlobalWalletState({
        walletName: currentWalletName
      });
    }

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
    // Handle disconnection - reset to initial state
    else if (connectedChanged && !currentConnected) {
      console.log('ConnectButton: Wallet disconnected, resetting to initial state');
      window.updateGlobalWalletState({
        connected: false,
        publicKey: null,
        walletName: null  // Reset wallet name to null to return to initial state
      });
      hasSentInitialState.current = false;
    }
    // Handle wallet deselection (when user manually clears wallet selection)
    else if (walletChanged && !currentWalletName && !currentConnected) {
      console.log('ConnectButton: Wallet deselected, resetting to initial state');
      window.updateGlobalWalletState({
        connected: false,
        publicKey: null,
        walletName: null
      });
      hasSentInitialState.current = false;
    }
    // Handle wallet selection without connection
    else if (!currentConnected && currentWalletName && !hasSentInitialState.current) {
      console.log('ConnectButton: Wallet selected but not connected', currentWalletName);
      window.updateGlobalWalletState({
        walletName: currentWalletName
      });
    }
  }, [connected, publicKey, wallet]);

  // Determine which state to use (global state is the absolute truth)
  const effectiveConnected = globalState?.connected ?? false;
  const effectivePublicKey = globalState?.publicKey ?? null;
  const effectiveWalletName = globalState?.walletName ?? null;
  
  // For Solflare specifically, we need to ensure proper state reset
  const shouldShowInitial = !effectiveConnected && !effectiveWalletName;
  const walletInstance = shouldShowInitial ? null : wallet;

  console.log('ConnectButton: Render with state', {
    localConnected: connected,
    globalConnected: globalState?.connected,
    effectiveConnected,
    localPublicKey: publicKey?.toBase58(),
    globalPublicKey: globalState?.publicKey,
    effectivePublicKey,
    walletName: wallet?.adapter?.name,
    effectiveWalletName,
    localWallet: wallet?.adapter?.name,
    shouldShowInitial
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
  if (walletInstance && walletInstance.adapter) {
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