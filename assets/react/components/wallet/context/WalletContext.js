import React, { createContext, useEffect, useState } from 'react'
import { getLocalStorageProperty, setLocalStorageProperty } from '@react/components/wallet/scripts/storageActions'

const WalletContext = createContext(null)

const WalletContextProvider = ({ children }) => {
    const [showComponent, setShowComponent] = useState(null)
    const [password, setPassword] = useState('')
    const [walletsList, setWalletsList] = useState(null)
    const [walletData, setWalletData] = useState({})
    const [walletPublicKey, setWalletPublicKey] = useState(getLocalStorageProperty('walletPublicKey') || null)
    
    const setWalletByPublicKey = (publicKey) => {
        setLocalStorageProperty('walletPublicKey', publicKey)
        setWalletPublicKey(publicKey)
    }
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

    const [hideBalances, setHideBalancesState] = useState(getLocalStorageProperty('hideBalances'))
    const setHideBalances = (value) => {
        setLocalStorageProperty('hideBalances', value)
        setHideBalancesState(value)
    }

    return (
        <WalletContext.Provider
            value={{
                showComponent, setShowComponent,
                hideBalances, setHideBalances,
                walletsList, setWalletsList,
                walletData, walletPublicKey, setWalletByPublicKey,
                password, setPassword,
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}

export { WalletContext, WalletContextProvider }
