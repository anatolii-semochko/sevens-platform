import {PublicKey, Transaction} from "@solana/web3.js";
import CryptoJS from "crypto-js";


export interface EncryptedAddress { 
    name: string
    publicKey: string
    secret: string
    mnemonicEnc: string
}

export interface WalletToken {
    mint: string
    data?: any
    [key: string]: any
}

export type Password = string | CryptoJS.lib.WordArray


export interface Wallet {
    publicKey: PublicKey
    connected: boolean
    connecting: boolean
    connect: () => Promise<{ publicKey: PublicKey }>
    disconnect: () => Promise<void>
    signTransaction: (tx: Transaction) => Promise<Transaction>
    signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>
    signMessage?: (message: Uint8Array | string) => Promise<Uint8Array>
}

export type SecretsExport = {
    secretKey: {
        bytes: Uint8Array
        hex: string
        base58: string
        array: number[]
    }
    seed: {
        bytes: Uint8Array
        hex: string
        base58: string
        array: number[]
    }
    mnemonic: string | null
}
