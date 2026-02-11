import { Transaction, Connection } from '@solana/web3.js';

export interface GlobalWalletState {
    connected: boolean;
    publicKey: string | null;
    walletName: string | null;
}

export type GlobalWalletEventListener = (state: GlobalWalletState) => void;
