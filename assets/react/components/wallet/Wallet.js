import React, { useMemo, useState } from 'react'
import store from '@react/store'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import '@solana/wallet-adapter-react-ui/styles.css'
import { showModal } from '@js/modal'
import Translation from '@react/components/translation-help/Translation'
import MainMenu from '@react/components/wallet/components/form-elements/MainMenu'
import UnlockWallet from '@react/components/wallet/components/UnlockWallet'
import { Provider } from 'react-redux'
import Content from '@react/components/wallet/components/Content'
import { ButtonWalletClose, ButtonWalletLock } from '@react/components/wallet/components/form-elements/Buttons'
import { WalletContextProvider } from '@react/components/wallet/context/WalletContext'
import useWalletContext from './hooks/useWalletContext'

const endpoint = process.env.ANCHOR_PROVIDER_URL

const WalletInner = () => {
    const walletAdapters = useMemo(() => [new PhantomWalletAdapter()], [])
    const [unlocked, setUnlocked] = useState(false)
    const { setPassword } = useWalletContext()
    const unlock = () => setUnlocked(true)
    const lock = () => {
        setUnlocked(false)
        setPassword('')
    }

    const WalletTitle = () => (
        <h5 className="mb-0 ms-2">
            <Translation text={'Sevens Wallet'} domain={'wallet'} />
        </h5>
    )

    if (!unlocked) {
        return (
            <>
                <div className="panel-header p-3">
                    <WalletTitle />
                    <ButtonWalletClose />
                </div>
                <UnlockWallet unlock={unlock} />
            </>
        )
    }

    return (
        <Provider store={store}>
            <div className="panel-header p-3">
                <MainMenu />
                <WalletTitle />
                <ButtonWalletClose />
            </div>
            <div className="panel-scroll p-3">
                <div className="panel-content">
                    <ConnectionProvider endpoint={endpoint}>
                        <SolanaWalletProvider wallets={walletAdapters} autoConnect>
                            <WalletModalProvider>
                                <Content />
                            </WalletModalProvider>
                        </SolanaWalletProvider>
                    </ConnectionProvider>
                </div>
            </div>
            <div className="panel-footer p-3">
                <ButtonWalletLock onClick={lock} />
            </div>
        </Provider>
    )
}

const Wallet = () => (
    <WalletContextProvider>
        <WalletInner />
    </WalletContextProvider>
)

const WalletButton = () => (
    <button
        className="btn btn-info ms-2"
        onClick={() =>
            showModal({
                id: 'wallet',
                title: 'Sevens Wallet',
                body: <Wallet />,
            })
        }
    >
        <Translation text={'Wallet'} />
    </button>
)

export { Wallet, WalletButton }
