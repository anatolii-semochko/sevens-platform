import React from 'react'
import ReactDOM from 'react-dom/client'
import { Wallet } from '@react/components/wallet/Wallet'
import { WalletContextProvider } from '@react/components/wallet/context/WalletContext'

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


    // TODO - deactivate wallet adapter connection


    container.classList.remove('open')
    document.body.classList.remove('panel-opened')

    if (walletRoot) {
        walletRoot.unmount()
        walletRoot = null
    }
}

export { openWallet, closeWallet }
