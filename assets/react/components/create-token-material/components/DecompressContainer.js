import React, { useCallback, useState, useRef, useEffect } from 'react'
import { DecompressingStatus } from './create-container/Components'
import {decompressContainer, removeExtractedFilesFolder} from './create-container/utils'

export const Decompressing = ({tokenFiles, setTokenFiles, container, setContainer, onStartDecompression}) => {
    const cancelFlagRef = useRef(false)
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
                    return // User cancelled
                }
                alert('Please select a folder for file extraction')
                return
            }
        }

        setContainer(prev => ({ ...prev, isDecompressing: true }))
        setOverallDecompressing(0)
        cancelFlagRef.current = false

        try {
            const result = await decompressContainer(containerToUse.file, setOverallDecompressing, setTokenFiles, downloadsHandle, cancelFlagRef)
            if (!cancelFlagRef.current) {
                setContainer(prev => ({
                    ...prev,
                    files: result.files || result,
                    extractionPath: result.extractionPath,
                    folderHandle: result.folderHandle,
                    isDecompressing: false,
                }))
            }
        } catch (error) {
            console.error('Decompression failed:', error)
            if (!cancelFlagRef.current) {
                setContainer(prev => ({ ...prev, isDecompressing: false }))
                alert(`Decompression failed: ${error.message}`)
            } else if (error.extractionFolderHandle) {
                setContainer(prev => ({
                    ...prev,
                    isDecompressing: false,
                    folderHandle: error.extractionFolderHandle,
                    extractionPath: error.folderName
                }))
                try {
                    await error.extractionFolderHandle.remove({ recursive: true })
                    console.log('Successfully removed cancelled extraction folder')
                } catch (cleanupError) {
                    console.warn('Could not immediately remove cancelled folder:', cleanupError.message)
                }
            }
        }
    }, [setContainer, setTokenFiles, setOverallDecompressing])

    const cancelDecompression = useCallback(async () => {
        cancelFlagRef.current = true
        await removeExtractedFilesFolder(container, tokenFiles)
        setTokenFiles([])
        setContainer(prev => ({
            ...prev,
            isDecompressing: false,
            files: null,
            extractionPath: null,
            folderHandle: null
        }))
        setOverallDecompressing(0)
    }, [setContainer, setOverallDecompressing, setTokenFiles, container, tokenFiles])

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
