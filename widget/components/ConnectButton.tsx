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

  // 1. Определение окружения
  useEffect(() => {
    const ua = navigator.userAgent;
    const mobile = /Android|iPhone|iPad|iPod/i.test(ua);

    // Проверяем, запущены ли мы внутри встроенного браузера кошелька
    const inWallet = /Phantom|Solflare|Backpack/i.test(ua);
    const hasInjectedProvider = !!(window as any).solana || !!(window as any).solflare;

    setIsMobile(mobile);
    setIsInWalletBrowser(inWallet || hasInjectedProvider);
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
    if (!wallet?.adapter?.name || connected || isInWalletBrowser) return;

    const isAndroid = /Android/i.test(navigator.userAgent);
    if (!isAndroid) return;

    const redirectKey = `rd_${wallet.adapter.name}`;
    if (sessionStorage.getItem(redirectKey) || hasRedirectedRef.current) return;

    const walletName = wallet.adapter.name;
    const encodedUrl = encodeURIComponent(window.location.href);
    let deepLink = '';

    if (walletName === 'Phantom') {
      deepLink = `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodeURIComponent(window.location.origin)}`;
    } else if (walletName === 'Solflare') {
      deepLink = `solflare://ul/v1/browse/${encodedUrl}`;
    }

    if (deepLink) {
      hasRedirectedRef.current = true;
      sessionStorage.setItem(redirectKey, 'true');
      setTimeout(() => { window.location.href = deepLink; }, 100);
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

  // А) ПОДКЛЮЧЕН
  if (gConnected && gPubkey) {
    return (
        <WalletMultiButton className="wallet-btn !bg-gradient-to-r !from-purple-600 !to-pink-600">
          <div className="flex items-center gap-3">
            {icon && <span className={`i-wallet-${gWalletName?.toLowerCase()}`} />}
            <span className="font-bold">Connected</span>
          </div>
        </WalletMultiButton>
    );
  }

  // Б) ВЫБРАН, НО НЕ ПОДКЛЮЧЕН
  if (gWalletName && !gConnected) {
    return (
        <div className="flex flex-col items-center gap-2 relative">
          <WalletMultiButton className="wallet-btn !bg-white/10 !backdrop-blur-xl !border !border-white/20">
            <div className="flex items-center gap-3">
              {icon && <span className={`i-wallet-${gWalletName?.toLowerCase()}`} />}
              <span className="text-connect">Connect</span>
            </div>
          </WalletMultiButton>

          {/*
            Кнопка "Change Wallet" показывается ТОЛЬКО если:
            1. Это мобилка
            2. Мы НЕ внутри браузера кошелька (Chrome/Safari)
        */}
          {isMobile && !isInWalletBrowser && (
              <button
                  onClick={handleResetWallet}
                  className="change-wallet"
              >
                &nbsp;
              </button>
          )}
        </div>
    );
  }

  // В) НИЧЕГО НЕ ВЫБРАНО
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