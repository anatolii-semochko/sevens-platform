import config from '@react/components/wallet/config.json'
import CryptoJS from 'crypto-js'
import { t } from '@react/components/wallet/translations/translations'

const STORAGE_KEY = config.STORAGE_WALLET_KEY
const STORAGE_WALLET_STATE = config.STORAGE_WALLET_STATE_KEY

const chromeApi = typeof globalThis !== 'undefined' && globalThis.chrome?.storage?.local
    ? globalThis.chrome
    : undefined
const hasChromeStorage = !!chromeApi?.storage?.local

export const getLocalStorageProperty = (propertyName) => JSON.parse(
    localStorage.getItem(STORAGE_WALLET_STATE) || 'null'
)?.[propertyName]

export const setLocalStorageProperty = (propertyName, value) => {
    const walletState = JSON.parse(localStorage.getItem(STORAGE_WALLET_STATE) || '{}')
    walletState[propertyName] = value
    localStorage.setItem(STORAGE_WALLET_STATE, JSON.stringify(walletState))
}

export const clearWallet = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_WALLET_STATE)
}

export const hasEncryptedWallets = async () => {
    if (hasChromeStorage) {
        return new Promise((resolve) =>
            chromeApi.storage.local.get([STORAGE_KEY], (res) =>
                resolve(!!res[STORAGE_KEY])
            )
        )
    }
    return !!localStorage.getItem(STORAGE_KEY)
}

export const createEncryptedWallets = async (password) => {
    const emptyWalletArray = []
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(emptyWalletArray), password).toString()
    if (hasChromeStorage) {
        return new Promise((resolve) =>
            chromeApi.storage.local.set({ [STORAGE_KEY]: encryptedData }, () => resolve())
        )
    }
    localStorage.setItem(STORAGE_KEY, encryptedData)
}

export const readEncryptedWallets = async (password) => {
    let encryptedData = null

    if (hasChromeStorage) {
        encryptedData = await new Promise((resolve) =>
            chromeApi.storage.local.get([STORAGE_KEY], (res) =>
                resolve(res[STORAGE_KEY] || null)
            )
        )
    } else {
        encryptedData = localStorage.getItem(STORAGE_KEY)
    }

    if (!encryptedData) {
        throw new Error(t('noEncryptedData'))
    }

    try {
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, password)
        const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8)
        return JSON.parse(decryptedData)
    } catch (error) {
        throw new Error(t('invalidPasswordOrData'))
    }
}

export const writeEncryptedWallets = async (wallets, password) => {
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(wallets), password).toString()
    if (hasChromeStorage) {
        return new Promise((resolve) =>
            chromeApi.storage.local.set({ [STORAGE_KEY]: encryptedData }, () => resolve())
        )
    }
    localStorage.setItem(STORAGE_KEY, encryptedData)
}
