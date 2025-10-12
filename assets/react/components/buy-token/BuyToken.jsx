import React, {useEffect, useMemo, useState} from 'react'
import MaterialSaleApi from '@react/api/materialSaleApi'
import { buy } from '@js/blockchain/sevens-token'
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { SevensWalletAdapter } from '@react/components/wallet/WalletAdapter'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { WalletSaleToken } from '@react/components/form-elements/WalletForms'
import { MessagesBlock } from '@react/components/info-componnents/Messages'
import {showModal} from "@js/modal";
import {DownloadContainer} from "@react/components/download-container/DownloadContainer";

const materialSaleApi = new MaterialSaleApi()

const BuyTokenInner = ({tokenPublicKey, price}) => {
    const wallet = useWallet()
    const [fee, setFee] = useState(null)
    const [inProgress, setInProgress] = useState(false)
    const [sold, setSold] = useState(false)
    const [downloaded, setDownloaded] = useState(false)
    const [error, setError] = useState(null)

    const handlerBuy = async () => {
        try {
            setError(null)
            setInProgress(true)
            await buy({tokenPublicKey, price, wallet})
            await materialSaleApi.refresh(tokenPublicKey)
            setSold(true)

            showModal({
                id: 'download-files-container-' + tokenPublicKey,
                title: 'Download token files container',
                body: <DownloadContainer token={tokenPublicKey}/>,
                size: 'lg',
            })


            window.location.reload()
        } catch (error) {
            setError(error.message)
        } finally {
            setInProgress(false)
        }
    }

    useEffect(() => {
        if (!sold && !inProgress&& wallet?.publicKey) {
            handlerBuy().catch()
        }
    }, [wallet?.publicKey])


    return (
        <div className="mt-3">
            <WalletSaleToken error={error}/>
            <MessagesBlock success={sold && 'Token has been sold !!!'} />
        </div>
    )
}

export const BuyToken = ({root, token, price}) => {
    const endpoint = process.env.ANCHOR_PROVIDER_URL
    const wallets = useMemo(() => [
        new SevensWalletAdapter(),
        new PhantomWalletAdapter()
    ], [])

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect={true}>
                <WalletModalProvider>
                    <BuyTokenInner tokenPublicKey={token} price={price} />
                    <button className="btn btn-danger w-100" onClick={() => root.unmount()}>Close</button>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}

export default BuyToken
