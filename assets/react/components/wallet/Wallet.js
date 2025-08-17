import React, { useMemo, useState, useEffect } from 'react'
import store from '@react/store'
import { Provider } from 'react-redux'
import '@solana/wallet-adapter-react-ui/styles.css'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { WalletContextProvider } from '@react/components/wallet/context/WalletContext'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { hasEncryptedWallets } from '@react/components/wallet/scripts/storageActions'
import { showModal } from '@js/modal'
import useWalletContext from './hooks/useWalletContext'
import Content from '@react/components/wallet/components/Content'
import WalletCreate from '@react/components/wallet/components/authorization/WalletCreate'
import WalletUnlock from '@react/components/wallet/components/authorization/WalletUnlock'
import { WalletLoading, WalletTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonWalletClose, ButtonWalletLock } from '@react/components/wallet/components/form-elements/Buttons'

const endpoint = process.env.ANCHOR_PROVIDER_URL

const WalletInner = () => {
    const {walletsList, setPassword} = useWalletContext()
    const walletAdapters = useMemo(() => [new PhantomWalletAdapter()], [])
    const [unlocked, setUnlocked] = useState(false)
    const [hasWallets, setHasWallets] = useState(null) // null = loading, true/false = result

    const checkWallets = async () => {
        try {
            const exists = await hasEncryptedWallets()
            setHasWallets(exists)
        } catch (error) {
            setHasWallets(false)
        }
    }

    useEffect(() => {
        checkWallets().then()
    }, [])

    useEffect(() => {
        checkWallets().then()
    }, [walletsList])

    const unlock = () => setUnlocked(true)
    const lock = () => {
        setUnlocked(false)
        setPassword('')
    }

    const onWalletCreated = () => {
        setHasWallets(true)
        setUnlocked(true)
    }

    if (hasWallets === null) return <WalletLoading />
    if (!unlocked && hasWallets) return <WalletUnlock unlock={unlock} />
    if (!unlocked) return <WalletCreate onWalletCreated={onWalletCreated} />

    return (
        <Provider store={store}>
            <div className="panel-header p-3">
                <WalletTitle />
                <ButtonWalletClose />
            </div>
            <div className="panel-scroll p-3">
                <div className="panel-content">
                    <ConnectionProvider endpoint={endpoint}>
                        <WalletProvider wallets={walletAdapters} autoConnect>
                            <WalletModalProvider>
                                <Content />
                            </WalletModalProvider>
                        </WalletProvider>
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

// TODO - REMOVE !!!
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
        Wallet
    </button>
)

export { Wallet, WalletButton }
