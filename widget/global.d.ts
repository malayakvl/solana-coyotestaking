import { Transaction, Connection } from '@solana/web3.js';
import { GlobalWalletState } from './types';

declare global {
    type GlobalWalletEventListener = (state: GlobalWalletState) => void;

    interface Window {
        walletState?: GlobalWalletState;
        globalWalletState?: GlobalWalletState;
        updateGlobalWalletState?: (state: Partial<GlobalWalletState>) => void;
        subscribeToGlobalWalletState?: (cb: (state: GlobalWalletState) => void) => () => void;
        globalWalletSendTransaction?: (transaction: Transaction, connection: Connection, options?: any) => Promise<string>;
        globalWalletSignTransaction?: (transaction: Transaction) => Promise<Transaction>;
        globalWalletSignAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
        solflare?: any;
        phantom?: any;
        solana?: any;
        backpack?: any;
        globalWalletEventListeners?: GlobalWalletEventListener[];
        showSuccessPopup?: (message: string) => void;
        WidgetBundle?: {
            replaceButtons: () => void;
            ConnectButton: any;
            StakeButton: any;
            StakePopup: any;
            WalletContextProvider: any;
        };
    }
}

export { };
