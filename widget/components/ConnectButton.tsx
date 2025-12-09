'use client';

import React, { useEffect, useState, useRef } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction, Connection } from '@solana/web3.js';

const WALLET_ICONS: Record<string, string> = {
  Phantom: '/wallets/phantom.svg',
  Coinbase: '/wallets/coinbase.png',
  Backpack: '/wallets/backpack.svg',
  Solflare: '/wallets/solflare.png',
  OKX: '/wallets/okx.svg',
  Brave: '/wallets/brave.svg',
  Trust: '/wallets/trust.svg',
  Ledger: '/wallets/ledger.svg',
};

interface GlobalWalletState {
  connected: boolean;
  publicKey: string | null;
  walletName: string | null;
}

// Define proper function types for wallet methods
type SendTransactionFn = (transaction: Transaction, connection: Connection, options?: Record<string, unknown>) => Promise<string>;
type SignTransactionFn = (transaction: Transaction) => Promise<Transaction>;
type SignAllTransactionsFn = (transactions: Transaction[]) => Promise<Transaction[]>;

declare global {
  interface Window {
    globalWalletState?: GlobalWalletState;
    updateGlobalWalletState?: (state: Partial<GlobalWalletState>) => void;
    subscribeToGlobalWalletState?: (cb: (state: GlobalWalletState) => void) => () => void;
    globalWalletSendTransaction?: SendTransactionFn;
    globalWalletSignTransaction?: SignTransactionFn;
    globalWalletSignAllTransactions?: SignAllTransactionsFn;
  }
}

const ConnectButton = () => {
  const { wallet, connected, publicKey, disconnect } = useWallet();
  const [globalState, setGlobalState] = useState<GlobalWalletState>({
    connected: false,
    publicKey: null,
    walletName: null,
  });
  
  const hasSentInitialState = useRef(false);
  const previousWalletName = useRef<string | null>(null);
  const previousConnectedState = useRef<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

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
    // Use setTimeout to avoid calling setState synchronously within effect
    setTimeout(() => {
      if (window.globalWalletState) setGlobalState(window.globalWalletState);
    }, 0);
    return unsub;
  }, []);

  // Update global state
  useEffect(() => {
    const name = wallet?.adapter?.name || null;
    const currentConnected = connected && !!publicKey;
    const previousConnected = previousConnectedState.current;
    const connectedChanged = currentConnected !== previousConnected;
    
    // Track previous states
    previousConnectedState.current = currentConnected;
    if (name) previousWalletName.current = name;

    // Handle connection
    if (connectedChanged && currentConnected && publicKey) {
      console.log('ConnectButton: Wallet connected', {
        connected: true,
        publicKey: publicKey.toBase58(),
        walletName: name
      });
      
      // Expose wallet signing functions globally when connected
      if (typeof window !== 'undefined' && wallet?.adapter) {
        // Check each function before exposing
        if (wallet.adapter.sendTransaction) {
          window.globalWalletSendTransaction = wallet.adapter.sendTransaction.bind(wallet.adapter) as SendTransactionFn;
        } else {
          console.warn('Wallet does not have sendTransaction function');
          delete window.globalWalletSendTransaction;
        }
        
        if (wallet.adapter.signTransaction) {
          window.globalWalletSignTransaction = wallet.adapter.signTransaction.bind(wallet.adapter) as SignTransactionFn;
        } else {
          console.warn('Wallet does not have signTransaction function');
          delete window.globalWalletSignTransaction;
        }
        
        if (wallet.adapter.signAllTransactions) {
          window.globalWalletSignAllTransactions = wallet.adapter.signAllTransactions.bind(wallet.adapter) as SignAllTransactionsFn;
        } else {
          console.warn('Wallet does not have signAllTransactions function');
          delete window.globalWalletSignAllTransactions;
        }
      }
      
      window.updateGlobalWalletState?.({
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
      
      window.updateGlobalWalletState?.({
        connected: false,
        publicKey: null,
        walletName: null,
      });
    } else if (name) {
      window.updateGlobalWalletState?.({ walletName: name });
    }
  }, [connected, publicKey, wallet?.adapter?.name]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const tooltip = tooltipRef.current;
    if (!wrapper || !tooltip) return;

    const updatePosition = () => {
      const wRect = wrapper.getBoundingClientRect();
      const tRect = tooltip.getBoundingClientRect();

      tooltip.classList.remove(
        "tooltip-top",
        "tooltip-bottom",
        "shift-left",
        "shift-right"
      );

      const hasSpaceAbove = wRect.top > tRect.height + 16;
      if (hasSpaceAbove) tooltip.classList.add("tooltip-top");
      else tooltip.classList.add("tooltip-bottom");

      const newRect = tooltip.getBoundingClientRect();

      if (newRect.left < 8) tooltip.classList.add("shift-left");
      if (newRect.right > window.innerWidth - 8)
        tooltip.classList.add("shift-right");
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    return () => window.removeEventListener("resize", updatePosition);
  }, []);

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
    <div className="wallet-wrapper" ref={wrapperRef}>
      <WalletMultiButton 
        className="wallet-btn !bg-gradient-to-r !from-purple-600 !to-pink-600 !shadow-lg"
      >
        <div className="flex items-center gap-3 btn-s-wallet">
          <i className="pi-wallet text-xl"></i>
          <span className="font-bold">Wallet</span>
        </div>
      </WalletMultiButton>
      <div className="wallet-tooltip phantom-style" ref={tooltipRef}>
        <span style={{ display: "block", paddingBottom: "8px" }}>To Stake SOL from your wallet:</span>
        <span>1. Connect your wallet</span><br />
        <span>2. Click Stake SOL Button</span><br />
        <span>3. Enter amount of SOL you want to stake</span><br />  
        <span>Done! You have staked your SOL to Vladika</span>
      </div>
    </div>
  );
};

// For IIFE build compatibility
if (typeof window !== 'undefined') {
  (window as unknown as { ConnectButton: typeof ConnectButton }).ConnectButton = ConnectButton;
}

export { ConnectButton };