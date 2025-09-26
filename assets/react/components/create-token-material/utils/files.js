import { isValidSolanaAddress } from '@js/blockchain/sevens'
import { getData } from '@js/blockchain/sevens-token'
import { unzip } from 'fflate'
import { getFileType, isAudio, isImage, isPdf, isVideo} from '@js/utils/file'

const generateUniqueId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

export const createFileData = (file) => ({
    id: generateUniqueId(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    relativePath: file.webkitRelativePath || file.relativePath || file.path || '',
    previewUrl: (isImage(file) || isVideo(file) || isAudio(file) || isPdf(file)) ? URL.createObjectURL(file) : null,
    status: 'queued',
    progress: 0,
    error: null,
})

export const getContainerName = () => {
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = now.toISOString().slice(11, 16).replace(':', '-')
    return `Token_Container_${date}_${time}.zip`
}

export const removeReferenceFile = async (targetRef) => {
    await targetRef.current.handle.remove()
    clearTargetRef(targetRef)
}

export const clearTargetRef = (targetRef) => {
    if (targetRef?.current) {
        // Clear all properties to prevent stale references
        targetRef.current = null
    }
    // Force garbage collection hint (though not guaranteed)
    if (window.gc) {
        setTimeout(() => window.gc(), 100)
    }
}

export const checkSwAvailability = (setSsReady, setSsError) => {
    let cancelled = false

    const setupStreamSaver = async () => {
        setSsError(null)
        if (!('serviceWorker' in navigator)) {
            setSsReady(false)
            return
        }
        try {
            const streamSaver = (await import('streamsaver')).default
            streamSaver.WritableStream = streamSaver.WritableStream || window.WritableStream
            if (navigator.serviceWorker.controller) {
                if (!cancelled) setSsReady(true)
                return
            }
            await navigator.serviceWorker.register('/streamsaver-sw.js', { scope: '/' })
            await new Promise((resolve, reject) => {
                const t = setTimeout(() => reject(new Error('Service Worker did not take control in time')), 5000)
                function onCtrl() {
                    clearTimeout(t)
                    navigator.serviceWorker.removeEventListener('controllerchange', onCtrl)
                    resolve()
                }
                navigator.serviceWorker.addEventListener('controllerchange', onCtrl)
                if (navigator.serviceWorker.controller) onCtrl()
            })
            if (!cancelled) setSsReady(true)
        } catch (e) {
            if (!cancelled) {
                setSsReady(false)
                setSsError(e?.message || String(e))
            }
        }
    }

    setupStreamSaver().catch()
    return () => { cancelled = true }
}

/**
 * Decompresses a ZIP container file to memory (BLOB objects) for small files
 * @param {File} containerFile - The ZIP file to decompress
 * @param {Function} progressCallback - Called with progress percentage (0-100)
 * @param {CancellationToken} cancellationToken - Token to check for cancellation
 * @returns {Promise<{files: Array}>}
 */
export const decompressContainerToMemory = async (
    containerFile,
    progressCallback,
    cancellationToken = null
) => {
    progressCallback?.(0)

    cancellationToken?.throwIfCancelled()

    // Read and decompress ZIP data
    const arrayBuffer = await containerFile.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    return new Promise((resolve, reject) => {
        const files = []
        let processedEntries = 0
        let totalEntries = 0

        unzip(uint8Array, async (err, data) => {
            if (err) {
                reject(new Error(`Failed to decompress ZIP file: ${err.message}`))
                return
            }

            try {
                cancellationToken?.throwIfCancelled()

                totalEntries = Object.keys(data).length

                if (totalEntries === 0) {
                    resolve({ files: [] })
                    return
                }

                const entries = Object.entries(data)

                for (let i = 0; i < entries.length; i++) {
                    cancellationToken?.throwIfCancelled()

                    const [fileName, fileData] = entries[i]

                    try {
                        const fileInfo = createMemoryFileInfo(fileName, fileData)
                        files.push(fileInfo)

                        processedEntries++
                        const progress = Math.floor((processedEntries / totalEntries) * 100)
                        progressCallback?.(progress)

                        // Yield control for UI updates
                        if (i % 5 === 0) {
                            await new Promise(resolve => setTimeout(resolve, 10))
                        }
                    } catch (fileError) {
                        if (cancellationToken?.isCancelled || fileError.name === 'CancellationError') {
                            reject(fileError)
                            return
                        }
                        console.warn(`Failed to process file ${fileName}:`, fileError.message)
                        // Continue with other files
                    }
                }

                cancellationToken?.throwIfCancelled()
                progressCallback?.(100)

                resolve({ files })
            } catch (error) {
                reject(error)
            }
        })
    })
}

/**
 * Creates file info for in-memory decompressed file
 */
const createMemoryFileInfo = (fileName, fileData) => {
    const pathParts = fileName.split('/')
    const actualFileName = pathParts.pop() || fileName

    // Create blob from file data
    const blob = new Blob([fileData], { type: getFileType(fileName) })

    // Create file object from blob
    const file = new File([blob], actualFileName, {
        type: getFileType(fileName),
        lastModified: Date.now()
    })

    const fileInfo = {
        id: generateUniqueId(),
        file,
        name: actualFileName,
        size: fileData.length,
        type: getFileType(fileName),
        relativePath: fileName,
        status: 'done',
        isOnDisk: false
    }

    // Generate preview for media files
    try {
        const fileType = getFileType(fileName)
        if (fileType && (fileType.startsWith('image/') || fileType.startsWith('video/') || fileType.startsWith('audio/'))) {
            fileInfo.previewUrl = URL.createObjectURL(file)
        }
    } catch (previewError) {
        console.warn('Could not create preview for', fileName, previewError)
    }

    return fileInfo
}

export const calculateContainerHash = async (container, setContainer, setOverallHashing, setErrorMessage) => {
    setErrorMessage(null)
    try {
        const hash = await getFileHash(container.file, setOverallHashing)
        setContainer(prev => ({...prev, hash, isHashing: false}))
    } catch (error) {
        setErrorMessage(error.message)
    }
}

export const getFileHash = async (file, setOverallHashing) => {
    if (!file) {
        throw new Error('Cannot calculate hash: no file provided')
    }

    try {
        const reader = file.stream().getReader()
        const totalSize = file.size
        const chunks = []
        let processedBytes = 0

        try {
            setOverallHashing(0)
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = new Uint8Array(value)
                chunks.push(chunk)
                processedBytes += chunk.byteLength

                const progress = Math.min(95, Math.floor((processedBytes / totalSize) * 100))
                setOverallHashing(progress)

                await new Promise(resolve => setTimeout(resolve, 10))
            }
        } finally {
            try { reader.releaseLock() } catch (_) {}
        }

        if (processedBytes === 0) {
            new Error('No data was read from file')
        }

        setOverallHashing(98)

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
        const allBytes = new Uint8Array(totalLength)
        let offset = 0
        for (const chunk of chunks) {
            allBytes.set(chunk, offset)
            offset += chunk.length
        }

        const hashBuffer = await crypto.subtle.digest('SHA-256', allBytes)
        setOverallHashing(100)

        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
    } catch (error) {
        setOverallHashing(0)
        throw error
    }
}

/**
 * Chooses decompression method based on file size and decompresses container
 * @param {File} containerFile - The ZIP file to decompress
 * @param {Function} progressCallback - Called with progress percentage (0-100)
 * @param {DirectoryHandle|null} downloadsHandle - Directory where to extract files (required for disk mode)
 * @param {CancellationToken} cancellationToken - Token to check for cancellation
 * @param {number} memoryLimit - File size limit for memory decompression (bytes)
 * @returns {Promise<{files: Array, extractionPath?: string, folderHandle?: DirectoryHandle, usedMemory: boolean}>}
 */
export const decompressContainerSmart = async (
    containerFile,
    progressCallback,
    downloadsHandle = null,
    cancellationToken = null,
    memoryLimit = 1024 * 1024 * 100 // 100MB default
) => {
    const useMemory = containerFile.size <= memoryLimit

    if (useMemory) {
        // Use memory decompression for small files
        const result = await decompressContainerToMemory(
            containerFile,
            progressCallback,
            cancellationToken
        )
        return {
            ...result,
            usedMemory: true
        }
    } else {
        // Use disk decompression for large files
        const result = await decompressContainerToDisk(
            containerFile,
            progressCallback,
            downloadsHandle,
            cancellationToken
        )
        return {
            ...result,
            usedMemory: false
        }
    }
}

export const decompressContainerToDisk = async (
    containerFile,
    progressCallback,
    downloadsHandle,
    cancellationToken = null
) => {
    const containerName = containerFile.name.replace(/\.zip$/i, '')
    const folderName = `${containerName}_extracted`

    progressCallback?.(0)

    // Validate inputs
    if (!downloadsHandle) {
        throw new Error('Downloads directory handle is required')
    }

    if (!window.showDirectoryPicker) {
        throw new Error('File System Access API not supported. Please use Chrome/Edge browser.')
    }

    cancellationToken?.throwIfCancelled()

    // Create extraction folder
    let extractionFolderHandle
    try {
        extractionFolderHandle = await downloadsHandle.getDirectoryHandle(folderName, { create: true })
    } catch (error) {
        throw new Error(`Cannot create folder "${folderName}". Please ensure you have write permissions.`)
    }

    try {
        cancellationToken?.throwIfCancelled()
    } catch (error) {
        // Add folder info to early cancellation error
        error.folderHandle = extractionFolderHandle
        error.extractionPath = folderName
        throw error
    }

    // Read and decompress ZIP data
    const arrayBuffer = await containerFile.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    return new Promise((resolve, reject) => {
        const files = []
        let processedEntries = 0
        let totalEntries = 0

        unzip(uint8Array, async (err, data) => {
            if (err) {
                reject(new Error(`Failed to decompress ZIP file: ${err.message}`))
                return
            }

            try {
                cancellationToken?.throwIfCancelled()

                totalEntries = Object.keys(data).length

                if (totalEntries === 0) {
                    resolve({ files: [], extractionPath: folderName, folderHandle: extractionFolderHandle })
                    return
                }

                const entries = Object.entries(data)

                for (let i = 0; i < entries.length; i++) {
                    cancellationToken?.throwIfCancelled()

                    const [fileName, fileData] = entries[i]

                    try {
                        const fileInfo = await extractSingleFile(
                            fileName,
                            fileData,
                            extractionFolderHandle,
                            folderName,
                            cancellationToken
                        )

                        files.push(fileInfo)

                        processedEntries++
                        const progress = Math.floor((processedEntries / totalEntries) * 100)
                        progressCallback?.(progress)

                        // Yield control for UI updates
                        if (i % 5 === 0) {
                            await new Promise(resolve => setTimeout(resolve, 10))
                        }
                    } catch (fileError) {
                        if (cancellationToken?.isCancelled || fileError.name === 'CancellationError') {
                            // Add folder info to cancellation error for cleanup
                            fileError.folderHandle = extractionFolderHandle
                            fileError.extractionPath = folderName
                            reject(fileError)
                            return
                        }
                        console.warn(`Failed to extract file ${fileName}:`, fileError.message)
                        // Continue with other files
                    }
                }

                cancellationToken?.throwIfCancelled()

                progressCallback?.(100)

                resolve({
                    files,
                    extractionPath: folderName,
                    folderHandle: extractionFolderHandle
                })
            } catch (error) {
                // Add folder info to cancellation error for cleanup
                if (error.name === 'CancellationError' || error.cancelled === true) {
                    error.folderHandle = extractionFolderHandle
                    error.extractionPath = folderName
                }
                reject(error)
            }
        })
    })
}

/**
 * Extracts a single file from ZIP data to disk
 */
const extractSingleFile = async (fileName, fileData, extractionFolderHandle, folderName, cancellationToken) => {
    const pathParts = fileName.split('/')
    const actualFileName = pathParts.pop() || fileName

    // Create nested directories if needed
    let currentDirHandle = extractionFolderHandle
    for (const dirName of pathParts) {
        if (dirName) {
            cancellationToken?.throwIfCancelled()
            try {
                currentDirHandle = await currentDirHandle.getDirectoryHandle(dirName, { create: true })
            } catch (error) {
                throw new Error(`Cannot create directory "${dirName}" for file "${fileName}"`)
            }
        }
    }

    // Create and write file
    let fileHandle, writable
    try {
        fileHandle = await currentDirHandle.getFileHandle(actualFileName, { create: true })
        writable = await fileHandle.createWritable()
    } catch (error) {
        throw new Error(`Cannot create file "${actualFileName}": ${error.message}`)
    }

    try {
        // Write file data in chunks
        const chunkSize = 64 * 1024 // 64KB chunks
        for (let offset = 0; offset < fileData.length; offset += chunkSize) {
            cancellationToken?.throwIfCancelled()

            const chunk = fileData.slice(offset, offset + chunkSize)
            await writable.write(chunk)

            // Small delay for very large files
            if (fileData.length > 1024 * 1024 && offset > 0) {
                await new Promise(resolve => setTimeout(resolve, 1))
            }
        }

        await writable.close()
    } catch (error) {
        try {
            await writable.close()
        } catch (closeError) {
            console.warn('Failed to close writable stream:', closeError)
        }

        // Re-throw cancellation errors as-is, wrap others
        if (error.name === 'CancellationError' || error.cancelled === true) {
            throw error
        }
        throw new Error(`Failed to write file "${actualFileName}": ${error.message}`)
    }

    // Create file metadata
    const fileInfo = {
        id: generateUniqueId(),
        name: actualFileName,
        size: fileData.length,
        type: getFileType(fileName),
        relativePath: fileName,
        status: 'done',
        diskPath: `${folderName}/${fileName}`,
        fileHandle: fileHandle,
        isOnDisk: true
    }

    // Generate preview for media files
    try {
        const fileType = getFileType(fileName)
        if (fileType && (fileType.startsWith('image/') || fileType.startsWith('video/') || fileType.startsWith('audio/'))) {
            const diskFile = await fileHandle.getFile()
            fileInfo.previewUrl = URL.createObjectURL(diskFile)
            fileInfo.file = diskFile
        }
    } catch (previewError) {
        console.warn('Could not create preview for', fileName, previewError)
    }

    return fileInfo
}

export const removeExtractedFilesFolder = async (container, tokenFiles) => {
    if (!container?.folderHandle) {
        return
    }

    try {
        // Clean up preview URLs first
        tokenFiles.forEach(file => {
            if (file.previewUrl) {
                URL.revokeObjectURL(file.previewUrl)
            }
        })

        // Remove the entire extraction folder
        await container.folderHandle.remove({ recursive: true })
    } catch (error) {}
}

/**
 * Cleans up memory-based files by revoking blob URLs
 */
export const cleanupMemoryFiles = (tokenFiles) => {
    if (!tokenFiles || !Array.isArray(tokenFiles)) {
        return
    }

    tokenFiles.forEach(file => {
        if (file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl)
        }
    })
}
