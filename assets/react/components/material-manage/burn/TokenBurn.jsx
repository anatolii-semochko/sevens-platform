import React, { useEffect, useState } from 'react'
import TokenApi from '@react/api/tokenApi'
import { route } from '@js/router/routing-with-locale'
import { useWallet } from '@solana/wallet-adapter-react'
import { getDeserializedTransaction, getSerializedTransaction } from '@js/utils/blockchain'
import { WalletForm, WalletWrapper } from '@react/components/form-elements/WalletForm'
import { TokenInfo } from '@react/components/info-componnents/token/TokenInfo'
import { MessagesBlock } from '@react/components/info-componnents/Messages'
import { ButtonWithProcessing } from '@react/components/form-elements/Buttons'

const tokenApi = new TokenApi()

const TokenBurnInner = ({material, tokenData, setMaterialForm}) => {
    const wallet = useWallet()
    const [error, setError] = useState(null)
    const [waitingSignature, setWaitingSignature] = useState(false)
    const [processing, setProcessing] = useState(false)

    const handlerBurnToken = async () => {
        try {
            setError(null)

            if (!wallet.publicKey?.toString()) {
                throw new Error('Wallet is not active')
            }

            setProcessing(true)
            const transactionData = await tokenApi.getBurnTransaction(tokenData.tokenPublicKey)
            setProcessing(false)

            setWaitingSignature(true)
            const walletSignature = await wallet.signTransaction(
                getDeserializedTransaction(transactionData.transaction)
            )
            setWaitingSignature(false)

            setProcessing(true)
            await tokenApi.postBurnTransaction(
                tokenData.tokenPublicKey,
                transactionData.transactionId,
                getSerializedTransaction(walletSignature),
            )

            window.location.href = route('material_manage')
        } catch (error) {
            setError(error)
            setWaitingSignature(false)
            setProcessing(false)
        }
    }

    useEffect(() => {
        setError(null)
        setWaitingSignature(false)
        setProcessing(false)
    }, [wallet.publicKey?.toString()]);

    return (
        <div className="mb-3 pt-2">
            <h4 className="text-center mb-4">Burn token and remove publication "{material.title || 'No titled'}"</h4>
            <h5 className="text-danger text-justify ti-4 lh-base mb-4">
                This operation deletes the publication and permanently burns the token from the blockchain.
                You can mint a token and publish content from the file container again,
                but the token creation time will correspond to the new token minting time.
            </h5>
            <TokenInfo tokenData={tokenData}/>
            <WalletForm
                operation={'burn'}
                expectedPublicKey={tokenData.walletPublicKey}
                waitingSignature={waitingSignature}
            />
            <MessagesBlock error={error}/>
            <div className="d-flex justify-content-end row mb-3">
                <div className="col col-6">
                    <button className="btn btn-primary w-100" onClick={() => setMaterialForm(null)}>Cancel</button>
                </div>
                <div className="col col-6">
                    <ButtonWithProcessing
                        label={'Burn Token'}
                        className={'btn-danger w-100'}
                        processing={processing || waitingSignature}
                        processingLabel={waitingSignature ? 'Waiting signature...' : 'Processing...'}
                        disabled={wallet.publicKey && wallet.publicKey?.toString() !== tokenData.walletPublicKey}
                        onClick={() => handlerBurnToken()}
                    />
                </div>
            </div>
        </div>
    )
}

export const TokenBurn = (props) => (
    <WalletWrapper>
        <TokenBurnInner {...props} />
    </WalletWrapper>
)
