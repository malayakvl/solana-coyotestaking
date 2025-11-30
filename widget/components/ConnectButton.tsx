import React from 'react';

export const ConnectButton = () => {
  return (
    <button className="wallet-btn">
      Connect Wallet
    </button>
  );
};

// Экспортируем в window
window.ConnectButton = ConnectButton;
