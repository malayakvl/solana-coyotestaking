'use client';

import React, { useEffect, useState } from 'react';
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
  // const isUpdatingFromLocal = useRef(false);
  const previousWalletName = useRef<string | null>(null);
  const previousConnectedState = useRef<boolean>(false);

interface GlobalWalletState {
  connected: boolean;
  publicKey: string | null;
  walletName: string | null;
}

declare global {
  interface Window {
    globalWalletState?: GlobalWalletState;
    updateGlobalWalletState?: (state: Partial<GlobalWalletState>) => void;
    subscribeToGlobalWalletState?: (cb: (state: GlobalWalletState) => void) => () => void;
  }
}

export const ConnectButton = () => {
  const { wallet, connected, publicKey, disconnect } = useWallet();
  const [globalState, setGlobalState] = useState<GlobalWalletState>({
    connected: false,
    publicKey: null,
    walletName: null,
  });

  useEffect(() => {
    if (!window.updateGlobalWalletState) {
      const subs = new Set<(s: GlobalWalletState) => void>();
      window.globalWalletState = { connected: false, publicKey: null, walletName: null };

      window.updateGlobalWalletState = (newState) => {
        window.globalWalletState = { ...window.globalWalletState!, ...newState };
        subs.forEach(cb => cb(window.globalWalletState!));
      };

      window.subscribeToGlobalWalletState = (cb) => {
        subs.add(cb);
        return () => subs.delete(cb);
      };
    }
  }, []);

  useEffect(() => {
    const unsub = window.subscribeToGlobalWalletState?.(setGlobalState);
    if (window.globalWalletState) setGlobalState(window.globalWalletState);
    return unsub;
  }, []);

    // Handle connection
    if (connectedChanged && currentConnected && publicKey) {
      console.log('ConnectButton: Wallet connected', {
        connected: true,
        publicKey: publicKey.toBase58(),
        walletName: currentWalletName
      });
      
      // Expose wallet signing functions globally when connected
      if (typeof window !== 'undefined' && wallet?.adapter) {
        // Log available wallet adapter methods for debugging
        console.log('Wallet adapter methods:', Object.keys(wallet.adapter));
        console.log('Wallet adapter sendTransaction:', typeof wallet.sendTransaction);
        console.log('Wallet adapter signTransaction:', typeof wallet.signTransaction);
        console.log('Wallet adapter signAllTransactions:', typeof wallet.signAllTransactions);
        
        // Check each function before exposing
        if (wallet.sendTransaction) {
          window.globalWalletSendTransaction = wallet.sendTransaction.bind(wallet);
        } else {
          console.warn('Wallet does not have sendTransaction function');
          delete window.globalWalletSendTransaction;
        }
        
        if (wallet.signTransaction) {
          window.globalWalletSignTransaction = wallet.signTransaction.bind(wallet);
        } else {
          console.warn('Wallet does not have signTransaction function');
          delete window.globalWalletSignTransaction;
        }
        
        if (wallet.signAllTransactions) {
          window.globalWalletSignAllTransactions = wallet.signAllTransactions.bind(wallet);
        } else {
          console.warn('Wallet does not have signAllTransactions function');
          delete window.globalWalletSignAllTransactions;
        }
      }
      
      window.updateGlobalWalletState({
        connected: true,
        publicKey: publicKey.toBase58(),
        walletName: name,
      });
      
      hasSentInitialState.current = true;
    } 
    // Handle disconnection - reset to initial state completely
    else if (connectedChanged && !currentConnected) {
      console.log('ConnectButton: Wallet disconnected, resetting to initial state');
      
      // Remove global wallet signing functions when disconnected
      if (typeof window !== 'undefined') {
        delete window.globalWalletSendTransaction;
        delete window.globalWalletSignTransaction;
        delete window.globalWalletSignAllTransactions;
      }
      
      window.updateGlobalWalletState({
        connected: false,
        publicKey: null,
        walletName: null,
      });
    } else if (name) {
      window.updateGlobalWalletState?.({ walletName: name });
    }
  }, [connected, publicKey, wallet?.adapter?.name]);

  // Global function for staking
  useEffect(() => {
    if (!connected || !publicKey || !wallet?.adapter) {
      delete (window).globalWalletSignTransaction;
      delete (window).globalWalletSignAllTransactions;
      delete (window).globalWalletSignTransaction;
      return;
    }
    const a = wallet.adapter;
    (window).globalWalletSignTransaction = (tx) => a.signTransaction!(tx);
    (window).globalWalletSignAllTransactions = (txs) => a.signAllTransactions!(txs);
    (window).globalWalletSendTransaction = (tx, c, o) => a.sendTransaction!(tx, c, o);
  }, [connected, publicKey, wallet]);

  const { connected: gConnected, publicKey: gPubkey, walletName: gWalletName } = globalState;
  const icon = gWalletName ? WALLET_ICONS[gWalletName] || '/wallets/phantom.svg' : null;

  // 1. Connected
  if (gConnected && gPubkey) {
    return (
      <WalletMultiButton
        className="wallet-btn !bg-gradient-to-r !from-purple-600 !to-pink-600 !shadow-lg"
        onClick={() => {
          disconnect();
          window.updateGlobalWalletState?.({ connected: false, publicKey: null, walletName: null });
        }}
      >
        <div className="flex items-center gap-3">
          {icon && <span className={`i-wallet-${gWalletName?.toLowerCase()}`} />}
          <div>
            <span className="text-connected">• Connected</span>
            {/* <span className="text-connected-key">{gPubkey.slice(0, 2)}...{gPubkey.slice(-2)}</span> */}
          </div>
        </div>
      </WalletMultiButton>
    );
  }

  // 2. Wallet selected
  if (gWalletName) {
    return (
      <WalletMultiButton 
        className="wallet-btn !bg-white/10 !backdrop-blur-xl !border !border-white/20"
      >
        <div className="flex items-center gap-3">
          {icon && <span className={`i-wallet-${gWalletName?.toLowerCase()}`} />}
          <span className="text-connect">Connect</span>
        </div>
      </WalletMultiButton>
    );
  }

  // 3. Nothing selected
  return (
    
    <WalletMultiButton 
      className="wallet-btn"
    >
      <div className="flex items-center gap-3 btn-s-wallet">
        <i className="pi-wallet text-xl"></i>
        <span className="font-bold">Wallet</span>
      </div>
    </WalletMultiButton>
  );
};