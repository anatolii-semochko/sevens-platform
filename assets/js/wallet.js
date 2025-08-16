import { Wallet } from '@react/components/wallet/Wallet'
import ReactDOM from 'react-dom/client'

let walletRoot = null
const container = document.getElementById('wallet-panel')

const openWallet = () => {
    container.classList.add('open')
    document.body.classList.add('panel-opened')

    if (!walletRoot) {
        walletRoot = ReactDOM.createRoot(container)
    }
    walletRoot.render(<Wallet />)
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
