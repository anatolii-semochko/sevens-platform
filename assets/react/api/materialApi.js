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

    async materialExists(token) {
        try {
            await this.get(token)
            return true
        } catch (error) {
            // 404 means material doesn't exist
            return false
        }
    }

    async create(tokenPublicKey, walletSignature, s3Upload = null) {
        const url = `${mainUrl}/create`
        const payload = {tokenPublicKey, walletSignature}

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
     * SECURITY: Validates token in blockchain before generating upload URL.
     * Backend fetches expected hash from blockchain (not from client).
     *
     * @param {string} tokenPublicKey - Token public key (blockchain validation)
     * @param {string} fileName - Name of the file to upload
     * @param {string} containerMd5 - MD5 hash of container (optional, for S3 validation)
     * @returns {Promise<{uploadUrl: string, tempS3Key: string, bucket: string, expectedHash: string, expiresAt: number, expiresIn: number}>}
     */
    async getPresignedUploadUrl(tokenPublicKey, fileName, containerMd5 = null) {
        const url = `${mainUrl}/presigned-upload-url`
        const payload = { tokenPublicKey, fileName }

        // Add optional MD5 validation for S3
        if (containerMd5) {
            payload.containerMd5 = containerMd5
        }

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

    /**
     * Get archive processing status and files with CDN URLs.
     * @param {string} token - Material token
     * @returns {Promise<{status: string, error: string|null, files: Array}>}
     */
    async getArchiveStatus(token) {
        const url = `${mainUrl}/${token}/archive-status`
        return api
            .get(url)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }
}
