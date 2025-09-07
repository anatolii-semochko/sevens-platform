import config from '@react/components/wallet/config.json'
import React, { createContext, useEffect, useState } from 'react'
import { reloadAllWallets, setProviderUrl } from '@react/components/wallet/scripts/apiActions'
import { getWalletStateProperty, setWalletStateProperty } from '@react/components/wallet/scripts/storageActions'
import { setTranslations } from '@react/components/wallet/translations/translations'
import { getWallet } from '../scripts/apiActions'
import { openWallet, closeWallet } from '@js/wallet'

const WalletContext = createContext(null)

const WalletContextProvider = ({ children }) => {
    const [showComponent, setShowComponent] = useState(null)
    const [password, setPassword] = useState('')
    const [unlocked, setUnlocked] = useState(false)
    const [walletsList, setWalletsList] = useState(null)
    const [walletData, setWalletData] = useState({})
    const [rateUsd, setRateUsd] = useState(0.2)
    const [currentWallet, setCurrentWallet] = useState(null) // Secure wallet interface for adapters

    const [walletPublicKey, setWalletPublicKey] = useState(null)
    const setWalletByPublicKey = async (publicKey) => {
        setWalletData({})
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
        loadState().catch(() => {})
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












    // TODO - Check adn Optimize

    // Update current wallet for adapter communication
    useEffect(() => {
        if (unlocked && walletData?.publicKey && password) {
            try {
                // Create standard wallet interface using getWallet
                const standardWallet = getWallet(walletData, password)
                setCurrentWallet(standardWallet)
            } catch (error) {
                console.error('Failed to create wallet interface:', error)
                setCurrentWallet(null)
            }
        } else {
            setCurrentWallet(null)
        }
    }, [unlocked, walletData, password])

    // Listen for adapter connection requests
    useEffect(() => {
        const handleConnectRequest = (event) => {
            console.log('Sevens Wallet connect request received')

            // Open wallet panel for user to unlock/select wallet
            openWallet()

            // Check if we have a current wallet ready
            if (currentWallet) {
                // Immediately respond with current wallet
                window.dispatchEvent(new CustomEvent('sevens-wallet-connected', {
                    detail: { wallet: currentWallet }
                }))
            }
            // If no current wallet, user needs to unlock through UI
            // The wallet will be provided when user unlocks via currentWallet state change
        }

        const handleDisconnectRequest = (event) => {
            console.log('Sevens Wallet disconnect request received')
            closeWallet()
        }

        const handleShowSignTransaction = (event) => {
            console.log('Show SignTransaction request received')
            const { transaction, onSign, onCancel } = event.detail
            
            // Open wallet if not already open
            openWallet()
            
            // Show SignTransaction component
            setShowComponent({
                component: 'SignTransaction',
                props: {
                    transaction,
                    onSign,
                    onCancel
                }
            })
        }

        const handleCloseDialog = (event) => {
            console.log('Close dialog request received')
            // Reset to main wallet view
            setShowComponent(null)
        }

        window.addEventListener('sevens-wallet-connect-request', handleConnectRequest)
        window.addEventListener('sevens-wallet-disconnect-request', handleDisconnectRequest)
        window.addEventListener('sevens-wallet-show-sign-transaction', handleShowSignTransaction)
        window.addEventListener('sevens-wallet-close-dialog', handleCloseDialog)

        return () => {
            window.removeEventListener('sevens-wallet-connect-request', handleConnectRequest)
            window.removeEventListener('sevens-wallet-disconnect-request', handleDisconnectRequest)
            window.removeEventListener('sevens-wallet-show-sign-transaction', handleShowSignTransaction)
            window.removeEventListener('sevens-wallet-close-dialog', handleCloseDialog)
        }
    }, [currentWallet])

    // Notify adapters when wallet becomes available
    useEffect(() => {
        if (currentWallet) {
            console.log('Sevens Wallet is now available, notifying adapters')
            window.dispatchEvent(new CustomEvent('sevens-wallet-connected', {
                detail: { wallet: currentWallet }
            }))
        }
    }, [currentWallet])











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
                currentWallet, // Secure wallet interface for adapters
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}

export { WalletContext, WalletContextProvider }
