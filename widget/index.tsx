import React from 'react';
import ReactDOM from 'react-dom/client';
import { WalletContextProvider } from './components/WalletContextProvider';
import { ConnectButton } from './components/ConnectButton';
import { StakeButton } from './components/StakeButton';
import './globals.css';

// Один глобальний root для всіх кнопок
let globalRoot: ReactDOM.Root | null = null;

export const replaceButtons = () => {
  const containerId = 'wallet-global-root';
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  if (!globalRoot) {
    globalRoot = ReactDOM.createRoot(container);

    // Збираємо кнопки на сторінці
    const walletButtons = Array.from(document.querySelectorAll('.wallet-adapter-button')).map((btn, i) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'inline-block'; // зберігаємо позицію
      btn.replaceWith(wrapper);
      return <ConnectButton key={`wallet-${i}`} />;
    });

    const stakeButtons = Array.from(document.querySelectorAll('.stake-button')).map((btn, i) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'inline-block';
      btn.replaceWith(wrapper);
      return <StakeButton key={`stake-${i}`} onClick={() => console.log('Stake clicked')} />;
    });

    // Один React root з WalletContextProvider
    globalRoot.render(
      <WalletContextProvider>
        <div id="widget-buttons-wrapper">
          {walletButtons}
          {stakeButtons}
        </div>
      </WalletContextProvider>
    );
  }
};

// Глобально для WordPress
if (typeof window !== 'undefined') {
  (window as any).WidgetBundle = {
    replaceButtons,
    ConnectButton,
    StakeButton,
    WalletContextProvider
  };
}
