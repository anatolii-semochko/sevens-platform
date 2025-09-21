import React, { useCallback, useState, useRef, useEffect } from 'react'
import { decompressContainerSmart, removeExtractedFilesFolder, cleanupMemoryFiles } from '../../utils/files'
import { DecompressionCancellationToken, isCancellationError } from './DecompressionCancellationToken'
import { DecompressingStatus } from '.././create-container/Components'
import { FILE_MEMORY_DECOMPRESSION_LIMIT } from '../../constants'

export const Decompressing = ({tokenFiles, setTokenFiles, container, setContainer, onStartDecompression, tokenData}) => {
    const cancellationTokenRef = useRef(null)
    const [overallDecompressing, setOverallDecompressing] = useState(0)

    const startDecompression = useCallback(async (containerToUse = container) => {
        if (!containerToUse?.file || containerToUse?.isDecompressing) return

        const useMemoryMode = containerToUse.file.size <= FILE_MEMORY_DECOMPRESSION_LIMIT

        // Get directory picker for extraction only if using disk mode
        let downloadsHandle = containerToUse.downloadsHandle
        if (!useMemoryMode && !downloadsHandle) {
            try {
                if (window.showDirectoryPicker) {
                    downloadsHandle = await window.showDirectoryPicker({
                        startIn: 'downloads',
                        mode: 'readwrite'
                    })
                    setContainer(prev => ({ ...prev, downloadsHandle }))
                } else {
                    throw new Error('Directory picker not supported')
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    return // User cancelled directory selection
                }
                return
            }
        }

        // Create cancellation token and start decompression
        cancellationTokenRef.current = new DecompressionCancellationToken()
        setContainer(prev => ({ ...prev, isDecompressing: true }))
        setOverallDecompressing(0)

        try {
            const result = await decompressContainerSmart(
                containerToUse.file,
                setOverallDecompressing,
                downloadsHandle,
                cancellationTokenRef.current,
                FILE_MEMORY_DECOMPRESSION_LIMIT,
            )

            // Update UI with extracted files
            setTokenFiles(result.files)
            setContainer(prev => ({
                ...prev,
                files: result.files,
                extractionPath: result.extractionPath,
                folderHandle: result.folderHandle,
                usedMemory: result.usedMemory,
                isDecompressing: false,
            }))

        } catch (error) {
            if (isCancellationError(error)) {
                await cleanupAfterCancellation(error.folderHandle)
            } else {
                console.error('Decompression failed:', error)
                setContainer(prev => ({ ...prev, isDecompressing: false }))
            }
        }
    }, [setContainer, setTokenFiles])

    const cleanupAfterCancellation = useCallback(async (folderHandleFromError = null) => {
        // Clean up memory files if they exist
        if (tokenFiles && tokenFiles.length > 0) {
            cleanupMemoryFiles(tokenFiles)
        }

        setTokenFiles([])
        setContainer(prev => ({
            ...prev,
            isDecompressing: false,
            files: null,
            extractionPath: null,
            folderHandle: null,
            usedMemory: false,
        }))
        setOverallDecompressing(0)

        // Clean up disk files if folder handle exists
        if (folderHandleFromError) {
            try {
                await folderHandleFromError.remove({ recursive: true })
            } catch (cleanupError) {
                console.warn('Could not remove extraction folder:', cleanupError.message)
            }
        }
    }, [tokenFiles, setTokenFiles, setContainer])

    const cancelDecompression = useCallback(() => {
        if (cancellationTokenRef.current) {
            cancellationTokenRef.current.cancel('User cancelled decompression')
        }
    }, [])

    // Auto-start decompression for memory mode when tokenData is valid
    useEffect(() => {
        if (tokenData && !tokenData.error && container?.file && !container.files && !container.isDecompressing) {
            const useMemoryMode = container.file.size <= FILE_MEMORY_DECOMPRESSION_LIMIT
            if (useMemoryMode) {
                startDecompression()
            }
        }
    }, [tokenData, container, startDecompression])

    // Pass startDecompression function to parent
    useEffect(() => {
        if (onStartDecompression) {
            onStartDecompression(startDecompression)
        }
    }, [onStartDecompression, startDecompression])

    if (!container?.file) return null

    return container.isDecompressing && (
        <div>
            <DecompressingStatus container={container} overallDecompressing={overallDecompressing} />
            <button className="btn btn-outline-danger w-100 mt-2 p-2" onClick={cancelDecompression}>
                Cancel extraction
            </button>
        </div>
    )
}

export const ButtonSelectDecompressionFolder = ({tokenData, container, handleStartDecompression}) => {
    if (!tokenData || tokenData.error || container?.files || container?.isDecompressing) {
        return null
    }

    if (container?.file?.size <= FILE_MEMORY_DECOMPRESSION_LIMIT) {
        return null
    }

    return (
        <div>
            <p>XXXXXXXXX XXXXXXXXXX XXXXXXXXXXXXXXX XXXXXXXXXXXXXXXX XXXXXXXXXXXX</p>
            <button className="btn btn-success w-100 fs-5 p-3 mb-3" onClick={handleStartDecompression}>
                Select folder and extract files to disk
            </button>
        </div>
    )
}

export const ButtonClearPickContainer = ({container, tokenFiles, tokenData, handlerClear}) => {
    const handleClear = useCallback(() => {
        if (container?.usedMemory && tokenFiles) {
            cleanupMemoryFiles(tokenFiles)
        }
        if (container?.folderHandle && tokenFiles) {
            removeExtractedFilesFolder(container, tokenFiles).catch()
        }
        handlerClear()
    }, [container, tokenFiles, handlerClear])

    return container && !container.isHashing && !container.isDecompressing && (container.files || tokenData) && (
        <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-primary fs-5 w-100 p-3" onClick={handleClear}>
                Clear and pick different container file
            </button>
        </div>
    )
}
