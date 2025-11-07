import React, { useEffect, useState } from 'react'
import MaterialApi from '@react/api/materialApi'
import store from '@react/store'
import { useWallet } from '@solana/wallet-adapter-react'
import { signNonce, WalletForm } from '@react/components/form-elements/WalletForm'
import { ErrorMessageBlock } from '@react/components/info-componnents/Messages'
import { ButtonWithProcessing } from '@react/components/form-elements/Buttons'
import { getFileMd5 } from '@react/components/create-token-material/utils/files'

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
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadingToS3, setUploadingToS3] = useState(false)
    const [uploadPhase, setUploadPhase] = useState('') // 'preparing', 'requesting', 'uploading', 'creating'

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
            setUploadProgress(0)

            console.log('PublishMaterial (with sig) - container:', container)
            console.log('PublishMaterial (with sig) - container?.file:', container?.file)

            let s3Upload = null

            // Get the actual file for S3 upload
            if (container?.file instanceof File) {
                console.log('PublishMaterial (with sig) - File found, uploading to S3...')

                // Phase 0: Calculate MD5 for S3 validation
                setUploadPhase('preparing')
                console.log('PublishMaterial (with sig) - Calculating MD5 hash...')
                const containerMd5 = await getFileMd5(container.file).catch(err => {
                    console.error('PublishMaterial (with sig) - Failed to calculate MD5:', err)
                    throw new Error('Failed to prepare file validation: ' + err.message)
                })
                console.log('PublishMaterial (with sig) - MD5 calculated')

                // Phase 1: Request presigned upload URL with validation data
                setUploadPhase('requesting')
                console.log('PublishMaterial (with sig) - Requesting presigned URL with validation data')
                const presignedData = await materialApi.getPresignedUploadUrl(
                    container.file.name,
                    container.hash,      // SHA-256 for backend validation
                    containerMd5,        // MD5 for S3 validation
                    container.file.size  // Size for validation
                ).catch(err => {
                    console.error('PublishMaterial (with sig) - Failed to get presigned URL:', err)
                    throw new Error('Failed to prepare upload: ' + err.message)
                })
                console.log('PublishMaterial (with sig) - Presigned data:', presignedData)

                // Phase 2: Upload file directly to S3 with MD5 header
                setUploadPhase('uploading')
                setUploadingToS3(true)
                console.log('PublishMaterial (with sig) - Starting S3 upload with MD5 validation')

                await materialApi.uploadToS3(
                    presignedData.uploadUrl,
                    container.file,
                    (progress) => setUploadProgress(progress),
                    containerMd5  // MD5 for Content-MD5 header
                ).catch(err => {
                    console.error('PublishMaterial (with sig) - Failed to upload to S3:', err)
                    throw new Error('Failed to upload file: ' + err.message)
                })

                setUploadingToS3(false)
                console.log('PublishMaterial (with sig) - S3 upload complete')

                s3Upload = {
                    tempS3Key: presignedData.tempS3Key,
                    fileName: container.file.name,
                    bucket: presignedData.bucket,
                }
            } else {
                console.log('PublishMaterial (with sig) - No File object found, skipping S3 upload')
            }

            // Phase 3: Create material with S3 upload info
            setUploadPhase('creating')
            const response = await materialApi.create(
                {
                    name: container.file?.name || container.name,
                    size: container.file?.size || container.size,
                    hash: container.hash,
                },
                tokenData.tokenPublicKey,
                walletSignature || null,
                s3Upload
            )

            if (response.material.user?.id === store.getState().user?.id) {
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

            console.log('PublishMaterial - container:', container)
            console.log('PublishMaterial - container?.targetRef:', container?.targetRef)
            console.log('PublishMaterial - container?.targetRef?.current:', container?.targetRef?.current)

            let s3Upload = null

            // Get the actual file from the targetRef (File System Access API)
            if (container?.targetRef?.current) {
                console.log('PublishMaterial - Getting file from targetRef...')
                // Phase 1: Get the actual File object from the file handle
                setUploadPhase('preparing')
                const fileHandle = container.targetRef.current
                const file = await fileHandle.handle.getFile()
                console.log('PublishMaterial - File retrieved:', file)

                // Phase 1.5: Calculate MD5 for S3 validation
                console.log('PublishMaterial - Calculating MD5 hash...')
                const containerMd5 = await getFileMd5(file).catch(err => {
                    console.error('PublishMaterial - Failed to calculate MD5:', err)
                    throw new Error('Failed to prepare file validation: ' + err.message)
                })
                console.log('PublishMaterial - MD5 calculated')

                // Phase 2: Request presigned upload URL with validation data
                setUploadPhase('requesting')
                console.log('PublishMaterial - Requesting presigned URL with validation data')
                const presignedData = await materialApi.getPresignedUploadUrl(
                    file.name,
                    container.hash,  // SHA-256 for backend validation
                    containerMd5,    // MD5 for S3 validation
                    file.size        // Size for validation
                ).catch(err => {
                    console.error('PublishMaterial - Failed to get presigned URL:', err)
                    throw new Error('Failed to prepare upload: ' + err.message)
                })
                console.log('PublishMaterial - Presigned data:', presignedData)

                // Phase 3: Upload file directly to S3 with MD5 header
                setUploadPhase('uploading')
                setUploadingToS3(true)
                console.log('PublishMaterial - Starting S3 upload with MD5 validation')

                await materialApi.uploadToS3(
                    presignedData.uploadUrl,
                    file,
                    (progress) => setUploadProgress(progress),
                    containerMd5  // MD5 for Content-MD5 header
                ).catch(err => {
                    console.error('PublishMaterial - Failed to upload to S3:', err)
                    throw new Error('Failed to upload file: ' + err.message)
                })

                setUploadingToS3(false)
                console.log('PublishMaterial - S3 upload complete')

                s3Upload = {
                    tempS3Key: presignedData.tempS3Key,
                    fileName: file.name,
                    bucket: presignedData.bucket,
                }
            } else {
                console.log('PublishMaterial - No targetRef found, skipping S3 upload')
            }

            // Phase 4: Create material with S3 upload info
            setUploadPhase('creating')
            await materialApi.create(
                {
                    name: container.name,
                    size: container.size,
                    hash: container.hash,
                },
                minted.tokenPublicKey,
                null,
                s3Upload
            )

            window.location.href = Routing.generate('material_manage_one', {token: minted.tokenPublicKey})
            setPublished(true)
        } catch (error) {
            setError(error.message)
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
