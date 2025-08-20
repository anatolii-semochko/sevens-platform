import React, { createContext, useEffect, useState } from 'react'
import { getLocalStorageProperty, setLocalStorageProperty } from '@react/components/wallet/scripts/storageActions'
import {reloadAllWallets, setProviderUrl} from "@react/components/wallet/scripts/apiActions";

const WalletContext = createContext(null)

const WalletContextProvider = ({ children }) => {
    const [showComponent, setShowComponent] = useState(null)
    const [password, setPassword] = useState('')
    const [walletsList, setWalletsList] = useState(null)
    const [walletData, setWalletData] = useState({})
    const [rateUsd, setRateUsd] = useState(0.2)
    
    const [walletPublicKey, setWalletPublicKey] = useState(getLocalStorageProperty('walletPublicKey') || null)
    const setWalletByPublicKey = (publicKey) => {
        setLocalStorageProperty('walletPublicKey', publicKey)
        setWalletPublicKey(publicKey)
    }

    const [walletConnection, setWalletConnectionState] = useState(getLocalStorageProperty('connection') || 'main')
    const setConnection = (value) => {
        setLocalStorageProperty('connection', value)
        setWalletConnectionState(value)
    }

    const [language, setLanguageState] = useState(getLocalStorageProperty('language') || 'en')
    const setLanguage = (value) => {
        setLocalStorageProperty('language', value)
        setLanguageState(value)
    }

    const [hideBalances, setHideBalancesState] = useState(getLocalStorageProperty('hideBalances'))
    const setHideBalances = (value) => {
        setLocalStorageProperty('hideBalances', value)
        setHideBalancesState(value)
    }
    
    const walletReload = async () => { // TODO - move all wallet reloads here
        const updated = await reloadAllWallets(password)
        setWalletsList(updated)
    }

    useEffect(() => {
        if (password) {
            setProviderUrl(walletConnection)
            walletReload().catch()
        }
    },[password, walletConnection])
    
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
            setWalletByPublicKey(wallet.publicKey)
        }

        setWalletData(wallet || {})
    }, [walletsList, walletPublicKey])

    return (
        <WalletContext.Provider
            value={{
                showComponent, setShowComponent,
                walletData, walletsList, setWalletsList,
                walletPublicKey, setWalletByPublicKey,
                walletConnection, setConnection,
                hideBalances, setHideBalances,
                language, setLanguage,
                password, setPassword,
                rateUsd, setRateUsd,
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}

export { WalletContext, WalletContextProvider }
