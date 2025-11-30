'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const WalletContextProvider = dynamic(
  () => import('../components/WalletContextProvider').then(mod => mod.WalletContextProvider),
  { ssr: false }
);

const ConnectButton = dynamic(
  () => import('../components/ConnectButton').then(mod => mod.ConnectButton),
  { ssr: false }
);

const StakePopup = dynamic(
  () => import('../components/StakePopup').then(mod => mod.StakePopup),
  { ssr: false }
);

export default function Home() {
  const [popupOpen, setPopupOpen] = useState(false);

  return (
    <WalletContextProvider>
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <h1 className="text-3xl font-bold mb-8">Solana Wallet Connect</h1>

        <div className="flex space-x-4">
          <ConnectButton />
        </div>

        <button
          onClick={() => setPopupOpen(true)}
          className="stake-sol-btn"
        >
          Stake SOL
        </button>

        <StakePopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} />
      </div>
    </WalletContextProvider>
  );
}
