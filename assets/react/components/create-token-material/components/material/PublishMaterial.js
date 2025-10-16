import React, { useEffect, useState } from 'react'
import MaterialApi from '@react/api/materialApi'
import store from '@react/store'
import { useWallet } from '@solana/wallet-adapter-react'
import { signNonce, WalletForm } from '@react/components/form-elements/WalletForm'
import { ErrorMessageBlock } from '@react/components/info-componnents/Messages'
import { ButtonWithProcessing } from '@react/components/form-elements/Buttons'

const materialApi = new MaterialApi()

const MaterialExists = ({tokenPublicKey}) => (
    <div>
        <div className="alert-danger alert text-center pb-2">
            <h5>Material for this token container already exists.</h5>
        </div>
        <a
            href={Routing.generate('material_page', {token: tokenPublicKey})}
            className="btn btn-primary w-100 fs-5 p-3 mb-3"
        >
            Go to existing material page
        </a>
    </div>
)

export const PublishMaterial = ({container, tokenData, setPublishing}) => {
    const wallet = useWallet()
    const [waitingSignature, setWaitingSignature] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [published, setPublished] = useState(false)
    const [materialExists, setMaterialExists] = useState(false)
    const [error, setError] = useState(null)

    const handlePublish = async () => {
        try {
            if (!wallet.publicKey?.toString()) {
                throw new Error('No active wallet.')
            }
            if (wallet.publicKey?.toString() !== tokenData.walletPublicKey) {
                throw new Error(`This wallet doesn't contain current token. Expected wallet - ${tokenData.walletPublicKey}`)
            }
            setError(null)
            setPublishing(true)

            setWaitingSignature(true)
            const walletSignature = await signNonce(wallet)
            setWaitingSignature(false)

            setProcessing(true)
            const response = await materialApi.create(
                {
                    name: container.file.name,
                    size: container.file.size,
                    hash: container.hash,
                },
                tokenData.tokenPublicKey,
                walletSignature || null,
            )

            // TODO - change author ro user
            if (response.material.author.id === store.getState().user?.id) {
                window.location.href = Routing.generate('material_manage_one', {token: tokenData.tokenPublicKey})
            } else {
                setMaterialExists(true)
            }

            setPublished(true)
        } catch (error) {
            setError(error.message)
        } finally {
            setPublishing(false)
            setWaitingSignature(false)
            setProcessing(false)
        }
    }

    useEffect(() => {
        setError(false)
    }, [wallet.publicKey?.toString()])

    if (materialExists) return (
        <MaterialExists tokenPublicKey={tokenData.tokenPublicKey} />
    )

    return (
        <div>
            <WalletForm operation={'publish'} expectedPublicKey={tokenData.walletPublicKey} waitingSignature={waitingSignature}/>
            <ErrorMessageBlock message={error} />
            <ButtonWithProcessing
                className={'btn-success fs-5 w-100 p-3 mb-3'}
                label={'Publish material'}
                processingLabel={waitingSignature ? 'Waiting wallet signature...' : 'Publish...'}
                processing={waitingSignature || processing}
                hidden={published}
                onClick={handlePublish}
            />
        </div>
    )
}

export const PublishMaterialWithoutSignature = ({container, minted, doMaterial}) => {
    const [processing, setProcessing] = useState(false)
    const [published, setPublished] = useState(false)
    const [error, setError] = useState(null)

    const handlePublish = async () => {
        try {
            setError(null)
            setProcessing(true)
            await materialApi.create(
                {
                    name: container.file.name,
                    size: container.file.size,
                    hash: container.hash,
                },
                minted.tokenPublicKey,
                null,
            )
            window.location.href = Routing.generate('material_manage_one', {token: minted.tokenPublicKey})
            setPublished(true)
        } catch (error) {
            setError(error.message)
        } finally {
            setProcessing(false)
        }
    }

    if (!doMaterial || !minted || minted.error) {
        return
    }

    return (
        <div>
            <ErrorMessageBlock message={error} />
            <ButtonWithProcessing
                className={'btn-success fs-5 w-100 p-3 mb-3'}
                label={'Publish material'}
                processingLabel={'Publish...'}
                processing={processing}
                hidden={published}
                onClick={handlePublish}
            />
        </div>
    )
}
