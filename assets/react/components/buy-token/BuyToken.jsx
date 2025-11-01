import store from '@react/store'
import React, { useEffect, useRef, useState } from 'react'
import TokenApi from '@react/api/tokenApi'
import { useWallet } from '@solana/wallet-adapter-react'
import { createRoot } from 'react-dom/client'
import { route } from '@js/router/routing-with-locale'
import { WalletForm, WalletWrapper } from '@react/components/form-elements/WalletForm'
import { callUserAuthorization } from '@react/components/user-auth/UserAuth'
import { getAnchorErrorText, getDeserializedTransaction, getSerializedTransaction } from '@js/blockchain/sevens'
import { fetchSevensTokenByPublicKey } from '@react/api/nodeApi'
import { DownloadContainer } from '@react/components/download-container/DownloadContainer'
import { ErrorMessageBlock } from '@react/components/info-componnents/Messages'
import { ButtonWithProcessing } from '@react/components/form-elements/Buttons'

const tokenApi = new TokenApi()

const BuyTokenInner = ({tokenPublicKey, root, isMyMaterial}) => {
    const wallet = useWallet()
    const [deactivate, setDeactivate] = useState(false)
    const [tokenData, setTokenData] = useState(null)
    const [waitingSignature, setWaitingSignature] = useState(false)
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
            if (!wallet.publicKey?.toString()) {
                throw new Error('Wallet is not active.')
            }
            if (tokenData.walletPublicKey === wallet.publicKey.toString()) {
                throw new Error('This wallet already possesses current token !')
            }
            setError(null)

            setInProgress(true)
            const transactionData = await tokenApi.getBuyTransaction(tokenPublicKey, wallet.publicKey.toString())
            setInProgress(false)

            setWaitingSignature(true)
            const txSignature = await wallet.signTransaction(getDeserializedTransaction(transactionData.transaction))
            setWaitingSignature(false)

            setInProgress(true)
            await tokenApi.postBuyTransaction(
                tokenPublicKey,
                deactivate,
                transactionData.transactionId,
                getSerializedTransaction(txSignature),
            )

            setSold(true)
            openDownloadPopup(tokenPublicKey)
        } catch (error) {
            setError(getAnchorErrorText(error))
        } finally {
            setWaitingSignature(false)
            setInProgress(false)
        }
    }

    useEffect(() => {
        fetchSevensTokenByPublicKey(tokenPublicKey).then(setTokenData).catch(setError)
    }, [])

    useEffect(() => {
        setError(null)
    }, [wallet.publicKey?.toString()])

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
            <NotAuthorizedBlock {...{deactivate, setDeactivate}}/>
            <WalletForm operation={'buy'} waitingSignature={waitingSignature}/>
            <ErrorMessageBlock message={error} className={'mt-b'} />
            <div className="row">
                <div className="col col-6">
                    <ButtonClose root={root} />
                </div>
                <div className="col col-6">
                    <ButtonWithProcessing
                        className={'btn-success w-100 mb-3'}
                        label={'Buy token'}
                        processing={waitingSignature || inProgress}
                        processingLabel={waitingSignature ? 'Waiting signature...' : 'Processing...'}
                        onClick={handlerBuy}
                    />
                </div>
            </div>
        </div>
    )
}

const NotAuthorizedBlock = ({deactivate, setDeactivate}) => !store.getState().user?.id && (
    <div className="alert-info alert text-break p-4 mb-3">
        <p>
            You are purchasing a token as a guest. This means the publication will not be automatically transferred to your personal account,
            and you can request it later on the <a href={route('material_claim')}>Claim Materials</a> page.
            Alternatively, please <button className="btn btn-link align-baseline p-0" onClick={callUserAuthorization}>Log In</button> before purchasing.
        </p>
        <p>
            Also you can automatically deactivate this publication after purchase and reactivate it at any time later
            from your management page after the material claim.
        </p>
        <div className="form-check">
            <input
                type="checkbox"
                id="deactivate-publication"
                className="form-check-input"
                value={deactivate}
                onClick={() => setDeactivate(!deactivate)}
            />
            <label className="form-check-label" htmlFor="deactivate-publication">
                Deactivate publication
            </label>
        </div>
    </div>
)

const ButtonClose = ({root}) => (
    <button className="btn btn-danger w-100" onClick={() => root.unmount()}>Cancel</button>
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

    const handleDownloaded = () => {
        if (store.getState().user?.id) {
            window.location.href = route('material_manage_one', {token: tokenPublicKey})
        } else {
            window.location.reload()
        }
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

const BuyToken = ({token, root, isMyMaterial}) => (
    <WalletWrapper>
        <BuyTokenInner {...{tokenPublicKey: token, root, isMyMaterial}} />
    </WalletWrapper>
)

export default BuyToken
