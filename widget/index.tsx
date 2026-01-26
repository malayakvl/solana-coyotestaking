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

// Track if buttons have already been replaced
let buttonsReplaced = false;

export const replaceButtons = () => {
  // Prevent multiple executions
  if (buttonsReplaced) {
    return;
  }
  
  buttonsReplaced = true;
  // console.log('Replacing buttons...');
  // console.log('%cWIDGET REPLACE BUTTONS STARTED', 'color: #ff00ff; font-size: 16px; font-weight: bold;');
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

  // find heart on faq'
  const heartBlockDiv = document.getElementById('faq_heart_img');

  // Add stake button to heart block (only if not already exists)
  if (heartBlockDiv && !heartBlockDiv.querySelector('[data-heart-stake]')) {
    const stakeButtonContainer = document.createElement('div');
    stakeButtonContainer.className = 'stake-btn-container';
    
    // Insert the stake button container into the heart block
    heartBlockDiv.appendChild(stakeButtonContainer);
    
    // Mark container to avoid general processing and duplicates
    stakeButtonContainer.setAttribute('data-heart-stake', 'true');
    
    // Render the StakeButton component
    ReactDOM.createRoot(stakeButtonContainer).render(
      <WalletContextProvider>
        <StakeButton className="heart-stake-btn" onClick={() => console.log('Heart stake clicked')} />
      </WalletContextProvider>
    );
    
  } else if (heartBlockDiv) {
    console.log('Heart stake button already exists, skipping creation');
  }

  
  // Stake buttons - only process buttons that are not already converted
  document.querySelectorAll('.stake-button:not([data-processed])').forEach((btn: HTMLElement, i) => {
    // Mark as processed to avoid duplicates
    btn.setAttribute('data-processed', 'true');
    
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