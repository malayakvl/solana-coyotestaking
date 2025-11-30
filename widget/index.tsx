// index.tsx - Entry point for widget bundle
'use strict';

// Use global React and ReactDOM from CDN
const React = window.React;
const ReactDOM = window.ReactDOM;

// Import components from window globals (set by individual component files)
const { WalletContextProvider } = window;
const { ConnectButton } = window;
const { StakePopup } = window;

// Create the main widget app component
const WalletApp = () => {
  return React.createElement(
    WalletContextProvider,
    null,
    React.createElement(ConnectButton, null),
    React.createElement(StakePopup, { isOpen: false, onClose: () => {} })
  );
};

// Create root container and render
const rootContainer = document.createElement('div');
rootContainer.id = 'solana-wallet-widget';
document.body.appendChild(rootContainer);
const root = ReactDOM.createRoot(rootContainer);

// Create and export the WidgetBundle
const WidgetBundle = {
  mountWidget: () => {
    console.log('Mounting Solana Wallet Widget...');
    root.render(React.createElement(WalletApp));
  }
};

// Make it available globally
window.WidgetBundle = WidgetBundle;

console.log('WidgetBundle created and attached to window:', window.WidgetBundle);