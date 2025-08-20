import config from '@react/components/wallet/config.json'
import { PublicKey } from '@solana/web3.js'

/** Any Sevens Address (including PDA) */
export function isValidSolanaAddress(input) {
    if (typeof input !== 'string') return false
    const s = input.trim()
    if (s.length < 32 || s.length > 44) return false

    try {
        const pk = new PublicKey(s)
        return pk.toBase58() === s
    } catch {
        return false
    }
}

/** Valid Wallet Address (ed25519 public key на кривій). PDA — false */
export function isValidWalletAddress(input) {
    try {
        const pk = new PublicKey(String(input).trim())
        return pk.toBase58() === String(input).trim() && PublicKey.isOnCurve(pk.toBytes())
    } catch {
        return false
    }
}

/** Get Address Kind */
export function getAddressKind(input) {
    try {
        const pk = new PublicKey(String(input).trim())
        const canonical = pk.toBase58() === String(input).trim()
        if (!canonical) return null
        return PublicKey.isOnCurve(pk.toBytes()) ? 'wallet' : 'pda'
    } catch {
        return null
    }
}

export const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text)
    } else {
        const textarea = document.createElement('textarea')
        textarea.value = text;
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        const success = document.execCommand('copy')
        document.body.removeChild(textarea)
        return success ? Promise.resolve() : Promise.reject()
    }
}

export const capitalizeFirstLetter = s => s && s[0].toUpperCase() + s.slice(1)

export const limitNumberString = (num, maxLen = 12) => String(num).slice(0, maxLen)

export const getBlurredAddress = (addressString) =>
    addressString ? addressString.slice(0, 4) + '...' + addressString.slice(-4) : ''

export const getDateTimeFromDate = (text) => {
    const date = new Date(text)
    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0") + " " +
        String(date.getHours()).padStart(2, "0") + ":" +
        String(date.getMinutes()).padStart(2, "0")
}

export const getNextWalletName = (walletsList) => {
    const numbers = walletsList.map(wallet => {
        const match = wallet.name?.match(/^Wallet\s+(\d+)$/)
        return match ? parseInt(match[1], 10) : null
    }).filter(num => num !== null)
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0
    return `Wallet ${maxNumber + 1}`
}

export const checkWalletName = (walletsList, newWalletName, publicKey) => {
    if (!newWalletName) {
        throw new Error('Wallet name is missing')
    }
    walletsList.map((walletData) => {
        if (walletData.name === newWalletName) {
            throw new Error('This wallet name is already present in the list')
        }
        if (walletData.publicKey === publicKey) {
            throw new Error(`Wallet\n${publicKey}\nis already present in the list`)
        }
    })
}

export const currentConnectionKey = (walletConnection) => Object.keys(config.CONNECTION_ENDPOINTS)
    .find(k => config.CONNECTION_ENDPOINTS[k] === walletConnection) || 'custom'
