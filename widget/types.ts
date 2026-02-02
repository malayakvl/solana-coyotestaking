import { Transaction, Connection } from '@solana/web3.js';

export interface GlobalWalletState {
    connected: boolean;
    publicKey: string | null;
    walletName: string | null;
}

export type GlobalWalletEventListener = (state: GlobalWalletState) => void;

declare global {
    interface Window {
        globalWalletState?: GlobalWalletState;
        globalWalletEventListeners?: GlobalWalletEventListener[];
        updateGlobalWalletState?: (newState: Partial<GlobalWalletState>) => void;
        subscribeToGlobalWalletState?: (callback: GlobalWalletEventListener) => () => void;
        globalWalletSendTransaction?: (transaction: Transaction, connection: Connection, options?: any) => Promise<string>;
        globalWalletSignTransaction?: (transaction: Transaction) => Promise<Transaction>;
        globalWalletSignAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
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
