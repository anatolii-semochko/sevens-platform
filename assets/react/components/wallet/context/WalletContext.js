import config from '@react/components/wallet/config.json'
import React, { createContext, useEffect, useState } from 'react'
import { reloadAllWallets, setProviderUrl } from '@react/components/wallet/scripts/apiActions'
import { getWalletStateProperty, setWalletStateProperty } from '@react/components/wallet/scripts/storageActions'
import { setTranslations } from '@react/components/wallet/translations/translations'

const WalletContext = createContext(null)

const WalletContextProvider = ({ children }) => {
    const [showComponent, setShowComponent] = useState(null)
    const [password, setPassword] = useState('')
    const [unlocked, setUnlocked] = useState(false)
    const [walletsList, setWalletsList] = useState(null)
    const [walletData, setWalletData] = useState({})
    const [rateUsd, setRateUsd] = useState(0.2)

    const [walletPublicKey, setWalletPublicKey] = useState(null)
    const setWalletByPublicKey = async (publicKey) => {
        if (walletData.publicKey !== publicKey) setWalletData({})
        await setWalletStateProperty('walletPublicKey', publicKey)
        setWalletPublicKey(publicKey)
    }

    const [walletConnection, setWalletConnectionState] = useState(config.CONNECTION_ENDPOINTS['main'])
    const setConnection = async (value) => {
        await setWalletStateProperty('connection', value)
        setWalletConnectionState(value)
    }

    const [language, setLanguageState] = useState('en')
    const setLanguage = async (value) => {
        await setWalletStateProperty('language', value)
        setLanguageState(value)
        setTranslations(value)
    }

    const [hideBalances, setHideBalancesState] = useState()
    const setHideBalances = async (value) => {
        await setWalletStateProperty('hideBalances', value)
        setHideBalancesState(value)
    }

    const walletReload = async () => {
        try {
            const updated = await reloadAllWallets(password)
            setWalletsList(updated)
        } catch (error) {}
    }

    useEffect(() => {
        const loadState = async () => {
            const [walletKey, connection, lang, hide] = await Promise.all([
                getWalletStateProperty('walletPublicKey'),
                getWalletStateProperty('connection'),
                getWalletStateProperty('language'),
                getWalletStateProperty('hideBalances'),
            ])

            if (walletKey) {
                setWalletPublicKey(walletKey)
            }

            if (connection) {
                setWalletConnectionState(connection)
            }

            if (lang) {
                setLanguageState(lang)
                setTranslations(lang)
            }

            if (typeof hide !== 'undefined') {
                setHideBalancesState(hide)
            }
        }
        loadState().catch()
    }, [])

    useEffect(() => {
        if (password) {
            setProviderUrl(walletConnection)
            walletReload().catch()
        }
    },[setWalletsList, password, walletConnection])

    useEffect(() => {
        if (!walletsList || walletsList.length === 0) {
            setWalletData({})
            return
        }

        let wallet = null
        if (walletPublicKey) {
            wallet = walletsList.find(w => w.publicKey === walletPublicKey)
        }

        if (!wallet) {
            const sortedWallets = [...walletsList].sort((a, b) => a.name.localeCompare(b.name))
            wallet = sortedWallets[0]
            setWalletByPublicKey(wallet.publicKey).catch()
        }

        setWalletData(wallet || {})
    }, [walletsList, walletPublicKey])









    const handleReloadRequest = (event) => {
        if (password && walletReload) {
            setTimeout(() => {
                walletReload().catch()
            }, config.RELOAD_AFTER_CHANGES_SECONDS)
        }
    }

    // Обробник для Sevens Wallet Provider - отримання поточного walletData
    const handleGetCurrentWallet = (event) => {
        const { callback } = event.detail
        if (callback && typeof callback === 'function') {
            if (unlocked && walletData?.publicKey) {
                callback(walletData, true)
            } else {
                callback(null, unlocked)
            }
        }
    }

    // Обробник для запиту підпису транзакції
    const handleSignTransaction = (event) => {
        const { transaction, onSign, onCancel } = event.detail
        
        setShowComponent({
            component: 'SignTransaction',
            props: {
                transaction,
                onSign,
                onCancel
            }
        })
    }

    // Обробник для запиту підпису повідомлення
    const handleSignMessage = (event) => {
        const { message, onSign, onCancel } = event.detail
        
        setShowComponent({
            component: 'SignMessage',
            props: {
                message,
                onSign,
                onCancel
            }
        })
    }

    // Додати event listeners для Sevens Wallet Provider
    useEffect(() => {
        window.addEventListener('sevens-wallet-get-current', handleGetCurrentWallet)
        window.addEventListener('sevens-wallet-show-sign-transaction', handleSignTransaction)
        window.addEventListener('sevens-wallet-show-sign-message', handleSignMessage)
        
        return () => {
            window.removeEventListener('sevens-wallet-get-current', handleGetCurrentWallet)
            window.removeEventListener('sevens-wallet-show-sign-transaction', handleSignTransaction)
            window.removeEventListener('sevens-wallet-show-sign-message', handleSignMessage)
        }
    }, [unlocked, walletData])











    return (
        <WalletContext.Provider
            value={{
                showComponent, setShowComponent,
                walletData, walletsList, setWalletsList, walletReload,
                walletPublicKey, setWalletByPublicKey,
                walletConnection, setConnection,
                hideBalances, setHideBalances,
                language, setLanguage,
                password, setPassword,
                unlocked, setUnlocked,
                rateUsd, setRateUsd,
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}

export { WalletContext, WalletContextProvider }
