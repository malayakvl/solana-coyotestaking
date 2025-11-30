import React, { FC, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter, CoinbaseWalletAdapter } from '@solana/wallet-adapter-wallets';

const NETWORK = 'https://api.mainnet-beta.solana.com';

export const WalletContextProvider: FC<{children: ReactNode}> = ({ children }) => {
  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new CoinbaseWalletAdapter()];
  return (
    <ConnectionProvider endpoint={NETWORK}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

window.WalletContextProvider = WalletContextProvider;
