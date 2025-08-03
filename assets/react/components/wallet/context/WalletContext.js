import React, { createContext, useEffect, useState } from 'react'
import store from '@react/store'

const WalletContext = createContext(null)

const LOCAL_STORAGE_WALLET_STATE = 'wallet_state'

const setStoreWallet = (wallet) => store.dispatch({
    type: 'SET_WALLET',
    payload: wallet,
})

const getLocalStorageProperty = (propertyName) =>  JSON.parse(
    localStorage.getItem(LOCAL_STORAGE_WALLET_STATE)
)?.[propertyName]

const setLocalStorageProperty = (propertyName, value) => {
    const walletState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_WALLET_STATE)) || {}
    walletState[propertyName] = value
    localStorage.setItem(LOCAL_STORAGE_WALLET_STATE, JSON.stringify(walletState))
}

const WalletContextProvider = ({ children }) => {
    const [showComponent, setShowComponent] = useState(null)
    const [password, setPassword] = useState('')

    // ==== Wallet======================================================================================================
    const [walletsList, setWalletsList] = useState(null)
    const [walletData, setWalletData] = useState({})
    const [walletIndex, setWalletIndexState] = useState(getLocalStorageProperty('walletIndex') || 0)
    const setWalletIndex = (index) => {
        setLocalStorageProperty('walletIndex', index)
        setWalletIndexState(index)
    }
    useEffect(() => {
        const wallet = walletsList ? walletsList[walletIndex] : {}
        setWalletData(wallet)
        setStoreWallet(wallet)
    }, [walletsList, walletIndex])

    // ==== Settings ===================================================================================================
    const [hideBalances, setHideBalancesState] = useState(getLocalStorageProperty('hideBalances'))
    const setHideBalances = (value) => {
        setLocalStorageProperty('hideBalances', value)
        setHideBalancesState(value)
    }
    const [showWalletsList, setShowWalletsListState] = useState(getLocalStorageProperty('showWalletsList'))
    const setShowWalletsList = (value) => {
        setLocalStorageProperty('showWalletsList', value)
        setShowWalletsListState(value)
    }

    return (
        <WalletContext.Provider
            value={{
                showComponent, setShowComponent,
                // Wallet
                walletsList, setWalletsList,
                walletData, walletIndex, setWalletIndex,
                password, setPassword,
                // Settings
                hideBalances, setHideBalances,
                showWalletsList, setShowWalletsList,
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}

export { WalletContext, WalletContextProvider }
