import React, { useCallback, useState, useEffect } from 'react'
import { SelectFiles, FilesList, DropZone, IsNotReady } from './create-container/Components'
import { createItem, checkSwAvailability } from './create-container/utils'
import { Compressing } from './create-container/Compressing'

export const CreateContainer = ({tokenFiles, setTokenFiles, container, setContainer, targetRef}) => {
    const [ssReady, setSsReady] = useState(false)
    const [ssError, setSsError] = useState(null)

    useEffect(() => {
        return checkSwAvailability(setSsReady, setSsError)
    }, [])

    const addFiles = useCallback((fileList) => {
        const files = Array.from(fileList || [])
        if (!files.length) return
        setTokenFiles((prev) => {
            const existingKeys = new Set(prev.map((p) => `${p.name}|${p.size}|${p.lastModified}`))
            const add = []
            for (const f of files) {
                const k = `${f.name}|${f.size}|${f.lastModified}`
                if (!existingKeys.has(k)) add.push(createItem(f))
            }
            return [...prev, ...add]
        })
    }, [])

    const setAsMain = (id) => {
        setTokenFiles((prev) => {
            return prev.map((x) => ({
                ...x,
                main: x.id === id
            }))
        })
    }

    const removeOne = (id) => {
        setTokenFiles((prev) => {
            const next = prev.filter((x) => x.id !== id)
            prev.forEach((x) => { if (x.id === id && x.previewUrl) URL.revokeObjectURL(x.previewUrl) })
            return next
        })
    }

    const clearAll = () => {
        setTokenFiles((prev) => {
            prev.forEach((x) => x.previewUrl && URL.revokeObjectURL(x.previewUrl))
            return []
        })
    }

    if (!window.showSaveFilePicker && !ssReady) return (
        <IsNotReady ssError={ssError} />
    )

    return (
        <div className="row g-3">
            <div className="d-flex flex-column gap-3 mb-3">
                <SelectFiles addFiles={addFiles} disabled={!!container} />
                <DropZone addFiles={addFiles} disabled={!!container} />
                <FilesList {...{tokenFiles, removeOne, clearAll, disabled: !!container}} />
                <Compressing {...{tokenFiles, setTokenFiles, container, setContainer, targetRef}} />
            </div>
        </div>
    )
}
