import React from 'react';
import ReactDOM from 'react-dom/client';
import { WalletContextProvider } from './components/WalletContextProvider';
import { ConnectButton } from './components/ConnectButton';
import { StakeButton } from './components/StakeButton';
import { StakePopup } from './components/StakePopup';
import { Transaction } from '@solana/web3.js';
import './globals.css';

declare global {
  interface Window {
    globalWalletState: {
      connected: boolean;
      publicKey: string | null;
      walletName: string | null;
    };
    globalWalletEventListeners: Array<(state: Window['globalWalletState']) => void>;
    updateGlobalWalletState: (newState: Partial<Window['globalWalletState']>) => void;
    subscribeToGlobalWalletState: (callback: (state: Window['globalWalletState']) => void) => () => void;
    globalWalletSendTransaction?: (transaction: Transaction, connection: Connection, options?: SendOptions) => Promise<string>;
    globalWalletSignTransaction?: (transaction: Transaction) => Promise<Transaction>;
    globalWalletSignAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
    WidgetBundle?: {
      replaceButtons: () => void;
      ConnectButton: typeof ConnectButton;
      StakeButton: typeof StakeButton;
      StakePopup: typeof StakePopup;
    };
  }
}

// Initialize global state
if (typeof window !== 'undefined') {
  // Ensure global state object exists
  if (!window.globalWalletState) {
    window.globalWalletState = {
      connected: false,
      publicKey: null,
      walletName: null
    };
  }

  // Ensure event listeners array exists
  if (!window.globalWalletEventListeners) {
    window.globalWalletEventListeners = [];
  }

  // Global function to update wallet state
  window.updateGlobalWalletState = (newState) => {
    if (typeof window === 'undefined' || !window.globalWalletState) return;
    
    console.log('Global state updated:', newState);
    window.globalWalletState = { ...window.globalWalletState, ...newState };
    
    // Notify all listeners
    window.globalWalletEventListeners.forEach(listener => {
      try {
        listener(window.globalWalletState);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  };

  // Global function to subscribe to wallet state changes
  window.subscribeToGlobalWalletState = (callback) => {
    if (typeof window === 'undefined') return () => {};
    
    window.globalWalletEventListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = window.globalWalletEventListeners.indexOf(callback);
      if (index > -1) {
        window.globalWalletEventListeners.splice(index, 1);
      }
    };
  };
}

export const replaceButtons = () => {
  console.log('Replacing buttons...');
  console.log('%cWIDGET REPLACE BUTTONS STARTED', 'color: #ff00ff; font-size: 16px; font-weight: bold;');
  // Wallet buttons
  document.querySelectorAll('.wallet-widget-class').forEach((btn: HTMLElement, i) => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.className = 'wallet-container';
    btn.replaceWith(container);

    // Each button gets its own context provider, but they'll use global state
    ReactDOM.createRoot(container).render(
      <WalletContextProvider>
        <ConnectButton />
      </WalletContextProvider>
    );
  });

  // Stake buttons
  document.querySelectorAll('.stake-button').forEach((btn: HTMLElement, i) => {
    const container = document.createElement('div');
    // container.style.display = 'inline-block';
    container.className = 'stake-btn-container';
    btn.replaceWith(container);

    // Each button gets its own context provider, but they'll use global state
    ReactDOM.createRoot(container).render(
      <WalletContextProvider>
        <StakeButton onClick={() => console.log('Stake clicked')} />
      </WalletContextProvider>
    );
  });
};

// Make sure WidgetBundle is attached to window
if (typeof window !== 'undefined') {
  window.WidgetBundle = {
    replaceButtons,
    ConnectButton,
    StakeButton,
    StakePopup,
    WalletContextProvider
  };
}
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.WidgetBundle?.replaceButtons();
  });
} else {
  // DOM вже готовий (наприклад, скрипт підключений з defer)
  window.WidgetBundle?.replaceButtons();
}