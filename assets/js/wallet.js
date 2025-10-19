import React from 'react'
import ReactDOM from 'react-dom/client'
import { Wallet } from '@react/components/wallet/Wallet'
import { WalletContextProvider } from '@react/components/wallet/context/WalletContext'
import getWalletEventBus from '@react/components/wallet/EventBus.js'

let walletRoot = null
const container = document.getElementById('wallet-panel')

const openWallet = () => {
    container.classList.add('open')
    document.body.classList.add('panel-opened')

    if (!walletRoot) {
        walletRoot = ReactDOM.createRoot(container)
    }

    walletRoot.render(
        <WalletContextProvider>
            <Wallet />
        </WalletContextProvider>
    )
}

const closeWallet = () => {



    // Notify adapters that wallet is being closed
    const eventBus = getWalletEventBus()
    eventBus.emit('sevens-wallet-closed', { forceDisconnect: true })



    container.classList.remove('open')
    document.body.classList.remove('panel-opened')

    if (walletRoot) {
        walletRoot.unmount()
        walletRoot = null
    }
}

export { openWallet, closeWallet }
