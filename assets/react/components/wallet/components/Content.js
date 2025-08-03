import React, { useEffect } from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'
import useWalletContext from '../hooks/useWalletContext'
import { reloadAllWallets } from '@react/components/wallet/scripts/apiAction'
import { ButtonAddWallet } from '@react/components/wallet/components/form-elements/Buttons'
import WalletsList from '@react/components/wallet/components/wallets-block/WalletsList'
import WalletActions from '@react/components/wallet/components/wallet-block/WalletActions'
import TokensList from '@react/components/wallet/components/tokens-block/TokensList'
import ShowComponent from '@react/components/wallet/components/components-map/ShowComponent'

const Content = () => {
    const {
        walletData, walletsList, setWalletsList, password,
        showComponent, setShowComponent,
    } = useWalletContext()

    useEffect(() => {
        reloadAllWallets().then(setWalletsList).catch(console.error)
    }, [setWalletsList])

    if (!password) {
        return <div>Please enter your password...</div>
    }

    if (walletsList === null) {
        return (
            <div className="d-flex justify-content-center mt-3">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        )
    }

    if (showComponent) {
        return <ShowComponent />
    }

    if (walletsList.length === 0) {
        return (
            <div>
                <h6 className="d-flex justify-content-center mb-3">No wallets</h6>
                <ButtonAddWallet onClick={() => setShowComponent({component: 'AddWallet'})} className={'mt-1'} />
            </div>
        )
    }

    return (
        <div>
            <WalletsList />
            <WalletActions walletData={walletData}/>
            <TokensList tokens={walletData?.tokens} />
        </div>
    )
}

export default Content
