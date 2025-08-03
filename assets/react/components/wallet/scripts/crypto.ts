import * as bip39 from 'bip39'
import bs58 from 'bs58'
import CryptoJS from 'crypto-js'
import { Keypair} from '@solana/web3.js'
import { derivePath } from 'ed25519-hd-key'
import { EncryptedAddress, Password, SecretsExport } from '@react/components/wallet/scripts/Types'
import { getKeypair } from '@react/components/wallet/scripts/apiAction'

// TODO - REGISTER IN SLIP-0044 !!! Дериваційний шлях згідно зі стандартом BIP44
export const CHAIN_COIN_TYPE: number = 777
export const CHAIN_DERIVATION_PATH: string = `m/44'/${CHAIN_COIN_TYPE}'/0'/0'`

export const BIP_LENGTHS: Record<number, number> = {
    128: 12,
    160: 15,
    192: 18,
    224: 21,
    256: 24,
}
export const BIP_DEFAULT = 128

export const WORDS_TO_BITS: Record<number, number> = Object.fromEntries(Object.entries(BIP_LENGTHS)
    .map(([b, w]) => [Number(w), Number(b)]))
export const SUPPORTED_BITS: number[] = Object.keys(BIP_LENGTHS).map(Number)
export const ENGLISH_WORD_LIST: string[] = (bip39 as any).wordlists?.english ?? []

export const getGeneratedMnemonic = (length = 128) => bip39.generateMnemonic(length)

export const getKeyFromMnemonic = async (
    mnemonic: string,
): Promise<Keypair> => {
    const seed = await bip39.mnemonicToSeed(mnemonic)
    const { key } = derivePath(CHAIN_DERIVATION_PATH, seed.toString('hex'))
    return Keypair.fromSeed(key)
}

export const getKeyFromPrivateKey = (privateKeyBase58: string): Keypair => {
    const bytes = bs58.decode(privateKeyBase58)
    if (bytes.length !== 64) {
        throw new Error(`Invalid private key length: expected 64 bytes, got ${bytes.length}`)
    }
    return Keypair.fromSecretKey(bytes)
}

export const getKeyFromSeed = (seedBase58: string): Keypair => {
    const seed = bs58.decode(seedBase58)
    return Keypair.fromSeed(seed)
}

const toHex = (u8: Uint8Array): string => Array.from(u8).map(b => b.toString(16).padStart(2, '0')).join('')

export const getAllSecrets = (
    walletData: EncryptedAddress,
    password: Password,
): SecretsExport | null => {
    try {
        const kp = getKeypair(walletData, password)
        if (!kp) return null
        
        const full = kp.secretKey
        const seed32 = full.slice(0, 32)

        const secretKey = {
            bytes: full,
            hex: toHex(full),
            base58: bs58.encode(full),
            array: Array.from(full),
        }

        const seed = {
            bytes: seed32,
            hex: toHex(seed32),
            base58: bs58.encode(seed32),
            array: Array.from(seed32),
        }

        let mnemonic: string | null = null
        if (walletData.mnemonicEnc) {
            const bytes = CryptoJS.AES.decrypt(walletData.mnemonicEnc, password)
            const plain = bytes.toString(CryptoJS.enc.Utf8)
            mnemonic = plain || null
        }

        return { secretKey, seed, mnemonic }
    } catch (error) {
        throw new Error('Failed to export secrets')
    }
}
