'use client';

import React, { FC, ReactNode, useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

interface Props {
    children: ReactNode;
}

const RPC_ENDPOINT = 'https://solspy.org/api/rpc-proxy';

export const WalletContextProvider: FC<Props> = ({ children }) => {
    // 🔹 Только нужные адаптеры
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        []
    );

    // Ховаємо Backpack і Glow (і будь-які інші, крім Phantom + Solflare)
    useEffect(() => {
        const forceExpandAndClean = () => {
            // Знаходимо модалку
            const modal = document.querySelector('.wallet-adapter-modal');
            if (!modal) return;

            // 1. Розгортаємо секцію "More" / collapse автоматично
            const collapse = modal.querySelector('#wallet-adapter-modal-collapse');
            if (collapse) {
                (collapse as HTMLElement).style.height = 'auto';
                (collapse as HTMLElement).style.overflow = 'visible';
            }

            // 2. Ховаємо непотрібні кнопки
            const buttons = modal.querySelectorAll('button.wallet-adapter-button');

            buttons.forEach((btn) => {
                const text = btn.textContent?.toLowerCase() || '';

                // Якщо НЕ містить phantom або solflare → ховаємо
                if (!text.includes('phantom') && !text.includes('solflare')) {
                    (btn as HTMLElement).style.display = 'none';
                } else {
                    (btn as HTMLElement).style.display = '';
                }
            });
        };

        // Запускаємо відразу та періодично
        forceExpandAndClean();
        const interval = setInterval(forceExpandAndClean, 100);

        // Також реагуємо на будь-які зміни
        const observer = new MutationObserver(forceExpandAndClean);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });

        return () => {
            clearInterval(interval);
            observer.disconnect();
        };
    }, []);

    return (
        <ConnectionProvider endpoint={RPC_ENDPOINT}>
            <WalletProvider wallets={wallets} autoConnect={false}>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
