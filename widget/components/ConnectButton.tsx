'use client';

import React, { useEffect, useState, useRef } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { GlobalWalletState } from '../types';

const WALLET_ICONS: Record<string, string> = {
  Phantom: '/wallets/phantom.svg',
  Solflare: '/wallets/solflare.png',
};

export const ConnectButton = () => {
  const { wallet, connected, publicKey, disconnect, select } = useWallet();
  const [globalState, setGlobalState] = useState<GlobalWalletState>({
    connected: false,
    publicKey: null,
    walletName: null,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isInWalletBrowser, setIsInWalletBrowser] = useState(false);
  const hasRedirectedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);


  // 1. Определение окружения
  useEffect(() => {
    const ua = navigator.userAgent;
    const mobile = /Android|iPhone|iPad|iPod/i.test(ua);
    setIsMounted(true);
    const isAndroid = /Android/i.test(ua);

    // Проверяем максимально жестко, чтобы не было ошибки net::ERR_UNKNOWN_SCHEME
    const isSolflareUA = /Solflare/i.test(ua);
    const isPhantomUA = /Phantom/i.test(ua);
    const hasProvider = !!(window as any).solana || !!(window as any).solflare;
    const inWallet = isSolflareUA || isPhantomUA || hasProvider;

    setIsMobile(mobile);
    setIsInWalletBrowser(inWallet);

    // ХАК ДЛЯ ANDROID: Если мы НЕ в кошельке, принудительно чистим localStorage.
    // Это не даст адаптеру автоматически выбрать Phantom при возврате в браузер.
    if (isAndroid && !inWallet) {
      localStorage.removeItem('walletName'); // Ключ, который использует библиотека
      if (wallet?.adapter) {
        select(null);
      }
    }

    if (inWallet) {
      hasRedirectedRef.current = true;
    }
  }, []);

  // 2. Синхронизация стейта
  useEffect(() => {
    const state = {
      connected,
      publicKey: publicKey?.toBase58() ?? null,
      walletName: wallet?.adapter?.name ?? null,
    };
    if (window.updateGlobalWalletState) window.updateGlobalWalletState(state);
    setGlobalState(state);
  }, [connected, publicKey, wallet]);

  // 3. Логика редиректа (Android)
  useEffect(() => {
    // ВАЖНО: Если мы уже в кошельке (isInWalletBrowser), выходим СРАЗУ
    // Именно это предотвращает ошибку net::ERR_UNKNOWN_SCHEME
    if (!wallet?.adapter?.name || connected || isInWalletBrowser) return;

    const isAndroid = /Android/i.test(navigator.userAgent);
    if (!isAndroid) return;

    const walletName = wallet.adapter.name;
    const redirectKey = `rd_${walletName}`;

    if (sessionStorage.getItem(redirectKey) || hasRedirectedRef.current) return;

    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);
    const origin = encodeURIComponent(window.location.origin);

    let deepLink = '';

    if (walletName === 'Phantom') {
      deepLink = `https://phantom.app/ul/browse/${encodedUrl}?ref=${origin}`;
    }
    else if (walletName === 'Solflare') {
      // ИСПОЛЬЗУЕМ СТРУКТУРУ ИЗ ТВОЕГО ПРИМЕРА:
      // solflare://ul/v1/browse/<URL>?ref=<ORIGIN>
      deepLink = `solflare://ul/v1/browse/${encodedUrl}?ref=${origin}`;
    }

    if (deepLink) {
      hasRedirectedRef.current = true;
      sessionStorage.setItem(redirectKey, 'true');

      // Используем небольшой таймаут
      setTimeout(() => {
        window.location.href = deepLink;
      }, 150);
    }
  }, [wallet?.adapter?.name, connected, isInWalletBrowser]);

  // 4. Сброс выбора
  const handleResetWallet = (e: React.MouseEvent) => {
    e.stopPropagation();
    select(null as any);
    sessionStorage.removeItem('rd_Phantom');
    sessionStorage.removeItem('rd_Solflare');
    hasRedirectedRef.current = false;
  };

  const { connected: gConnected, publicKey: gPubkey, walletName: gWalletName } = globalState;
  const icon = gWalletName ? WALLET_ICONS[gWalletName] : null;

  // --- RENDER ---
  if (gConnected && gPubkey) {
    return (
      <WalletMultiButton className="wallet-btn !bg-gradient-to-r !from-purple-600 !to-pink-600">
        <div className="flex items-center gap-3">
          {icon && <span className={`i-wallet-${gWalletName?.toLowerCase()}`} />}
          <span className="font-bold font-connected">Connected</span>
        </div>
      </WalletMultiButton>
    );
  }

  if (gWalletName && !gConnected) {
    return (
      <div className="flex flex-col items-center gap-2 relative">
        <WalletMultiButton className="wallet-btn !bg-white/10 !backdrop-blur-xl !border !border-white/20">
          <div className="flex items-center gap-3">
            {icon && <span className={`i-wallet-${gWalletName?.toLowerCase()}`} />}
            <span className="text-connect">Connect</span>
          </div>
        </WalletMultiButton>

        {!isInWalletBrowser && (
          <button onClick={handleResetWallet} className="change-wallet">
            &nbsp;
          </button>
        )}
      </div>
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
    </div>
  );
};