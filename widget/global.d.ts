import { Transaction } from '@solana/web3.js';

declare global {
    interface GlobalWalletState {
        connected: boolean;
        publicKey: string | null;
        walletName: string | null;
    }

    interface Window {
        globalWalletState?: GlobalWalletState;
        updateGlobalWalletState?: (state: Partial<GlobalWalletState>) => void;
        subscribeToGlobalWalletState?: (cb: (state: GlobalWalletState) => void) => () => void;
        globalWalletSendTransaction?: (tx: Transaction, conn: any, opts?: any) => Promise<string>;
        globalWalletSignTransaction?: (tx: Transaction) => Promise<Transaction>;
        globalWalletSignAllTransactions?: (txs: Transaction[]) => Promise<Transaction[]>;
        solflare?: any;
        phantom?: any;
        solana?: any;
        showSuccessPopup?: (message: string) => void;
    }
}

export { };
