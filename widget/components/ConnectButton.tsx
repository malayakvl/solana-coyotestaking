'use client';

import React, { useEffect, useState, useRef } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';

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

import { GlobalWalletState } from '../types';

export const ConnectButton = () => {
  const { wallet, connected, publicKey, disconnect, sendTransaction, signTransaction, signAllTransactions } = useWallet();
  const [globalState, setGlobalState] = useState<GlobalWalletState>({
    connected: false,
    publicKey: null,
    walletName: null,
  });
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hasRedirectedRef = useRef(false);

  // 🔹 Sync global wallet state
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
    setTimeout(() => {
      if (window.globalWalletState) setGlobalState(window.globalWalletState);
    }, 0);
    return unsub;
  }, []);

  // 🔹 Update global state and store wallet methods
  useEffect(() => {
    if (!wallet) return;

    const name = wallet.adapter.name || null;
    const pubkey = publicKey?.toBase58() || null;

    window.updateGlobalWalletState?.({
      connected,
      publicKey: pubkey,
      walletName: name,
    });

    // Методы кошелька для staking
    // Сохраняем методы только если они реально существуют
    if (sendTransaction) {
      window.globalWalletSendTransaction = sendTransaction;
    } else {
      window.globalWalletSendTransaction = undefined;
    }

    if (signTransaction) {
      window.globalWalletSignTransaction = signTransaction;
    } else {
      window.globalWalletSignTransaction = undefined;
    }

    if (signAllTransactions) {
      window.globalWalletSignAllTransactions = signAllTransactions;
    } else {
      window.globalWalletSignAllTransactions = undefined;
    }

  }, [wallet, connected, publicKey]);

  const { connected: gConnected, publicKey: gPubkey, walletName: gWalletName } = globalState;
  const icon = gWalletName ? WALLET_ICONS[gWalletName] || '/wallets/phantom.svg' : null;

  // 🔹 Android deeplink ONLY after wallet selection (NOT on initial render)
  useEffect(() => {
    // Не запускаем при первой загрузке - только после выбора кошелька
    if (!wallet) return;

    // Проверяем, что это новый выбор кошелька (а не уже подключенный)
    const isAlreadyConnected = connected && publicKey;
    if (isAlreadyConnected) return;

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isInWalletBrowser = /Phantom|Solflare|Backpack/i.test(navigator.userAgent);

    if (!isAndroid || isInWalletBrowser) return;
    if (hasRedirectedRef.current) return;

    // Только если пользователь **выбрал** кошелек (но еще не подключился)
    const walletName = wallet.adapter.name;

    // Проверяем, что это первый раз когда этот кошелек выбран
    // (а не просто ререндер с тем же кошельком)
    if (!walletName) return;

    const currentUrl = encodeURIComponent(window.location.href);
    let deepLink = '';

    if (walletName === 'Phantom') {
      deepLink = `https://phantom.app/ul/browse/${currentUrl}`;
    } else if (walletName === 'Solflare') {
      deepLink = `https://solflare.com/ul/v1/browse/${currentUrl}`;
    } else {
      return;
    }

    console.log('🔥 Android wallet SELECTED, redirect to:', walletName);
    // alert(`Opening ${walletName} app...`);  // Убираем alert чтобы избежать подтверждения

    hasRedirectedRef.current = true;

    // Небольшая задержка чтобы пользователь понял что происходит
    setTimeout(() => {
      window.location.href = deepLink;
    }, 300);

    // Сбрасываем флаг через 15 секунд
    setTimeout(() => {
      hasRedirectedRef.current = false;
    }, 15000);
  }, [wallet, connected, publicKey]);

  // 1️⃣ Connected
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
            <span className="text-connected">Connected</span>
          </div>
        </div>
      </WalletMultiButton>
    );
  }

  // 2️⃣ Wallet selected, not connected
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

  // 3️⃣ Nothing selected
  return (
    <div className="wallet-wrapper" ref={wrapperRef}>
      <WalletMultiButton className="wallet-btn !bg-gradient-to-r !from-purple-600 !to-pink-600 !shadow-lg">
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
