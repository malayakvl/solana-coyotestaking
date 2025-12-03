'use client';

import React, { useEffect, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

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

  // Update global state
  useEffect(() => {
    const name = wallet?.adapter?.name || null;
    if (connected && publicKey) {
      window.updateGlobalWalletState?.({
        connected: true,
        publicKey: publicKey.toBase58(),
        walletName: name,
      });
    } else if (!connected && !name) {
      window.updateGlobalWalletState?.({
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
      delete (window as any).globalWalletSignTransaction;
      delete (window as any).globalWalletSignAllTransactions;
      delete (window as any).globalWalletSignTransaction;
      return;
    }
    const a = wallet.adapter;
    (window as any).globalWalletSignTransaction = (tx: any) => a.signTransaction!(tx);
    (window as any).globalWalletSignAllTransactions = (txs: any[]) => a.signAllTransactions!(txs);
    (window as any).globalWalletSendTransaction = (tx: any, c: any, o?: any) => a.sendTransaction!(tx, c, o);
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
      <WalletMultiButton className="wallet-btn !bg-white/10 !backdrop-blur-xl !border !border-white/20">
        <div className="flex items-center gap-3">
          {icon && <span className={`i-wallet-${gWalletName?.toLowerCase()}`} />}
          <span className="text-connect">Connect</span>
        </div>
      </WalletMultiButton>
    );
  }

  // 3. Nothing selected
  return (
    <WalletMultiButton className="wallet-btn !bg-gradient-to-r !from-purple-600 !to-pink-600 !shadow-lg">
      <div className="flex items-center gap-3 btn-s-wallet">
        <i className="pi-wallet text-xl"></i>
        <span className="font-bold">Wallet</span>
      </div>
    </WalletMultiButton>
  );
};