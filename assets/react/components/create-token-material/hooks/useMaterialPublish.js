import { useWebSocket } from '@react/context/WebSocketContext'
import MaterialApi from '@react/api/materialApi'
import { getFileMd5 } from '@react/components/create-token-material/utils/files'

const materialApi = new MaterialApi()

/**
 * Custom hook for material publishing flow.
 * Handles file upload, S3 upload, material creation, and error recovery via WebSocket.
 *
 * @returns {Object} - { publishMaterial } function
 */
export const useMaterialPublish = () => {
    const { socket } = useWebSocket()

    /**
     * Handle material creation errors with WebSocket recovery.
     * If network error occurs, subscribes to WebSocket events and polls for material creation.
     */
    const handleMaterialCreationError = async (
        error,
        tokenPublicKey,
        setUploadPhase,
        setError,
        onSuccess
    ) => {
        console.error('Material creation error:', error)

        // Check if error is network-related
        const isNetworkError = error.message?.toLowerCase().includes('network')

        if (isNetworkError && socket?.connected) {
            // Network error - backend might still be processing
            // Subscribe to WebSocket for completion notification
            setUploadPhase('waiting')

            let redirected = false
            const timeoutSeconds = 60
            let elapsed = 0

            // Helper to fetch material and call onSuccess
            const fetchAndCallSuccess = async () => {
                try {
                    const material = await materialApi.get(tokenPublicKey)
                    onSuccess({ material })
                } catch (error) {
                    console.error('Failed to fetch material after recovery:', error)
                    setError('Material created but failed to load details. Please refresh the page.')
                }
            }

            // Subscribe to material.created event
            const handleMaterialCreated = async (eventData) => {
                if (eventData.token === tokenPublicKey && !redirected) {
                    console.log('Material created via WebSocket:', eventData)
                    redirected = true
                    socket.off('material.created', handleMaterialCreated)
                    socket.off('material.processing.complete', handleProcessingComplete)
                    await fetchAndCallSuccess()
                }
            }

            const handleProcessingComplete = async (eventData) => {
                if (eventData.token === tokenPublicKey && !redirected) {
                    console.log('Processing complete via WebSocket:', eventData)
                    redirected = true
                    socket.off('material.created', handleMaterialCreated)
                    socket.off('material.processing.complete', handleProcessingComplete)
                    await fetchAndCallSuccess()
                }
            }

            socket.on('material.created', handleMaterialCreated)
            socket.on('material.processing.complete', handleProcessingComplete)

            // Fallback: Poll every 5 seconds for up to 60 seconds
            const pollInterval = setInterval(async () => {
                elapsed += 5

                if (redirected) {
                    clearInterval(pollInterval)
                    return
                }

                try {
                    const exists = await materialApi.materialExists(tokenPublicKey)
                    if (exists) {
                        console.log('Material found via polling')
                        redirected = true
                        socket.off('material.created', handleMaterialCreated)
                        socket.off('material.processing.complete', handleProcessingComplete)
                        clearInterval(pollInterval)
                        await fetchAndCallSuccess()
                    }
                } catch (pollError) {
                    console.error('Polling error:', pollError)
                }

                // Timeout after 60 seconds
                if (elapsed >= timeoutSeconds) {
                    clearInterval(pollInterval)
                    socket.off('material.created', handleMaterialCreated)
                    socket.off('material.processing.complete', handleProcessingComplete)
                    if (!redirected) {
                        setError('Material creation timed out. Please check your materials page.')
                    }
                }
            }, 5000)

            return // Don't throw error - we're handling it via WebSocket
        }

        // Real error or WebSocket not available - throw to caller
        throw error
    }

    /**
     * Publish material with file upload and error recovery.
     *
     * @param {Object} config - Configuration object
     * @param {Function} config.getFile - Async function that returns File object
     * @param {string} config.tokenPublicKey - Token public key
     * @param {string|null} config.walletSignature - Wallet signature (or null)
     * @param {Function} config.onSuccess - Callback on successful creation (receives response)
     * @param {Function} config.setError - State setter for error messages
     * @param {Function} config.setUploadProgress - State setter for upload progress (0-100)
     * @param {Function} config.setUploadingToS3 - State setter for S3 upload status
     * @param {Function} config.setUploadPhase - State setter for upload phase
     */
    const publishMaterial = async ({
        getFile,
        tokenPublicKey,
        walletSignature,
        onSuccess,
        setError,
        setUploadProgress,
        setUploadingToS3,
        setUploadPhase,
    }) => {
        try {
            let s3Upload = null

            // Phase 1: Get file (strategy pattern - different sources)
            const file = await getFile()

            if (file) {
                // Phase 2: Calculate MD5 for S3 validation
                setUploadPhase('preparing')
                console.log('Calculating MD5 hash...')
                const containerMd5 = await getFileMd5(file).catch(err => {
                    console.error('Failed to calculate MD5:', err)
                    throw new Error('Failed to prepare file validation: ' + err.message)
                })
                console.log('MD5 calculated')

                // Phase 3: Request presigned upload URL (backend fetches hash from blockchain)
                setUploadPhase('requesting')
                console.log('Requesting presigned URL (blockchain validation)')
                const presignedData = await materialApi.getPresignedUploadUrl(
                    tokenPublicKey,
                    file.name,
                    containerMd5
                ).catch(err => {
                    console.error('Failed to get presigned URL:', err)
                    throw new Error('Failed to prepare upload: ' + err.message)
                })
                console.log('Presigned data:', presignedData)

                // Phase 4: Upload file directly to S3 with MD5 header
                setUploadPhase('uploading')
                setUploadingToS3(true)
                console.log('Starting S3 upload with MD5 validation')

                await materialApi.uploadToS3(
                    presignedData.uploadUrl,
                    file,
                    (progress) => setUploadProgress(progress),
                    containerMd5
                ).catch(err => {
                    console.error('Failed to upload to S3:', err)
                    throw new Error('Failed to upload file: ' + err.message)
                })

                setUploadingToS3(false)
                console.log('S3 upload complete')

                s3Upload = {
                    tempS3Key: presignedData.tempS3Key,
                    fileName: file.name,
                    bucket: presignedData.bucket,
                }
            } else {
                console.log('No file provided, skipping S3 upload')
            }

            // Phase 5: Create material (backend fetches container data from blockchain)
            setUploadPhase('creating')
            console.log('Creating material (blockchain provides container data)')
            const response = await materialApi.create(
                tokenPublicKey,
                walletSignature,
                s3Upload
            )

            // Success - call provided callback
            onSuccess(response)

        } catch (error) {
            // Handle error with WebSocket recovery
            await handleMaterialCreationError(
                error,
                tokenPublicKey,
                setUploadPhase,
                setError,
                onSuccess
            )
        }
    }

    return { publishMaterial }
}