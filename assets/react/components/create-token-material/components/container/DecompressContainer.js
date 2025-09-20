import React, { useCallback, useState, useRef, useEffect } from 'react'
import { decompressContainer } from '../../utils/files'
import { DecompressionCancellationToken, isCancellationError } from './DecompressionCancellationToken'
import { DecompressingStatus } from '.././create-container/Components'

export const Decompressing = ({tokenFiles, setTokenFiles, container, setContainer, onStartDecompression}) => {
    const cancellationTokenRef = useRef(null)
    const [overallDecompressing, setOverallDecompressing] = useState(0)

    const startDecompression = useCallback(async (containerToUse = container) => {
        if (!containerToUse?.file || containerToUse?.isDecompressing) return

        // Get directory picker for extraction if not already selected
        let downloadsHandle = containerToUse.downloadsHandle
        if (!downloadsHandle) {
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
            const result = await decompressContainer(
                containerToUse.file,
                setOverallDecompressing,
                downloadsHandle,
                cancellationTokenRef.current
            )

            // Update UI with extracted files
            setTokenFiles(result.files)
            setContainer(prev => ({
                ...prev,
                files: result.files,
                extractionPath: result.extractionPath,
                folderHandle: result.folderHandle,
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
        setTokenFiles([])
        setContainer(prev => ({
            ...prev,
            isDecompressing: false,
            files: null,
            extractionPath: null,
            folderHandle: null
        }))
        setOverallDecompressing(0)

        if (folderHandleFromError) {
            try {
                await folderHandleFromError.remove({ recursive: true })
            } catch (cleanupError) {
                console.warn('Could not remove extraction folder:', cleanupError.message)
            }
        }
    }, [setTokenFiles, setContainer])

    const cancelDecompression = useCallback(() => {
        if (cancellationTokenRef.current) {
            cancellationTokenRef.current.cancel('User cancelled decompression')
        }
    }, [])

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
                Cancel extracting container files to disk
            </button>
        </div>
    )
}

export const ButtonSelectDecompressionFolder = ({
    tokenData,
    container,
    handleStartDecompression,
}) => tokenData && !tokenData.error && !container?.files && !container?.isDecompressing && (
    <button className="btn btn-success w-100 fs-5 p-3 mb-3" onClick={handleStartDecompression}>
        Select folder and extract files to continue
    </button>
)

export const ButtonClearPickContainer = ({
    container,
    handlerClear,
}) => container && !container.isHashing && !container.isDecompressing &&(
    <div className="d-flex justify-content-end gap-2">
        <button className="btn btn-primary fs-5 w-100 p-3" onClick={handlerClear}>
            Clear and pick different container file
        </button>
    </div>
)
