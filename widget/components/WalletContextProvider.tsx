'use client';

import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

interface Props {
    children: ReactNode;
}

const RPC_ENDPOINT = 'https://solspy.org/api/rpc-proxy';

export const WalletContextProvider: FC<Props> = ({ children }) => {
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new BackpackWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={RPC_ENDPOINT}>
            <WalletProvider wallets={wallets} autoConnect={false}>
                {/* ВОТ КЛЮЧЕВОЕ МЕСТО 🔥 */}
                <WalletModalProvider
                    wallets={wallets}   // ⬅️ ОБЯЗАТЕЛЬНО
                    labels={{
                        'wallet-adapter-modal-more-options-button': 'Pick your Solana wallet to stake',
                    }}
                >
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
