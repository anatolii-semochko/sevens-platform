import { isValidSolanaAddress } from '@js/blockchain/sevens'
import { getData } from '@js/blockchain/sevens-token'

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

export const getExt = (name = '') => name.split('.').pop()?.toLowerCase() || ''
export const isImage = (f) => f?.type?.startsWith('image/') || ['png','jpg','jpeg','gif','bmp','webp','avif'].includes(getExt(f?.name))
export const isVideo = (f) => f?.type?.startsWith('video/') || ['mp4','webm','mov','m4v','mkv','avi'].includes(getExt(f?.name))
export const isAudio = (f) => f?.type?.startsWith('audio/') || ['mp3','wav','ogg','m4a','aac','flac'].includes(getExt(f?.name))
export const isPdf   = (f) => f?.type === 'application/pdf' || getExt(f?.name) === 'pdf'

export const createItem = (file) => ({
    id: genId(),
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

export const prettyBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

export const classNames = (...xs) => xs.filter(Boolean).join(' ')

export const getContainerName = () => {
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = now.toISOString().slice(11, 16).replace(':', '-')
    return `Token_Container_${date}_${time}.zip`
}

export const getTokenContainerName = (mintPubkey) => {
    return `Token_Container_${mintPubkey}.zip`
}

export const getPublicKeyFromContainerName = (fileName) => {
    if (!fileName) return null

    // Remove file extension if present
    const nameWithoutExt = fileName.replace(/\.zip$/i, '')

    // Expected pattern: Token_Container_{PublicKey} or similar
    const patterns = [
        /Token_Container_([A-Za-z0-9]{32,44})$/,     // Token_Container_PublicKey
        /Token_Container_([A-Za-z0-9]{32,44})_/,     // Token_Container_PublicKey_something
        /_([A-Za-z0-9]{32,44})$/,                    // anything_PublicKey
        /([A-Za-z0-9]{32,44})$/                      // just PublicKey at the end
    ]

    for (const pattern of patterns) {
        const match = nameWithoutExt.match(pattern)
        if (match) {
            const potentialKey = match[1]
            if (isValidSolanaAddress(potentialKey)) {
                return potentialKey
            }
        }
    }

    console.log('No valid public key found in container name:', fileName)
    return null
}

// Check if file renaming is supported
export const isFileRenamingSupported = () => window.showSaveFilePicker &&
    typeof window.showSaveFilePicker === 'function' &&
    window.location.protocol === 'https:'

export const getContainerHash = async (target, setOverallHashing) => {
    if (!target || !target.handle) {
        throw new Error('Cannot calculate hash: no file handle available')
    }

    try {
        setOverallHashing(0)

        // FIX (NO FILE) - Wait for file to be fully written with retry logic
        let file
        let retryCount = 0
        const maxRetries = 10
        const retryDelay = 300 // ms

        while (retryCount < maxRetries) {
            try {
                // Add delay before first attempt and between retries
                if (retryCount > 0) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay))
                } else {
                    // Initial delay to let file write operations complete
                    await new Promise(resolve => setTimeout(resolve, 200))
                }

                file = await target.handle.getFile()
                console.log(`File size for hashing (attempt ${retryCount + 1}):`, file.size, 'bytes')

                if (file.size > 0) {
                    // File has content, proceed with hashing
                    break
                } else if (retryCount === maxRetries - 1) {
                    // Last attempt and still empty
                    console.warn('File is still empty after retries, cannot calculate meaningful hash')
                    throw new Error('File is empty after retries')
                }

                retryCount++

            } catch (fileError) {
                if (fileError.name === 'NotFoundError') {
                    throw new Error('Container file was deleted externally')
                }
                if (retryCount === maxRetries - 1) {
                    throw fileError
                }
                retryCount++
            }
        }

        const reader = file.stream().getReader()
        const totalSize = file.size
        let processedBytes = 0

        const chunks = []

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = new Uint8Array(value)
                chunks.push(chunk)
                processedBytes += chunk.byteLength

                const progress = Math.min(95, Math.floor((processedBytes / totalSize) * 100))
                setOverallHashing(progress)

                if (processedBytes > 1024 * 1024) {
                    await new Promise(resolve => setTimeout(resolve, 10))
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1))
                }
            }
        } finally {
            try { reader.releaseLock() } catch (_) {}
        }

        console.log('Total bytes read:', processedBytes, 'chunks:', chunks.length)

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

        console.log('Combined array length:', allBytes.length)
        const hashBuffer = await crypto.subtle.digest('SHA-256', allBytes)
        setOverallHashing(100)

        const hash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')

        console.log('Calculated hash:', hash)
        return hash

    } catch (error) {
        console.error('Error calculating container hash:', error)
        setOverallHashing(0)
        throw error
    }
}

// Hash calculation for File objects (used during decompression)
export const getFileHash = async (file, setOverallHashing) => {
    if (!file) {
        throw new Error('Cannot calculate hash: no file provided')
    }

    try {
        setOverallHashing(0)

        const reader = file.stream().getReader()
        const totalSize = file.size
        let processedBytes = 0

        const chunks = []

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = new Uint8Array(value)
                chunks.push(chunk)
                processedBytes += chunk.byteLength

                const progress = Math.min(95, Math.floor((processedBytes / totalSize) * 100))
                setOverallHashing(progress)

                if (processedBytes > 1024 * 1024) {
                    await new Promise(resolve => setTimeout(resolve, 10))
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1))
                }
            }
        } finally {
            try { reader.releaseLock() } catch (_) {}
        }

        console.log('Total bytes read:', processedBytes, 'chunks:', chunks.length)

        if (processedBytes === 0) {
            throw new Error('No data was read from file')
        }

        setOverallHashing(98)

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
        const allBytes = new Uint8Array(totalLength)
        let offset = 0
        for (const chunk of chunks) {
            allBytes.set(chunk, offset)
            offset += chunk.length
        }

        console.log('Combined array length:', allBytes.length)
        const hashBuffer = await crypto.subtle.digest('SHA-256', allBytes)
        setOverallHashing(100)

        const hash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')

        console.log('Calculated hash:', hash)
        return hash

    } catch (error) {
        console.error('Error calculating file hash:', error)
        setOverallHashing(0)
        throw error
    }
}

export const removeContainer = async (container, targetRef, setTokenFiles, setContainer) => {
    if (!container) return

    try {
        if (targetRef.current?.kind === 'savePicker' && targetRef.current?.handle) {
            try {
                await targetRef.current.handle.remove()
            } catch (removeError) {
                console.warn('Could not remove container file:', removeError.message)
            }
        } else if (targetRef.current?.kind === 'downloads') {
            console.log('Downloads folder file cannot be automatically removed')
        }

        setTokenFiles(prev => prev.map(item => ({
            ...item,
            status: 'queued',
            progress: 0,
            error: null,
        })))

        // Force clear all references to prevent hanging on deleted files
        clearTargetRef(targetRef)
        setContainer(null)

    } catch (error) {
        console.error('Error removing container:', error)
        throw error
    }
}

export const removeExtractedFilesFolder = async (container, tokenFiles) => {
    if (!container?.folderHandle) {
        console.log('No folder handle available for cleanup')
        return
    }

    try {
        console.log('Removing extracted files folder:', container.extractionPath)

        // Clean up preview URLs first
        tokenFiles.forEach(file => {
            if (file.previewUrl) {
                URL.revokeObjectURL(file.previewUrl)
            }
        })

        // Remove the entire extraction folder
        await container.folderHandle.remove({ recursive: true })
        console.log('Successfully removed extraction folder')

    } catch (error) {
        console.warn('Could not remove extraction folder:', error.message)
        // Don't throw error - folder cleanup is not critical
    }
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

export const decompressContainer = async (containerFile, setOverallDecompressing, setTokenFiles, downloadsHandle = null, cancelFlagRef = null) => {
    const { unzip } = await import('fflate')

    try {
        setOverallDecompressing(0)
        console.log('Starting disk-based decompression of:', containerFile.name)

        // Check for cancellation
        if (cancelFlagRef?.current) {
            throw new Error('Decompression cancelled')
        }

        // Check if File System Access API is supported
        if (!downloadsHandle && !window.showDirectoryPicker) {
            throw new Error('File System Access API not supported. Please use Chrome/Edge browser.')
        }

        // Create folder name based on container file name (remove .zip extension)
        const baseName = containerFile.name.replace(/\.zip$/i, '')
        const folderName = `${baseName}_extracted`

        // Use provided handle or try to get Downloads folder automatically
        let actualDownloadsHandle = downloadsHandle

        if (!actualDownloadsHandle) {
            try {
                console.log('No downloads handle provided, trying to get Downloads folder automatically')
                // Try to get Downloads folder without user prompt
                actualDownloadsHandle = await window.showDirectoryPicker({
                    startIn: 'downloads',
                    mode: 'readwrite'
                })
            } catch (error) {
                console.log('Auto-selection failed, asking user to select folder')
                throw new Error('Please select a folder where to extract the container files.')
            }
        }

        // Create extraction folder
        let extractionFolderHandle
        try {
            extractionFolderHandle = await actualDownloadsHandle.getDirectoryHandle(folderName, { create: true })
        } catch (error) {
            console.error('Failed to create extraction folder:', error)
            throw new Error(`Cannot create folder "${folderName}". Please ensure you have write permissions to the selected directory.`)
        }

        // Check for cancellation after folder creation
        if (cancelFlagRef?.current) {
            // Include folderHandle in error for cleanup
            const error = new Error('Decompression cancelled')
            error.extractionFolderHandle = extractionFolderHandle
            error.folderName = folderName
            throw error
        }

        const arrayBuffer = await containerFile.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        return new Promise((resolve, reject) => {
            const files = []
            let processedEntries = 0
            let totalEntries = 0

            unzip(uint8Array, async (err, data) => {
                if (err) {
                    console.error('Decompression error:', err)
                    reject(err)
                    return
                }

                totalEntries = Object.keys(data).length
                console.log('Total entries to extract to disk:', totalEntries)

                if (totalEntries === 0) {
                    resolve([])
                    return
                }

                const entries = Object.entries(data)

                try {
                    for (let i = 0; i < entries.length; i++) {
                        // Check for cancellation before processing each file
                        if (cancelFlagRef?.current) {
                            const error = new Error('Decompression cancelled')
                            error.extractionFolderHandle = extractionFolderHandle
                            error.folderName = folderName
                            reject(error)
                            return
                        }

                        const [fileName, fileData] = entries[i]
                        const pathParts = fileName.split('/')
                        const actualFileName = pathParts.pop() || fileName

                        // Create nested directories if needed
                        let currentDirHandle = extractionFolderHandle
                        for (const dirName of pathParts) {
                            if (dirName) {
                                try {
                                    currentDirHandle = await currentDirHandle.getDirectoryHandle(dirName, { create: true })
                                } catch (dirError) {
                                    console.error(`Failed to create directory "${dirName}":`, dirError)
                                    throw new Error(`Cannot create directory structure for "${fileName}"`)
                                }
                            }
                        }

                        // Create file handle and write data
                        let fileHandle, writable
                        try {
                            fileHandle = await currentDirHandle.getFileHandle(actualFileName, { create: true })
                            writable = await fileHandle.createWritable()
                        } catch (fileError) {
                            console.error(`Failed to create file "${actualFileName}":`, fileError)
                            throw new Error(`Cannot create file "${actualFileName}". Check file name validity and permissions.`)
                        }

                        try {
                            // Write file data in chunks for large files - streaming approach
                            const chunkSize = 64 * 1024 // 64KB chunks
                            for (let offset = 0; offset < fileData.length; offset += chunkSize) {
                                // Check for cancellation during file write
                                if (cancelFlagRef?.current) {
                                    await writable.close()
                                    const error = new Error('Decompression cancelled')
                                    error.extractionFolderHandle = extractionFolderHandle
                                    error.folderName = folderName
                                    reject(error)
                                    return
                                }

                                const chunk = fileData.slice(offset, offset + chunkSize)
                                await writable.write(chunk)

                                // Progress update for large files
                                if (fileData.length > 1024 * 1024) { // Files > 1MB
                                    const fileProgress = Math.floor((offset / fileData.length) * 100)
                                    if (fileProgress % 10 === 0) { // Update every 10%
                                        // console.log(`Writing ${actualFileName}: ${fileProgress}%`)
                                    }
                                    // Small delay for very large files to prevent UI blocking
                                    if (offset > 0) {
                                        await new Promise(resolve => setTimeout(resolve, 2))
                                    }
                                }
                            }

                            await writable.close()
                        } catch (writeError) {
                            console.error(`Failed to write file "${actualFileName}":`, writeError)
                            try {
                                await writable.close()
                            } catch (closeError) {
                                console.warn('Failed to close writable stream:', closeError)
                            }
                            throw new Error(`Failed to write file "${actualFileName}". Check available disk space.`)
                        }

                        // Create metadata object for UI
                        const fileInfo = {
                            id: Math.random().toString(36),
                            name: actualFileName,
                            size: fileData.length,
                            type: getFileType(fileName),
                            relativePath: fileName,
                            status: 'done',
                            diskPath: `${folderName}/${fileName}`,
                            fileHandle: fileHandle,
                            isOnDisk: true
                        }

                        // Generate preview for images/videos/audio from disk file
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

                        files.push(fileInfo)

                        processedEntries++
                        const progress = Math.floor((processedEntries / totalEntries) * 100)
                        setOverallDecompressing(progress)

                        // Add delays for UI updates
                        if (i > 0 && i % 5 === 0) { // Every 5 files
                            await new Promise(resolve => setTimeout(resolve, 30))
                        } else {
                            await new Promise(resolve => setTimeout(resolve, 10))
                        }
                    }

                    // Final check for cancellation before setting files
                    if (cancelFlagRef?.current) {
                        const error = new Error('Decompression cancelled')
                        error.extractionFolderHandle = extractionFolderHandle
                        error.folderName = folderName
                        reject(error)
                        return
                    }

                    console.log(`Decompression completed, ${files.length} files saved to ${folderName}`)
                    setTokenFiles(files)
                    setOverallDecompressing(100)

                    setTimeout(() => {
                        resolve({
                            files,
                            extractionPath: folderName,
                            folderHandle: extractionFolderHandle
                        })
                    }, 200)

                } catch (processingError) {
                    console.error('Error during disk extraction:', processingError)
                    reject(processingError)
                }
            })
        })

    } catch (error) {
        console.error('Error decompressing container to disk:', error)
        setOverallDecompressing(0)
        throw error
    }
}

const getFileType = (fileName) => {
    const ext = getExt(fileName)
    const mimeTypes = {
        'txt': 'text/plain',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'pdf': 'application/pdf',
        'zip': 'application/zip',
        'json': 'application/json',
        'js': 'application/javascript',
        'css': 'text/css',
        'html': 'text/html'
    }
    return mimeTypes[ext] || 'application/octet-stream'
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

export const getAndCheckTokenData = async (tokenPublicKey, hash) => {
    const tokenData = await getData(tokenPublicKey)
    if (!tokenData?.tokenPublicKey) {
        throw new Error('No token found')
    }
    if (tokenData.tokenPublicKey !== tokenPublicKey) {
        throw new Error('Wrong token public key')
    }
    if (!tokenData.metadata?.hash) {
        throw new Error('Wrong token hash')
    }
    if (tokenData.metadata?.hash !== hash) {
        throw new Error('Container hash doesn\'t match token hash')
    }

    return tokenData
}






















// TODO - Is for testing !!! Move out from here !!!
// =================================================== Sign Message ====================================================
/*
    зберігайти message, address, signatureBase64, date, nonce на бекенді — вони знадобляться для верифікації
    Виклик: signWithPhantom().then(console.log).catch(console.error)
    Не змінюйте ані символ у підписуваному рядку між формуванням і підписом.
    Додавайте Nonce і поточну Дата до кожного нового підпису — це захист від повторного використання підписів (replay).
    За бажання можна додати рядок Origin: your-domain.tld, щоб зв’язати підпис із вашим сайтом/доменом.
    Формат зручний для показу юзеру та простий для верифікації на сервері (ed25519 для Solana; personal_sign/EIP-191 для Ethereum).
*/
//  helpers
function nowUtc() {
    // "YYYY-MM-DD HH:MM:SS UTC"
    const iso = new Date().toISOString();                  // 2025-09-05T12:34:56.789Z
    const trimmed = iso.replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
    return trimmed;
}

function genNonce(bytes = 8) { // 8 байт => 16 hex-символів
    const a = new Uint8Array(bytes);
    crypto.getRandomValues(a);
    return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}

function buildMessage(address, date, nonce) {
    return `Підтвердження власності гаманця

Адреса: ${address}
Дата: ${date}
Nonce: ${nonce}

Я підтверджую, що цей гаманець належить мені.`;
}

async function signWithPhantom() {
    if (!window.solana) {
        throw new Error('Solana гаманець не знайдено. Встановіть Phantom або інший Solana-віджет.');
    }

    // 1) Підключення гаманця
    const resp = await window.solana.connect(); // за потреби покаже модальне вікно
    const address = resp.publicKey.toBase58();

    // 2) Формуємо повідомлення
    const date = nowUtc();
    const nonce = genNonce(8); // 16-символьний hex
    const message = buildMessage(address, date, nonce);

    // 3) Підпис
    const encoded = new TextEncoder().encode(message);
    const { signature, publicKey } = await window.solana.signMessage(encoded); // Uint8Array

    // 4) Зручно кодуємо підпис (base64)
    const signatureBase64 = btoa(String.fromCharCode(...signature));

    console.log('Message:\n', message);
    console.log('Address:', publicKey.toBase58());
    console.log('Signature (base64):', signatureBase64);

    // Повертаємо для подальшої відправки на сервер/верифікації
    return { message, address: publicKey.toBase58(), signatureBase64, date, nonce };
}

// --------- END Sign Message-------------------------------------------------------------------------------------------
