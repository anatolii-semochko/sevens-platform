import React, { useEffect, useState } from 'react'
import MaterialApi from '@react/api/materialApi'
import store from '@react/store'
import { useWallet } from '@solana/wallet-adapter-react'
import { signNonce, WalletForm } from '@react/components/form-elements/WalletForm'
import { ErrorMessageBlock } from '@react/components/info-componnents/Messages'
import { ButtonWithProcessing } from '@react/components/form-elements/Buttons'
import { useMaterialPublish } from '@react/components/create-token-material/hooks/useMaterialPublish'

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
    const { publishMaterial } = useMaterialPublish()
    const [waitingSignature, setWaitingSignature] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [published, setPublished] = useState(false)
    const [materialExists, setMaterialExists] = useState(false)
    const [error, setError] = useState(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadingToS3, setUploadingToS3] = useState(false)
    const [uploadPhase, setUploadPhase] = useState('') // 'preparing', 'requesting', 'uploading', 'creating', 'waiting'

    const handlePublish = async () => {
        try {
            // Wallet validation
            if (!wallet.publicKey?.toString()) {
                throw new Error('No active wallet.')
            }
            if (wallet.publicKey?.toString() !== tokenData.walletPublicKey) {
                throw new Error(`This wallet doesn't contain current token. Expected wallet - ${tokenData.walletPublicKey}`)
            }

            setError(null)
            setPublishing(true)

            // Get wallet signature
            setWaitingSignature(true)
            const walletSignature = await signNonce(wallet)
            setWaitingSignature(false)

            setProcessing(true)
            setUploadProgress(0)

            // Use hook to publish material
            await publishMaterial({
                getFile: async () => container.file,
                tokenPublicKey: tokenData.tokenPublicKey,
                walletSignature,
                onSuccess: (response) => {
                    if (response.material.user?.id === store.getState().user?.id) {
                        window.location.href = Routing.generate('material_manage_one', {token: tokenData.tokenPublicKey})
                    } else {
                        setMaterialExists(true)
                    }
                    setPublished(true)
                },
                setError,
                setUploadProgress,
                setUploadingToS3,
                setUploadPhase,
            })
        } catch (error) {
            // Errors are already handled by the hook
            // Only set error if it wasn't handled (hook rethrows unhandled errors)
            if (error.message) {
                setError(error.message)
            }
        } finally {
            setPublishing(false)
            setWaitingSignature(false)
            setProcessing(false)
            setUploadingToS3(false)
            setUploadPhase('')
        }
    }

    useEffect(() => {
        setError(false)
    }, [wallet.publicKey?.toString()])

    if (materialExists) return (
        <MaterialExists tokenPublicKey={tokenData.tokenPublicKey} />
    )

    const getProcessingLabel = () => {
        if (waitingSignature) return 'Waiting wallet signature...'
        if (uploadPhase === 'requesting') return 'Preparing upload...'
        if (uploadPhase === 'uploading') return `Uploading to cloud storage... ${uploadProgress}%`
        if (uploadPhase === 'creating') return 'Creating material...'
        if (uploadPhase === 'waiting') return 'Processing in background... This may take a few minutes for large files.'
        return 'Publishing...'
    }

    return (
        <div>
            <WalletForm operation={'publish'} expectedPublicKey={tokenData.walletPublicKey} waitingSignature={waitingSignature}/>
            <ErrorMessageBlock message={error} />

            {/* Upload Progress Bar */}
            {uploadingToS3 && (
                <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                        <small className="text-muted">Uploading container archive</small>
                        <small className="text-muted">{uploadProgress}%</small>
                    </div>
                    <div className="progress" style={{height: '8px'}}>
                        <div
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            role="progressbar"
                            style={{width: `${uploadProgress}%`}}
                            aria-valuenow={uploadProgress}
                            aria-valuemin="0"
                            aria-valuemax="100"
                        />
                    </div>
                </div>
            )}

            <ButtonWithProcessing
                className={'btn-success fs-5 w-100 p-3 mb-3'}
                label={'Publish material'}
                processingLabel={getProcessingLabel()}
                processing={waitingSignature || processing}
                hidden={published}
                onClick={handlePublish}
            />
        </div>
    )
}

export const PublishMaterialWithoutSignature = ({container, minted, doMaterial}) => {
    const { publishMaterial } = useMaterialPublish()
    const [processing, setProcessing] = useState(false)
    const [published, setPublished] = useState(false)
    const [error, setError] = useState(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadingToS3, setUploadingToS3] = useState(false)
    const [uploadPhase, setUploadPhase] = useState('') // 'requesting', 'uploading', 'creating'

    const handlePublish = async () => {
        try {
            setError(null)
            setProcessing(true)
            setUploadProgress(0)

            // Use hook to publish material
            await publishMaterial({
                getFile: async () => {
                    // Get file from File System Access API
                    if (container?.targetRef?.current) {
                        const fileHandle = container.targetRef.current
                        return await fileHandle.handle.getFile()
                    }
                    return null
                },
                tokenPublicKey: minted.tokenPublicKey,
                walletSignature: null,
                onSuccess: () => {
                    window.location.href = Routing.generate('material_manage_one', {token: minted.tokenPublicKey})
                    setPublished(true)
                },
                setError,
                setUploadProgress,
                setUploadingToS3,
                setUploadPhase,
            })
        } catch (error) {
            // Errors are already handled by the hook
            // Only set error if it wasn't handled (hook rethrows unhandled errors)
            if (error.message) {
                setError(error.message)
            }
        } finally {
            setProcessing(false)
            setUploadingToS3(false)
            setUploadPhase('')
        }
    }

    if (!doMaterial || !minted || minted.error) {
        return
    }

    const getProcessingLabel = () => {
        if (uploadPhase === 'preparing') return 'Preparing file...'
        if (uploadPhase === 'requesting') return 'Preparing upload...'
        if (uploadPhase === 'uploading') return `Uploading to cloud storage... ${uploadProgress}%`
        if (uploadPhase === 'creating') return 'Creating material...'
        if (uploadPhase === 'waiting') return 'Processing in background... This may take a few minutes for large files.'
        return 'Publishing...'
    }

    return (
        <div>
            <ErrorMessageBlock message={error} />

            {/* Upload Progress Bar */}
            {uploadingToS3 && (
                <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                        <small className="text-muted">Uploading container archive</small>
                        <small className="text-muted">{uploadProgress}%</small>
                    </div>
                    <div className="progress" style={{height: '8px'}}>
                        <div
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            role="progressbar"
                            style={{width: `${uploadProgress}%`}}
                            aria-valuenow={uploadProgress}
                            aria-valuemin="0"
                            aria-valuemax="100"
                        />
                    </div>
                </div>
            )}

            <ButtonWithProcessing
                className={'btn-success fs-5 w-100 p-3 mb-3'}
                label={'Publish material'}
                processingLabel={getProcessingLabel()}
                processing={processing}
                hidden={published}
                onClick={handlePublish}
            />
        </div>
    )
}
