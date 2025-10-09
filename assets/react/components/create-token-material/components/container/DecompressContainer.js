import React, { useCallback, useState, useRef, useEffect } from 'react'
import { prettyBytes } from '@js/utils/file'
import { decompressContainerSmart, removeExtractedFilesFolder, cleanupMemoryFiles } from '../../utils/files'
import { DecompressCancellationToken, isCancellationError } from './DecompressCancellationToken'
import { DecompressingStatus, FilesList } from '../container/Components'
import { ButtonLargeWidth } from '@react/components/form-elements/Buttons'
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
        cancellationTokenRef.current = new DecompressCancellationToken()
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
        <div className="mb-3">
            <DecompressingStatus container={container} overallDecompressing={overallDecompressing} />
            <button className="btn btn-outline-danger w-100 mt-2 p-2" onClick={cancelDecompression}>
                Cancel extraction
            </button>
        </div>
    )
}

export const ShowContainerFiles = ({
    container,
    setContainer,
    tokenData,
    tokenFiles,
    setTokenFiles,
    onStartDecompression,
    handleStartDecompression,
}) => {
    const [showFiles, setShowFiles] = useState(false)

    if (!tokenData || tokenData.error) return

    if (!showFiles) return (
        <button className="btn btn-primary w-100 fs-5 p-3 mb-3" onClick={() => setShowFiles(true)}>
            Show container files
        </button>
    )

    return (
        <div>
            <ButtonSelectDecompressionFolder {...{tokenData, container, handleStartDecompression}} />
            <Decompressing {...{tokenFiles, setTokenFiles, container, setContainer, onStartDecompression, tokenData}} />
            {!!tokenFiles?.length && (
                <FilesList {...{tokenFiles, disabled: true, className: 'mb-3'}} />
            )}
        </div>
    )
}

export const ButtonSelectDecompressionFolder = ({tokenData, container, handleStartDecompression}) => {
    if (container?.files || container?.isDecompressing) {
        return null
    }

    if (container?.file?.size <= FILE_MEMORY_DECOMPRESSION_LIMIT) {
        return null
    }

    return (
        <div>
            <p>
                Since the container file size is large ({prettyBytes(container?.file.size)}), we need
                to extract the files to disk in order to see them and select the main one for publication.
            </p>
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
        <ButtonLargeWidth
            className={'btn-primary'}
            label={'Clear and pick different container file'}
            onClick={handleClear}
        />
    )
}
