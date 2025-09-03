import React, { useCallback, useState, useEffect } from 'react'
import { SelectFiles, FilesList, DropZone, IsNotReady } from './create-container/Components'
import { createItem, checkSwAvailability } from './create-container/utils'
import { Compressing } from './create-container/Compressing'

export const CreateContainer = ({
    items,
    setItems,
    container,
    setContainer,
    targetRef,
    isCompressing,
    setIsCompressing,
}) => {
    const [ssReady, setSsReady] = useState(false)
    const [ssError, setSsError] = useState(null)

    useEffect(() => {
        return checkSwAvailability(setSsReady, setSsError)
    }, [])

    const addFiles = useCallback((fileList) => {
        const files = Array.from(fileList || [])
        if (!files.length) return
        setItems((prev) => {
            const existingKeys = new Set(prev.map((p) => `${p.name}|${p.size}|${p.lastModified}`))
            const add = []
            for (const f of files) {
                const k = `${f.name}|${f.size}|${f.lastModified}`
                if (!existingKeys.has(k)) add.push(createItem(f))
            }
            return [...prev, ...add]
        })
    }, [])

    const removeOne = (id) => {
        setItems((prev) => {
            const next = prev.filter((x) => x.id !== id)
            prev.forEach((x) => { if (x.id === id && x.previewUrl) URL.revokeObjectURL(x.previewUrl) })
            return next
        })
    }

    const clearAll = () => {
        setItems((prev) => {
            prev.forEach((x) => x.previewUrl && URL.revokeObjectURL(x.previewUrl))
            return []
        })
    }

    const filesActionsDisabled = () => isCompressing || container

    if (!window.showSaveFilePicker && !ssReady) return (
        <IsNotReady ssError={ssError} />
    )

    return (
        <div className="row g-3">
            <div className="d-flex flex-column gap-3 mb-3">
                <SelectFiles addFiles={addFiles} disabled={filesActionsDisabled()} />
                <DropZone addFiles={addFiles} disabled={filesActionsDisabled()} />
                <FilesList items={items} removeOne={removeOne} clearAll={clearAll} disabled={filesActionsDisabled()}/>
                <Compressing
                    items={items} setItems={setItems}
                    isCompressing={isCompressing} setIsCompressing={setIsCompressing}
                    container={container} setContainer={setContainer} targetRef={targetRef}
                />
            </div>
        </div>
    )
}
