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

        // Check if error is network-related (robust detection)
        const isNetworkError = (
            // Axios/fetch error codes
            error.code === 'ECONNABORTED' ||
            error.code === 'ENOTFOUND' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ERR_NETWORK' ||
            error.code === 'ERR_CONNECTION_REFUSED' ||
            // No response received from server
            error.response?.status === 0 ||
            error.response?.status === undefined ||
            // Network-related error messages as fallback
            error.message?.toLowerCase().includes('network') ||
            error.message?.toLowerCase().includes('timeout') ||
            error.message?.toLowerCase().includes('failed to fetch')
        )

        if (isNetworkError && socket?.connected) {
            // Network error - backend might still be processing
            // Subscribe to WebSocket for completion notification
            setUploadPhase('waiting')

            let redirected = false
            const timeoutSeconds = 60
            let elapsed = 0
            let pollInterval = null

            // Centralized cleanup function to prevent memory leaks
            const cleanup = () => {
                if (pollInterval) {
                    clearInterval(pollInterval)
                    pollInterval = null
                }
                socket.off('material.created', handleMaterialCreated)
                socket.off('material.processing.complete', handleProcessingComplete)
            }

            // Helper to fetch material and call onSuccess
            const fetchAndCallSuccess = async () => {
                try {
                    const material = await materialApi.get(tokenPublicKey)
                    cleanup()
                    onSuccess({ material })
                } catch (error) {
                    console.error('Failed to fetch material after recovery:', error)
                    cleanup()
                    setError('Material created but failed to load details. Please refresh the page.')
                }
            }

            // Subscribe to material.created event
            const handleMaterialCreated = async (eventData) => {
                if (eventData.token === tokenPublicKey && !redirected) {
                    redirected = true
                    await fetchAndCallSuccess()
                }
            }

            const handleProcessingComplete = async (eventData) => {
                if (eventData.token === tokenPublicKey && !redirected) {
                    redirected = true
                    await fetchAndCallSuccess()
                }
            }

            socket.on('material.created', handleMaterialCreated)
            socket.on('material.processing.complete', handleProcessingComplete)

            // Fallback: Poll every 5 seconds for up to 60 seconds
            pollInterval = setInterval(async () => {
                elapsed += 5

                if (redirected) {
                    cleanup()
                    return
                }

                try {
                    const exists = await materialApi.materialExists(tokenPublicKey)
                    if (exists) {
                        redirected = true
                        await fetchAndCallSuccess()
                    }
                } catch (pollError) {
                    console.error('Polling error:', pollError)
                }

                // Timeout after 60 seconds
                if (elapsed >= timeoutSeconds) {
                    cleanup()
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
                const containerMd5 = await getFileMd5(file).catch(err => {
                    console.error('Failed to calculate MD5:', err)
                    throw new Error('Failed to prepare file validation: ' + err.message)
                })

                // Phase 3: Request presigned upload URL (backend fetches hash from blockchain)
                setUploadPhase('requesting')
                const presignedData = await materialApi.getPresignedUploadUrl(
                    tokenPublicKey,
                    file.name,
                    containerMd5
                ).catch(err => {
                    console.error('Failed to get presigned URL:', err)
                    throw new Error('Failed to prepare upload: ' + err.message)
                })

                // Phase 4: Upload file directly to S3 with MD5 header
                setUploadPhase('uploading')
                setUploadingToS3(true)
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
                s3Upload = {
                    tempS3Key: presignedData.tempS3Key,
                    fileName: file.name,
                    bucket: presignedData.bucket,
                }
            }

            // Phase 5: Create material (backend fetches container data from blockchain)
            setUploadPhase('creating')
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