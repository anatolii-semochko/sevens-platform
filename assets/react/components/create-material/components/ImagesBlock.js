import React, { useCallback, useState } from 'react'
import { createItem, SelectFiles, FilesList, DropZone } from './ImagesBlockComponents'

export const ImagesBlock = ({ tokenImages, setTokenImages }) => {
    const [items, setItems] = useState([])

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

    return (
        <div className="d-flex flex-column gap-3 mb-3">
            <SelectFiles addFiles={addFiles} />
            <DropZone addFiles={addFiles} />
            <FilesList items={items} removeOne={removeOne} clearAll={clearAll} />
        </div>
    )
}

export default ImagesBlock
