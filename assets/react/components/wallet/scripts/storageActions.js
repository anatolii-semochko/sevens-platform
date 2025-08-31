import config from '@react/components/wallet/config.json'
import CryptoJS from 'crypto-js'
import { t } from '@react/components/wallet/translations/translations'

const STORAGE_KEY = config.STORAGE_WALLET_KEY
const STORAGE_WALLET_STATE = config.STORAGE_WALLET_STATE_KEY

const chromeApi = typeof globalThis !== 'undefined' && globalThis.chrome?.storage?.local
    ? globalThis.chrome
    : undefined
const hasChromeStorage = !!chromeApi?.storage?.local

const encode = (obj) =>
    CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(obj)))

const decode = (str) => {
    try {
        const words = CryptoJS.enc.Base64.parse(str)
        return JSON.parse(words.toString(CryptoJS.enc.Utf8))
    } catch (e) {
        return null
    }
}

const getWalletState = async () => {
    let encoded = null
    if (hasChromeStorage) {
        encoded = await new Promise((resolve) =>
            chromeApi.storage.local.get([STORAGE_WALLET_STATE], (res) =>
                resolve(res[STORAGE_WALLET_STATE] || null)
            )
        )
    } else {
        encoded = localStorage.getItem(STORAGE_WALLET_STATE)
    }
    if (!encoded) {
        return null
    }
    return decode(encoded)
}

const setWalletState = async (state) => {
    const encoded = encode(state)
    if (hasChromeStorage) {
        return new Promise((resolve) =>
            chromeApi.storage.local.set({ [STORAGE_WALLET_STATE]: encoded }, () => resolve())
        )
    }
    localStorage.setItem(STORAGE_WALLET_STATE, encoded)
}

export const getWalletStateProperty = async (propertyName) => {
    const walletState = await getWalletState()
    return walletState?.[propertyName]
}

export const setWalletStateProperty = async (propertyName, value) => {
    const walletState = (await getWalletState()) || {}
    walletState[propertyName] = value
    await setWalletState(walletState)
}

export const clearWallet = () => {
    if (hasChromeStorage) {
        chromeApi.storage.local.remove([STORAGE_KEY])
        chromeApi.storage.local.remove([STORAGE_WALLET_STATE])
        return
    }
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
        const wallets = JSON.parse(decryptedData)

        wallets.map((w) => {
            if (!w.publicKey) {
                new Error()
            }
        })

        return wallets
    } catch (error) {
        throw new Error(t('invalidPasswordOrData'))
    }
}

export const writeEncryptedWallets = async (wallets, password) => {

    wallets.map(w => {
        w.balance = 0
        w.tokens = []
    })

    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(wallets), password).toString()
    if (hasChromeStorage) {
        return new Promise((resolve) =>
            chromeApi.storage.local.set({ [STORAGE_KEY]: encryptedData }, () => resolve())
        )
    }
    localStorage.setItem(STORAGE_KEY, encryptedData)
}

export const changePassword = async (currentPassword, newPassword) => {
    try {
        let encryptedWallets = null
        let encodedState = null

        if (hasChromeStorage) {
            const res = await new Promise((resolve) => chromeApi.storage.local.get(
                [STORAGE_KEY, STORAGE_WALLET_STATE],
                (data) => resolve(data)
            ))
            encryptedWallets = res[STORAGE_KEY] || null
            encodedState = res[STORAGE_WALLET_STATE] || null
        } else {
            encryptedWallets = localStorage.getItem(STORAGE_KEY)
            encodedState = localStorage.getItem(STORAGE_WALLET_STATE)
        }

        if (!encryptedWallets) {
            new Error(t('noEncryptedData'))
        }

        const decryptedBytes = CryptoJS.AES.decrypt(
            encryptedWallets,
            currentPassword
        )
        const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8)

        if (!decryptedData) {
            new Error(t('invalidPasswordOrData'))
        }

        const wallets = JSON.parse(decryptedData)
        const newEncryptedWallets = CryptoJS.AES.encrypt(
            JSON.stringify(wallets),
            newPassword
        ).toString()

        if (hasChromeStorage) {
            chromeApi.storage.local.set({ [STORAGE_KEY]: newEncryptedWallets })
        } else {
            localStorage.setItem(STORAGE_KEY, newEncryptedWallets)
        }

        if (encodedState) {
            const decodedState = decode(encodedState)
            const newEncodedState = encode(decodedState)
            if (hasChromeStorage) {
                chromeApi.storage.local.set({
                    [STORAGE_WALLET_STATE]: newEncodedState,
                })
            } else {
                localStorage.setItem(STORAGE_WALLET_STATE, newEncodedState)
            }
        }
    } catch (error) {
        throw error
    }
}
