'use client';

import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

export const ConnectButton = () => {
  const { wallet } = useWallet();

  // Show wallet icon and "Connect" when a wallet is selected
  const showWalletInfo = wallet && wallet.adapter;

  return (
    <WalletMultiButton className="wallet-btn">
      {showWalletInfo ? (
        <div className="flex items-center relative">
          <span className="w-caption">Connect</span>
        </div>
      ) : (
        <div className="flex items-center btn-s-wallet">
          <i className="pi-wallet"></i>
          <span className="w-caption">Wallet</span>
        </div>
      )}
    </WalletMultiButton>
  );
};