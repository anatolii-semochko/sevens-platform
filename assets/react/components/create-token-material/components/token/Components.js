import React, { useEffect, useState } from 'react'
import TokenApi from '@react/api/tokenApi'
import { Keypair } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { getDeserializedTransaction, getSerializedTransaction } from '@js/utils/blockchain'
import { ButtonWithProcessing } from '@react/components/form-elements/Buttons'

const tokenApi = new TokenApi()

export const TryMoreOptions = ({minted, doMaterial, handlerClear}) => !doMaterial && minted && (
    <div className="d-flex flex-column align-items-center gap-2 text-center mb-3">
        <h6>You can try:</h6>
        <div className="d-flex flex-wrap justify-content-center gap-2">
            <a href={Routing.generate('check_token')} className="btn btn-primary">Check your token container</a>
            <button className="btn btn-primary" onClick={handlerClear}>Mint a new token</button>
            <a href={Routing.generate('create_material_from_token')} className="btn btn-primary">
                Publish material on site
            </a>
        </div>
    </div>
)

export const ButtonCreateToken = ({tokenData, container, setMinted, setErrorMessage}) => {
    const wallet = useWallet()
    const [processing, setProcessing] = useState(false)
    const [waitingSignature, setWaitingSignature] = useState(false)

    const handlerCreateToken = async () => {
        try {
            if (waitingSignature || processing) {
                return
            }
            if (!wallet.publicKey?.toString()) {
                throw new Error('Wallet is not activated')
            }
            setErrorMessage(null)

            setProcessing(true)
            const mintKeypair = Keypair.generate()
            const transactionData = await tokenApi.getMintTransaction(mintKeypair.publicKey.toString(), {
                walletPublicKey: wallet.publicKey.toString(),
                tokenName: tokenData.name,
                hash: container.hash,
                author: tokenData.author,
                description: tokenData.description,
                canBeBurned: tokenData.burnable,
            })
            const transaction = getDeserializedTransaction(transactionData.transaction)
            transaction.partialSign(mintKeypair)
            setProcessing(false)


            setWaitingSignature(true)
            const txSignature = await wallet.signTransaction(transaction)
            setWaitingSignature(false)

            setProcessing(true)
            if (txSignature.signatures.some(s => !s.signature && s.publicKey.equals(mintKeypair.publicKey))) {
                txSignature.partialSign(mintKeypair)
            }
            const serializedTx = getSerializedTransaction(txSignature)
            await tokenApi.postMintTransaction(mintKeypair.publicKey.toString(), transactionData.transactionId, serializedTx)

            const minted = await tokenApi.getTokenData(mintKeypair.publicKey.toString())

            setMinted(minted)
        } catch (error) {
            setErrorMessage(error.message)
        } finally {
            setWaitingSignature(false)
            setProcessing(false)
        }
    }

    useEffect(() => {
        setProcessing(false)
        setWaitingSignature(false)
        setErrorMessage(false)
    }, [wallet.publicKey?.toString()])

    return (
        <ButtonWithProcessing
            className={'btn-success px-5 py-2'}
            label={'Create Token'}
            disabled={processing || waitingSignature}
            onClick={handlerCreateToken}
            processingLabel={waitingSignature ? 'Waiting wallet signature...' : 'Processing...'}
            processing={processing || waitingSignature}
        />
    )
}
