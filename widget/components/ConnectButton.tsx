'use client';

import React, { useEffect, useState, useRef } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { GlobalWalletState } from '../types';

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

export const ConnectButton = () => {
  const { wallet, connected, publicKey, disconnect } = useWallet();

  const [globalState, setGlobalState] = useState<GlobalWalletState>({
    connected: false,
    publicKey: null,
    walletName: null,
  });
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hasRedirectedRef = useRef(false);

  /* -----------------------
     🌍 Global state sync (WP-safe)
  ----------------------- */
  useEffect(() => {
    const state = {
      connected,
      publicKey: publicKey?.toBase58() ?? null,
      walletName: wallet?.adapter?.name ?? null,
    };

    // Update window global state
    if (window.updateGlobalWalletState) {
      window.updateGlobalWalletState(state);
    }

    window.walletState = state;
    localStorage.setItem('walletState', JSON.stringify(state));
    window.dispatchEvent(new Event('walletChanged'));

    setGlobalState(state);
    localStorage.setItem('globalWalletState', JSON.stringify(state));
    console.log('Устанавливаем STATE', state);

  }, [connected, publicKey, wallet]);


  // 🔹 Android deeplink ONLY once when wallet SELECTED
  useEffect(() => {
    if (!wallet?.adapter?.name) return;

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isInWalletBrowser = /Phantom|Solflare|Backpack/i.test(navigator.userAgent);

    // Работаем только на Android, не в кошельках
    if (!isAndroid || isInWalletBrowser) return;

    // 👉 ГЛАВНОЕ: только один раз за сессию
    if (hasRedirectedRef.current) return;

    const walletName = wallet.adapter.name;

    let deepLink = '';
    const currentUrl = encodeURIComponent(window.location.href);

    if (walletName === 'Phantom') {
      deepLink = `https://phantom.app/ul/browse/${currentUrl}`;
    } else if (walletName === 'Solflare') {
      deepLink = `https://solflare.com/ul/v1/browse/${currentUrl}`;
    }

    hasRedirectedRef.current = true;
    window.location.href = deepLink;

  }, [wallet?.adapter?.name]); // ← ТОЛЬКО имя!


  /* -----------------------
     🧹 Clean Solflare / query params
  ----------------------- */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('data') || url.searchParams.has('session')) {
      window.history.replaceState({}, '', url.pathname + url.hash);
    }
  }, []);

  const { connected: gConnected, publicKey: gPubkey, walletName: gWalletName } = globalState;
  const icon = gWalletName ? WALLET_ICONS[gWalletName] || '/wallets/phantom.svg' : null;

  // ────────────────────────────────
  // RENDER
  // ────────────────────────────────

  if (gConnected && gPubkey) {
    return (
      <WalletMultiButton
        className="wallet-btn !bg-gradient-to-r !from-purple-600 !to-pink-600 !shadow-lg"
        onClick={() => {
          disconnect();
          // Обновляем глобальное состояние при disconnect
          const disconnectedState = { connected: false, publicKey: null, walletName: null };
          if (window.updateGlobalWalletState) {
            window.updateGlobalWalletState(disconnectedState);
          }
          window.walletState = disconnectedState;
          localStorage.setItem('walletState', JSON.stringify(disconnectedState));
          window.dispatchEvent(new Event('walletChanged'));
          setGlobalState(disconnectedState);
        }}
      >
        <div className="flex items-center gap-3">
          {icon && <span className={`i-wallet-${gWalletName?.toLowerCase()}`} />}
          <div>
            <span className="text-connected">Connected</span>
          </div>
        </div>
      </WalletMultiButton>
    );
  }

  if (gWalletName && !gConnected) {
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

  return (
    <div className="wallet-wrapper">
      <WalletMultiButton className="wallet-btn !bg-gradient-to-r !from-purple-600 !to-pink-600 !shadow-lg">
        <div className="flex items-center gap-3 btn-s-wallet">
          <i className="pi-wallet text-xl"></i>
          <span className="font-bold">Wallet</span>
        </div>
      </WalletMultiButton>

      <div className="wallet-tooltip phantom-style">
        <span style={{ display: 'block', paddingBottom: '8px' }}>
          To Stake SOL from your wallet:
        </span>
        <span>1. Connect your wallet</span>
        <br />
        <span>2. Click Stake SOL Button</span>
        <br />
        <span>3. Enter amount of SOL you want to stake</span>
        <br />
        <span>Done! You have staked your SOL to Vladika</span>
      </div>
    </div>
  );
};