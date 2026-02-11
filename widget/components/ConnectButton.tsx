'use client';

import React, { useEffect, useState, useRef } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { GlobalWalletState } from '../types';

const WALLET_ICONS: Record<string, string> = {
  Phantom: '/wallets/phantom.svg',
  Solflare: '/wallets/solflare.png',
  // ... остальные иконки
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

  // 1. Синхронизация стейта
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
    const isInWalletBrowser = /Phantom|Solflare|Backpack/i.test(navigator.userAgent);

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
    if (!wallet?.adapter?.name || connected) return;

    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isInWallet = /Phantom|Solflare|Backpack/i.test(ua);
    
    // Проверка наличия провайдера (если мы уже внутри кошелька)
    const hasProvider = !!(window as any).solana || !!(window as any).solflare;

    if (!isAndroid || isInWallet || hasProvider) return;

    // Используем sessionStorage, чтобы флаг жил только в рамках текущей вкладки
    const redirectKey = `rd_${wallet.adapter.name}`;
    if (sessionStorage.getItem(redirectKey) || hasRedirectedRef.current) return;

    const walletName = wallet.adapter.name;
    const currentUrl = window.location.href; 
    const encodedUrl = encodeURIComponent(currentUrl);

    let deepLink = '';

    if (walletName === 'Phantom') {
      // Phantom отлично ест https universal links
      deepLink = `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodeURIComponent(window.location.origin)}`;
    } 
    else if (walletName === 'Solflare') {
      // ИСПОЛЬЗУЕМ ПРЯМОЙ ПРОТОКОЛ для Solflare на Android
      // Это предотвращает редирект в Google Play
      deepLink = `solflare://ul/v1/browse/${encodedUrl}`;
    }

    if (deepLink) {
      console.log('Deep linking to:', walletName);
      hasRedirectedRef.current = true;
      sessionStorage.setItem(redirectKey, 'true');
      
      // Небольшая задержка, чтобы стейт адаптера успел записаться
      setTimeout(() => {
        window.location.href = deepLink;
      }, 100);
    }
  }, [wallet?.adapter?.name, connected]);

  // 3. Очистка (разблокировка редиректа при смене кошелька)
  useEffect(() => {
    if (!wallet) {
      sessionStorage.removeItem('rd_Phantom');
      sessionStorage.removeItem('rd_Solflare');
      hasRedirectedRef.current = false;
    }
  }, [wallet]);

  // --- RENDER (Твой оригинальный рендер) ---
  const { connected: gConnected, publicKey: gPubkey, walletName: gWalletName } = globalState;
  const icon = gWalletName ? WALLET_ICONS[gWalletName] : null;

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
           {icon && <img src={icon} className="w-5 h-5" />}
           <span>Connected</span>
        </div>
      </WalletMultiButton>
    );
  }

  return (
    <div className="wallet-wrapper">
      <WalletMultiButton className="wallet-btn !bg-gradient-to-r !from-purple-600 !to-pink-600">
        <div className="flex items-center gap-3 btn-s-wallet">
          <i className="pi-wallet text-xl"></i>
          <span className="font-bold">{gWalletName ? `Connect`: 'Wallet'}</span>
        </div>
      </WalletMultiButton>
    </div>
  );
};