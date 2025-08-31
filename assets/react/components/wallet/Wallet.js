import React, { useMemo, useState, useEffect } from 'react'
import store from '@react/store'
import useWalletContext from './hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { Provider } from 'react-redux'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'
import { WalletContextProvider } from '@react/components/wallet/context/WalletContext'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { hasEncryptedWallets } from '@react/components/wallet/scripts/storageActions'
import { showModal } from '@js/modal'
import { ButtonWalletLock } from '@react/components/wallet/components/form-elements/Buttons'
import { WalletHeader, WalletLoading } from '@react/components/wallet/components/form-elements/Blocks'
import Content from '@react/components/wallet/components/Content'
import WalletCreate from '@react/components/wallet/components/authorization/WalletCreate'
import WalletUnlock from '@react/components/wallet/components/authorization/WalletUnlock'

const WalletInner = () => {
    const walletAdapters = useMemo(() => [new PhantomWalletAdapter()], [])
    const {walletConnection, walletsList, unlocked, setUnlocked, setPassword} = useWalletContext()
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
    if (!hasWallets) return <WalletCreate onWalletCreated={onWalletCreated} />
    if (!unlocked) return <WalletUnlock unlock={unlock} />

    return (
        <Provider store={store}>
            <div className="panel-header p-3">
                <WalletHeader />
            </div>
            <div className="panel-scroll p-3">
                <div className="panel-content">
                    <ConnectionProvider endpoint={walletConnection}>
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
                title: t('sevensWallet'),
                body: <Wallet />,
            })
        }
    >
        {t('wallet')}
    </button>
)

export { Wallet, WalletButton }
