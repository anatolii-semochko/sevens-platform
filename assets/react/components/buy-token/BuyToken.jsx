import React, {useEffect, useMemo, useRef, useState} from 'react'
import MaterialSaleApi from '@react/api/materialSaleApi'
import store from '@react/store'
import { createRoot } from 'react-dom/client'
import { route } from '@js/router/routing-with-locale'
import { buy } from '@js/blockchain/sevens-token'
import { fetchSevensTokenByPublicKey } from '@react/api/nodeApi'
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { SevensWalletAdapter } from '@react/components/wallet/WalletAdapter'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { WalletSaleToken } from '@react/components/form-elements/WalletForm'
import { DownloadContainer } from '@react/components/download-container/DownloadContainer'
import { ErrorMessageBlock } from '@react/components/info-componnents/Messages'

const materialSaleApi = new MaterialSaleApi()

const BuyTokenInner = ({tokenPublicKey, root, isMyMaterial}) => {
    const wallet = useWallet()
    const [tokenData, setTokenData] = useState(null)
    const [fee, setFee] = useState(null)
    const [inProgress, setInProgress] = useState(false)
    const [sold, setSold] = useState(false)
    const [error, setError] = useState(null)

    const openDownloadPopup = (tokenPublicKey) => {
        const container = document.createElement('div')
        container.id = 'modal-download-container'
        document.body.appendChild(container)
        const root = createRoot(container)
        root.render(<DownloadFilesContainer tokenPublicKey={tokenPublicKey} />)
    }

    const handlerBuy = async () => {
        try {
            setError(null)
            if (tokenData.walletPublicKey === wallet.publicKey.toString()) {
                setError('This wallet already possesses current token !')
                return
            }
            setInProgress(true)
            await buy({tokenPublicKey, price: tokenData.sale.priceSevens, wallet})
            await materialSaleApi.refresh(tokenPublicKey)
            setSold(true)
            openDownloadPopup(tokenPublicKey)
        } catch (error) {
            setError(error.message)
        } finally {
            setInProgress(false)
        }
    }

    useEffect(() => {
        console.log({tokenPublicKey, isMyMaterial})
        fetchSevensTokenByPublicKey(tokenPublicKey).then(setTokenData).catch(setError)
    }, [])

    useEffect(() => {
        if (!sold && !inProgress&& wallet?.publicKey) {
            handlerBuy().catch()
        }
    }, [wallet?.publicKey])

    if (isMyMaterial === 'true') return (
        <div>
            <ErrorMessageBlock
                message={'This publication is already in your personal list of materials.'}
                className={'mt-3'}
            />
            <ButtonClose root={root} />
        </div>
    )

    if (tokenData && !tokenData.sale.priceSevens) return (
        <div>
            <ErrorMessageBlock message={'Material is not for sale.'} className={'mt-3'} />
            <ButtonClose root={root} />
        </div>
    )

    return !sold && (
        <div className="mt-3">
            <WalletSaleToken error={error}/>
            <ButtonClose root={root} />
        </div>
    )
}

const ButtonClose = ({root}) => (
    <button className="btn btn-danger w-100" onClick={() => root.unmount()}>Close</button>
)

const DownloadFilesContainer = ({ tokenPublicKey }) => {
    const modalRef = useRef(null)

    useEffect(() => {
        const modalEl = modalRef.current
        if (!modalEl) return

        const modal = new window.bootstrap.Modal(modalEl, {
            backdrop: 'static', // Denies closing by click
            keyboard: false     // Denies closing by ESC
        })
        modal.show()
    }, [])

    const handleDownloaded = async () => {
        materialSaleApi.refresh(tokenPublicKey).then(() => {
            if (store.getState().user?.id) {
                window.location.href = route('material_manage_one', {token: tokenPublicKey})
            } else {
                window.location.reload()
            }
        })
    }

    return (
        <div ref={modalRef} className="modal fade" tabIndex="-1">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-body p-4">
                        <div className="alert alert-success text-center fs-5 pb-0">
                            <h4>You have successfully purchased a token!</h4>
                            <p>Please upload the file container that represents your token.</p>
                        </div>
                        <DownloadContainer token={tokenPublicKey} onDownloaded={handleDownloaded} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export const BuyToken = ({root, token, isMyMaterial}) => {
    const endpoint = process.env.ANCHOR_PROVIDER_URL
    const wallets = useMemo(() => [
        new SevensWalletAdapter(),
        new PhantomWalletAdapter()
    ], [])

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect={true}>
                <WalletModalProvider>
                    <BuyTokenInner tokenPublicKey={token} root={root} isMyMaterial={isMyMaterial} />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}

export default BuyToken
