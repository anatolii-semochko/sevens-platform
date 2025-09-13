import React, { useCallback, useState, useRef } from 'react'
import { FilesList, SelectContainerFile, DecompressingStatus } from './create-container/Components'
import { decompressContainer } from './create-container/utils'

const Decompressing = ({tokenFiles, setTokenFiles, container, setContainer, targetRef}) => {
    const [overallDecompressing, setOverallDecompressing] = useState(0)
    const cancelFlagRef = useRef(false)

    const startDecompression = useCallback(async () => {
        if (!container?.file || container?.isDecompressing) return

        setContainer(prev => ({ ...prev, isDecompressing: true }))
        setOverallDecompressing(0)
        cancelFlagRef.current = false

        try {
            const files = await decompressContainer(container.file, setOverallDecompressing, setTokenFiles)
            if (!cancelFlagRef.current) {
                setContainer(prev => ({ ...prev, files, isDecompressing: false }))
            }
        } catch (error) {
            console.error('Decompression failed:', error)
            if (!cancelFlagRef.current) {
                setContainer(prev => ({ ...prev, isDecompressing: false }))
                alert(`Decompression failed: ${error.message}`)
            }
        }
    }, [container?.file, container?.isDecompressing, setContainer, setTokenFiles])

    const cancelDecompression = useCallback(() => {
        cancelFlagRef.current = true
        setContainer(prev => ({ ...prev, isDecompressing: false }))
        setOverallDecompressing(0)
    }, [setContainer])

    if (!container?.file) return null

    return (
        <>
            <DecompressingStatus container={container} overallDecompressing={overallDecompressing} />
            <div className="d-flex gap-2 align-items-center">
                {!container.isDecompressing && !container.files && (
                    <button className="btn btn-primary" onClick={startDecompression}>
                        Extract Files from Container
                    </button>
                )}
                {container.isDecompressing && (
                    <span>
                        Extracting files from container...
                        <button className="btn btn-outline-danger ms-3" onClick={cancelDecompression}>Cancel</button>
                    </span>
                )}
                {container.files && (
                    <div className="text-muted small">
                        <div>Extracted {tokenFiles.length} files from <span className="fw-semibold">{container.file.name}</span></div>
                    </div>
                )}
            </div>
        </>
    )
}

export const DecompressContainer = ({tokenFiles, setTokenFiles, container, setContainer, targetRef, doMaterial}) => {
    const setAsMain = (id) => {
        setTokenFiles((prev) => {
            return prev.map((x) => ({
                ...x,
                main: x.id === id
            }))
        })
    }

    const removeOne = (id) => {
        setTokenFiles((prev) => prev.filter(x => x.id !== id))
    }

    const clearAll = () => {
        setTokenFiles([])
        setContainer(null)
    }

    const onSelectContainer = (file) => {
        setContainer({ file, name: file.name })
        setTokenFiles([])
    }

    return (
        <div className="row g-3">
            <div className="d-flex flex-column gap-3 mb-3">
                <SelectContainerFile container={container} onSelectContainer={onSelectContainer} />
                <Decompressing {...{tokenFiles, setTokenFiles, container, setContainer, targetRef}} />
                {tokenFiles.length > 0 && (
                    <FilesList {...{tokenFiles, doMaterial, setAsMain, removeOne, clearAll, disabled: !!container?.isDecompressing}} />
                )}
            </div>
        </div>
    )
}
