import React, { useCallback, useState, useRef } from 'react'
import { FilesList, SelectContainerFile, DecompressingStatus, HashingStatus } from './create-container/Components'
import { decompressContainer, getPublicKeyFromContainerName, getFileHash } from './create-container/utils'

const Decompressing = ({tokenFiles, setTokenFiles, container, setContainer, setOverallHashing}) => {
    const [overallDecompressing, setOverallDecompressing] = useState(0)
    const cancelFlagRef = useRef(false)

    const onSelectContainer = async (file) => {
        // Get directory picker first while we're still in user gesture context
        let downloadsHandle = null
        try {
            if (window.showDirectoryPicker) {
                downloadsHandle = await window.showDirectoryPicker({
                    startIn: 'downloads',
                    mode: 'readwrite'
                })
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('User cancelled directory picker')
                return // User cancelled
            }
            
            // For other errors (including SecurityError), try to continue without directory picker
            console.warn('Directory picker failed, will try fallback:', error.message)
            
            // Ask user to select directory manually on first decompression attempt
            const userConfirm = confirm(
                'Could not automatically select extraction folder.\n\n' +
                'Click OK to manually select the Downloads folder, or Cancel to abort.'
            )
            if (!userConfirm) return
            
            // Set downloadsHandle to null - decompression will handle the error gracefully
            downloadsHandle = null
        }

        // Extract public key from container name if possible
        const publicKey = getPublicKeyFromContainerName(file.name)
        
        const newContainer = { 
            file, 
            name: file.name, 
            downloadsHandle,
            publicKey: publicKey
        }
        setContainer(newContainer)
        setTokenFiles([])
        await startDecompression(newContainer)
    }

    const startDecompression = useCallback(async (containerToUse = container) => {
        console.log('Starting decompression with container:', containerToUse)
        if (!containerToUse?.file || containerToUse?.isDecompressing) return

        console.log('Setting container isDecompressing: true')
        setContainer(prev => {
            const updated = { ...prev, isDecompressing: true }
            console.log('Container after setting isDecompressing:', updated)
            return updated
        })
        setOverallDecompressing(0)
        cancelFlagRef.current = false

        // Small delay to ensure UI updates with status bar
        await new Promise(resolve => setTimeout(resolve, 100))

        try {
            const result = await decompressContainer(containerToUse.file, setOverallDecompressing, setTokenFiles, containerToUse.downloadsHandle)
            if (!cancelFlagRef.current) {
                const updatedContainer = {
                    ...containerToUse,
                    files: result.files || result,
                    extractionPath: result.extractionPath,
                    folderHandle: result.folderHandle,
                    isDecompressing: false
                }
                setContainer(updatedContainer)

                // Start hashing the original container file after successful decompression
                await startHashingOriginalContainer(updatedContainer)
            }
        } catch (error) {
            console.error('Decompression failed:', error)
            if (!cancelFlagRef.current) {
                setContainer(prev => ({ ...prev, isDecompressing: false }))
                alert(`Decompression failed: ${error.message}`)
            }
        }
    }, [setContainer, setTokenFiles])

    const startHashingOriginalContainer = useCallback(async (containerToUse) => {
        console.log('Starting hash calculation for original container file')

        try {
            setContainer(prev => ({ ...prev, isHashing: true }))
            setOverallHashing(0)

            // Calculate hash using proper method from utils.js
            const hash = await getFileHash(containerToUse.file, setOverallHashing)

            if (!cancelFlagRef.current) {
                setContainer(prev => ({
                    ...prev,
                    hash: hash,
                    isHashing: false
                }))
            }

        } catch (error) {
            console.error('Hash calculation failed:', error)
            if (!cancelFlagRef.current) {
                setContainer(prev => ({ ...prev, isHashing: false }))
            }
        }
    }, [setContainer])


    const cancelDecompression = useCallback(() => {
        cancelFlagRef.current = true
        setContainer(prev => ({ ...prev, isDecompressing: false }))
        setOverallDecompressing(0)
    }, [setContainer])

    if (!container?.file) return (
        <div>
            <p>To publish material we need to extract files to your device and pick main one witch represents publication</p>
            <SelectContainerFile container={container} onSelectContainer={onSelectContainer} />
        </div>
    )

    return (
        <>
            <DecompressingStatus container={container} overallDecompressing={overallDecompressing} />
            <div className="d-flex gap-2 align-items-center">
                {container.isDecompressing && (
                    <span>
                        Extracting files from container...
                        <button className="btn btn-outline-danger ms-3" onClick={cancelDecompression}>Cancel</button>
                    </span>
                )}
                {container.files && (
                    <div className="text-muted small">
                        <div className="mb-2">
                            Extracted {tokenFiles.length} files from <span className="fw-semibold">{container.file.name}</span>
                        </div>
                        {container.extractionPath && (
                            <div>Saved to: <span className="fw-semibold">{container.extractionPath}</span></div>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}

export const DecompressContainer = ({tokenFiles, setTokenFiles, container, setContainer}) => {
    const [overallHashing, setOverallHashing] = useState(0)
    const removeOne = (id) => {
        setTokenFiles((prev) => {
            const next = prev.filter(x => x.id !== id)
            // Clean up preview URLs for removed files
            prev.forEach(x => {
                if (x.id === id && x.previewUrl) {
                    URL.revokeObjectURL(x.previewUrl)
                }
            })
            return next
        })
    }

    const clearAll = () => {
        setTokenFiles((prev) => {
            // Clean up all preview URLs
            prev.forEach(x => {
                if (x.previewUrl) {
                    URL.revokeObjectURL(x.previewUrl)
                }
            })
            return []
        })
        setContainer(null)
    }

    return (
        <div className="row g-3">
            <div className="d-flex flex-column gap-3 mb-3">
                <Decompressing {...{tokenFiles, setTokenFiles, container, setContainer, setOverallHashing}} />
                {tokenFiles.length > 0 && (
                    <FilesList {...{tokenFiles, removeOne, clearAll, disabled: true}} />
                )}
                <HashingStatus {...{container, overallHashing}} />
                {container?.hash && (
                    <div className="text-muted small">
                        Container hash: <span className="fw-semibold">{container.hash}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
