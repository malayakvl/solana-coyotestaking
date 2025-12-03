'use client';

import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

export const ConnectButton = () => {
  const { wallet, connected, publicKey } = useWallet();

  // State 3: Wallet connected - show wallet icon and public key
  if (connected && wallet && publicKey) {
    return (
      <WalletMultiButton className="wallet-btn">
        <div className="flex items-center relative">
          <span className="w-caption">{publicKey.toBase58().substring(0, 4) + '..' + publicKey.toBase58().substring(publicKey.toBase58().length - 4)}</span>
        </div>
      </WalletMultiButton>
    );
  }

  // State 2: Wallet selected but not connected - show wallet icon and "Connect"
  if (wallet && wallet.adapter) {
    return (
      <WalletMultiButton className="wallet-btn">
        <div className="flex items-center relative">
          <span className="text-connect">Connect</span>
        </div>
      </WalletMultiButton>
    );
  }

  // State 1: No wallet selected - show pi-wallet icon and "Wallet"
  return (
    <WalletMultiButton className="wallet-btn">
      <div className="flex items-center btn-s-wallet">
        <i className="pi-wallet"></i>
        <span className="w-caption">Wallet</span>
      </div>
    </WalletMultiButton>
  );
};