import { EncryptedAddress } from './Types'
import CryptoJS from 'crypto-js'

// Storage keys
export const STORAGE_KEY = 'sevens_wallet'
const LOCAL_STORAGE_WALLET_STATE = 'sevens_wallet_state'

// Chrome extension support
const chromeApi: any = typeof globalThis !== 'undefined' && (globalThis as any).chrome?.storage?.local
    ? (globalThis as any).chrome
    : undefined
const hasChromeStorage = !!chromeApi?.storage?.local

// Legacy wallet storage functions (now use encrypted versions)
// These functions now require password from context
export const readStored = async (): Promise<EncryptedAddress[]> => {
    // This should now be handled by the encrypted functions
    // Keeping for backward compatibility but should be replaced
    console.warn('Using deprecated readStored function. Use readEncryptedWallets with password instead.')
    return []
}

export const writeStored = async (wallets: EncryptedAddress[]): Promise<void> => {
    // This should now be handled by the encrypted functions
    // Keeping for backward compatibility but should be replaced
    console.warn('Using deprecated writeStored function. Use writeEncryptedWallets with password instead.')
}

export const loadStoredWallets = readStored

export const removeAllWallets = async (): Promise<void> => {
    await writeStored([])
}

// Wallet state storage functions
export const getLocalStorageProperty = (propertyName: string): any => JSON.parse(
    localStorage.getItem(LOCAL_STORAGE_WALLET_STATE) || 'null'
)?.[propertyName]

export const setLocalStorageProperty = (propertyName: string, value: any): void => {
    const walletState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_WALLET_STATE) || '{}')
    walletState[propertyName] = value
    localStorage.setItem(LOCAL_STORAGE_WALLET_STATE, JSON.stringify(walletState))
}

export const clearWallet = (): void => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LOCAL_STORAGE_WALLET_STATE)
}

// Encrypted wallet storage functions
export const hasEncryptedWallets = async (): Promise<boolean> => {
    if (hasChromeStorage) {
        return new Promise((resolve) =>
            chromeApi.storage.local.get([STORAGE_KEY], (res: Record<string, string>) =>
                resolve(!!res[STORAGE_KEY])
            )
        )
    }
    return !!localStorage.getItem(STORAGE_KEY)
}

export const createEncryptedWallets = async (password: string): Promise<void> => {
    const emptyWalletArray: EncryptedAddress[] = []
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(emptyWalletArray), password).toString()
    
    if (hasChromeStorage) {
        return new Promise((resolve) => 
            chromeApi.storage.local.set({ [STORAGE_KEY]: encryptedData }, () => resolve())
        )
    }
    localStorage.setItem(STORAGE_KEY, encryptedData)
}

export const readEncryptedWallets = async (password: string): Promise<EncryptedAddress[]> => {
    let encryptedData: string | null = null
    
    if (hasChromeStorage) {
        encryptedData = await new Promise((resolve) =>
            chromeApi.storage.local.get([STORAGE_KEY], (res: Record<string, string>) =>
                resolve(res[STORAGE_KEY] || null)
            )
        )
    } else {
        encryptedData = localStorage.getItem(STORAGE_KEY)
    }

    if (!encryptedData) {
        throw new Error('No encrypted wallet data found')
    }

    try {
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, password)
        const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8)
        
        if (!decryptedData) {
            throw new Error('Invalid password')
        }

        return JSON.parse(decryptedData)
    } catch (error) {
        if (error instanceof Error && error.message === 'Invalid password') {
            throw error
        }
        throw new Error('Invalid password or corrupted data')
    }
}

export const writeEncryptedWallets = async (wallets: EncryptedAddress[], password: string): Promise<void> => {
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(wallets), password).toString()
    
    if (hasChromeStorage) {
        return new Promise((resolve) => 
            chromeApi.storage.local.set({ [STORAGE_KEY]: encryptedData }, () => resolve())
        )
    }
    localStorage.setItem(STORAGE_KEY, encryptedData)
}
