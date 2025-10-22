import React from 'react'
import ReactDOM from 'react-dom/client'
import { Wallet, initializeSevensWallet } from '@wallet/Wallet'
import { WalletContextProvider } from '@wallet/context/WalletContext'

initializeSevensWallet()

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
    container.classList.remove('open')
    document.body.classList.remove('panel-opened')

    if (walletRoot) {
        walletRoot.unmount()
        walletRoot = null
    }
}

export { openWallet, closeWallet }
