import React from 'react'
import ReactDOM from 'react-dom/client'
import { Wallet, initializeSevensWallet } from '@wallet/Wallet'
import { WalletContextProvider } from '@wallet/context/WalletContext'

initializeSevensWallet()

let walletRoot = null
let isInitialized = false

const initializeWallet = () => {
    if (isInitialized) return

    const container = document.getElementById('wallet-panel')
    if (!container) {
        return
    }

    walletRoot = ReactDOM.createRoot(container)
    walletRoot.render(
        <WalletContextProvider>
            <Wallet />
        </WalletContextProvider>
    )

    isInitialized = true
}

// Ініціалізуємо WalletContext при завантаженні DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWallet)
} else {
    // DOM вже завантажений
    initializeWallet()
}

const openWallet = () => {
    initializeWallet()

    const container = document.getElementById('wallet-panel')
    if (container) {
        container.classList.add('open')
        document.body.classList.add('panel-opened')
    }
}

const closeWallet = () => {
    const container = document.getElementById('wallet-panel')
    if (container) {
        container.classList.remove('open')
        document.body.classList.remove('panel-opened')
    }
}

export { openWallet, closeWallet }
