import config from '@react/components/wallet/config.json'
import React, { createContext, useEffect, useState } from 'react'
import { reloadAllWallets, setProviderUrl } from '@react/components/wallet/scripts/apiActions'
import { getWalletStateProperty, setWalletStateProperty } from '@react/components/wallet/scripts/storageActions'
import { setTranslations } from '@react/components/wallet/translations/translations'
import { getWallet } from '../scripts/apiActions'
import { openWallet, closeWallet } from '@js/wallet'
import getWalletEventBus from '../EventBus.js'

const WalletContext = createContext(null)

const WalletContextProvider = ({ children }) => {
    const [showComponent, setShowComponent] = useState(null)
    const [password, setPassword] = useState('')
    const [unlocked, setUnlocked] = useState(false)
    const [walletsList, setWalletsList] = useState(null)
    const [walletData, setWalletData] = useState({})
    const [rateUsd, setRateUsd] = useState(0.2)
    const [currentWallet, setCurrentWallet] = useState(null)
    const [eventBus] = useState(() => getWalletEventBus())

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

    useEffect(() => {
        if (walletData?.publicKey && currentWallet) {
            eventBus.emit('sevens-wallet-account-changed', {
                publicKey: walletData.publicKey
            })

            // Also emit connected event to ensure adapter has the wallet reference
            eventBus.emit('sevens-wallet-connected', {
                wallet: currentWallet
            })
        }
    }, [walletData?.publicKey, currentWallet, eventBus])












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

    useEffect(() => {
        const handleConnectRequest = (event) => {
            console.log('Sevens Wallet connect request received')
            openWallet()

            if (currentWallet) {
                eventBus.emit('sevens-wallet-connected', {
                    wallet: currentWallet
                })
            }
        }

        const handleDisconnectRequest = (event) => {
            console.log('Sevens Wallet disconnect request received')
            // Don't call closeWallet() here as it will cause double event emission
            // The adapter handles its own disconnection
        }

        const handleShowSignTransaction = (event) => {
            console.log('Show SignTransaction request received')
            const { transaction, onSign, onCancel } = event.detail

            openWallet()

            setShowComponent({
                component: 'SignTransaction',
                props: {
                    transaction,
                    onSign,
                    onCancel
                }
            })
        }

        const handleShowSignMessage = (event) => {
            const { message, onSign, onCancel } = event.detail
            openWallet()
            setShowComponent({
                component: 'SignMessage',
                props: { message, onSign, onCancel }
            })
        }

        const handleCloseDialog = (event) => {
            console.log('Close dialog request received')
            setShowComponent(null)
        }

        const handleGetCurrent = (event) => {
            console.log('📥 [Context] Get current wallet request received')
            console.log('📊 [Context] Current state:', {
                hasCurrentWallet: !!currentWallet,
                hasPublicKey: !!currentWallet?.publicKey,
                publicKey: currentWallet?.publicKey?.toString(),
                unlocked,
                hasWalletData: !!walletData?.publicKey
            })
            const { callback } = event.detail || {}
            if (callback && currentWallet && currentWallet.publicKey) {
                console.log('✅ [Context] Calling callback with current wallet')
                callback(currentWallet)
            } else if (callback) {
                console.log('❌ [Context] Calling callback with null (no wallet available)')
                callback(null)
            }
        }

        const handlePing = (event) => {
            console.log('📥 [Context] Wallet ping received, announcing current state')
            console.log('📊 [Context] Current state:', {
                hasCurrentWallet: !!currentWallet,
                hasPublicKey: !!currentWallet?.publicKey,
                publicKey: currentWallet?.publicKey?.toString(),
                unlocked
            })
            // Respond to ping by announcing current wallet state
            if (currentWallet && currentWallet.publicKey) {
                console.log('📤 [Context] Emitting sevens-wallet-connected in response to ping')
                eventBus.emit('sevens-wallet-connected', {
                    wallet: currentWallet
                })
            } else {
                console.log('⚠️ [Context] No current wallet to announce')
            }
        }

        const handleReloadRequest = (event) => {
            console.log('🔄 [Context] Wallet reload request received')
            if (password && walletReload) {
                // Perform 3 sequential reloads with 1-second intervals
                const performReloads = async () => {
                    try {
                        for (let i = 1; i <= 3; i++) {
                            console.log(`🔄 [Context] Wallet reload attempt ${i}/3`)
                            await walletReload()

                            // Wait 1 second between reloads (except after the last one)
                            if (i < 3) {
                                await new Promise(resolve => setTimeout(resolve, 1000))
                            }
                        }
                        console.log('✅ [Context] All wallet reloads completed successfully')
                    } catch (error) {
                        console.error('❌ [Context] Wallet reload failed:', error)
                    }
                }

                // Start the reload sequence after a short initial delay
                setTimeout(() => {
                    performReloads().catch()
                }, 500)
            }
        }

        eventBus.on('sevens-wallet-connect-request', handleConnectRequest)
        eventBus.on('sevens-wallet-disconnect-request', handleDisconnectRequest)
        eventBus.on('sevens-wallet-show-sign-transaction', handleShowSignTransaction)
        eventBus.on('sevens-wallet-show-sign-message', handleShowSignMessage)
        eventBus.on('sevens-wallet-close-dialog', handleCloseDialog)
        eventBus.on('sevens-wallet-get-current', handleGetCurrent)
        eventBus.on('sevens-wallet-ping', handlePing)
        eventBus.on('sevens-wallet-reload-request', handleReloadRequest)

        return () => {
            eventBus.off('sevens-wallet-connect-request', handleConnectRequest)
            eventBus.off('sevens-wallet-disconnect-request', handleDisconnectRequest)
            eventBus.off('sevens-wallet-show-sign-transaction', handleShowSignTransaction)
            eventBus.off('sevens-wallet-show-sign-message', handleShowSignMessage)
            eventBus.off('sevens-wallet-close-dialog', handleCloseDialog)
            eventBus.off('sevens-wallet-get-current', handleGetCurrent)
            eventBus.off('sevens-wallet-ping', handlePing)
            eventBus.off('sevens-wallet-reload-request', handleReloadRequest)
        }
    }, [currentWallet, eventBus])

    useEffect(() => {
        if (currentWallet) {
            console.log('Sevens Wallet is now available, notifying adapters')
            eventBus.emit('sevens-wallet-connected', {
                wallet: currentWallet
            })
            eventBus.emit('sevens-wallet-opened', {
                wallet: currentWallet
            })
        } else if (!unlocked) {
            // Only emit closed event when wallet is actually locked, not during temporary transitions
            eventBus.emit('sevens-wallet-closed', { forceDisconnect: true })
        }
    }, [currentWallet, eventBus, unlocked])


    // TODO - Remove All window. !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // Make current wallet globally accessible for debugging and direct access
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__sevensCurrentWallet = currentWallet
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
