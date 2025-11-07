import api, { throwErrorMessage } from '@react/api/indexApi'
import axios from 'axios'

const mainUrl = '/material'

export default class MaterialApi {
    async get(token) {
        const url = `${mainUrl}/${token}`
        return await api
            .get(url)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async create(container, tokenPublicKey, walletSignature, s3Upload = null) {
        const url = `${mainUrl}/create`
        const payload = {container, tokenPublicKey, walletSignature}

        if (s3Upload) {
            payload.s3Upload = s3Upload
        }

        return api
            .post(url, payload)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async patch(token, material) {
        const url = `${mainUrl}/${token}`
        return api
            .patch(url, material)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async delete(token) {
        const url = `${mainUrl}/${token}`
        return api
            .delete(url)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    /**
     * Get presigned upload URL for direct S3 upload.
     * @param {string} fileName - Name of the file to upload
     * @param {string} containerHash - SHA-256 hash of container (optional, for validation)
     * @param {string} containerMd5 - MD5 hash of container (optional, for S3 validation)
     * @param {number} containerSize - Size of container in bytes (optional, for validation)
     * @returns {Promise<{uploadUrl: string, tempS3Key: string, bucket: string, expectedSize: number, expectedHash: string}>}
     */
    async getPresignedUploadUrl(fileName, containerHash = null, containerMd5 = null, containerSize = null) {
        const url = `${mainUrl}/presigned-upload-url`
        const payload = { fileName }

        // Add optional validation parameters
        if (containerHash) payload.containerHash = containerHash
        if (containerMd5) payload.containerMd5 = containerMd5
        if (containerSize) payload.containerSize = containerSize

        return api
            .post(url, payload)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    /**
     * Upload file directly to S3 using presigned URL.
     * @param {string} presignedUrl - The presigned URL from getPresignedUploadUrl
     * @param {File} file - The file to upload
     * @param {function} onProgress - Callback for upload progress (0-100)
     * @param {string} md5Hash - Base64-encoded MD5 hash for Content-MD5 header (optional, for S3 validation)
     * @returns {Promise<void>}
     */
    async uploadToS3(presignedUrl, file, onProgress = null, md5Hash = null) {
        try {
            const headers = {
                'Content-Type': 'application/zip',
            }

            // Add Content-MD5 header if provided (S3 will validate)
            if (md5Hash) {
                headers['Content-MD5'] = md5Hash
            }

            await axios.put(presignedUrl, file, {
                headers,
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percentComplete = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        onProgress(percentComplete)
                    }
                },
            })
        } catch (error) {
            // S3 returns 403 if MD5 doesn't match
            const message = error.response?.status === 403
                ? 'File validation failed: uploaded file does not match container hash'
                : error.response?.data?.message || error.message || 'Failed to upload file to cloud storage'
            throw new Error(message)
        }
    }
}
