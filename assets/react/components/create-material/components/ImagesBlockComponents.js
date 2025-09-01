import React, { useMemo, useRef, useState } from 'react'

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

const createItem = (file) => ({
    id: genId(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    relativePath: file.webkitRelativePath || file.relativePath || file.path || "",
    previewUrl: (isImage(file) || isVideo(file) || isAudio(file) || isPdf(file)) ? URL.createObjectURL(file) : null,
    status: "queued", // ???????
    progress: 0, // ???????
    error: null, // ???????
})

const getExt = (name = '') => name.split('.').pop()?.toLowerCase() || ''
const isImage = (f) => f?.type?.startsWith('image/') || ['png','jpg','jpeg','gif','bmp','webp','avif'].includes(getExt(f?.name))
const isVideo = (f) => f?.type?.startsWith('video/') || ['mp4','webm','mov','m4v','mkv','avi'].includes(getExt(f?.name))
const isAudio = (f) => f?.type?.startsWith('audio/') || ['mp3','wav','ogg','m4a','aac','flac'].includes(getExt(f?.name))
const isPdf   = (f) => f?.type === 'application/pdf' || getExt(f?.name) === 'pdf'

const prettyBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

const SelectFiles = ({addFiles}) => {
    const fileInputRef = useRef(null)
    const dirInputRef = useRef(null)

    const onPickFiles = (e) => addFiles(e.target.files)
    const onPickDir = (e) => addFiles(e.target.files)

    return (
        <div className="d-flex flex-wrap align-items-center gap-2">
            Select files:
            <div className="ms-auto d-flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-outline-secondary">
                    Pick files
                </button>
                <button type="button" onClick={() => dirInputRef.current?.click()} className="btn btn-outline-secondary" title="Pick a folder (where supported)">
                    Pick folder
                </button>
                <input ref={fileInputRef} type="file" multiple className="d-none" onChange={onPickFiles} />
                <input ref={dirInputRef} type="file" webkitdirectory="" directory="" multiple className="d-none" onChange={onPickDir} />
            </div>
        </div>
    )
}

const classNames = (...xs) => xs.filter(Boolean).join(' ')

const DropZone = ({addFiles}) => {
    const [dragOver, setDragOver] = useState(false)

    const onDragLeave = () => setDragOver(false)

    const onDragOver = (e) => {
        e.preventDefault()
        setDragOver(true)
    }

    const traverseEntry = (entry, path = '') => new Promise((resolve) => {
        if (!entry) return resolve([])
        if (entry.isFile) {
            entry.file((file) => {
                Object.defineProperty(file, 'relativePath', { value: path + entry.name })
                resolve([file])
            }, () => resolve([]))
        } else if (entry.isDirectory) {
            const reader = entry.createReader()
            reader.readEntries((entries) => {
                const tasks = entries.map((ent) => traverseEntry(ent, path + entry.name + '/'))
                Promise.all(tasks).then((chunks) => resolve(chunks.flat()))
            }, () => resolve([]))
        } else {
            resolve([])
        }
    })

    const onDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        const dt = e.dataTransfer
        if (dt?.items) {
            const entries = []
            for (const item of dt.items) {
                const entry = item.getAsEntry?.() || item.webkitGetAsEntry?.()
                if (entry) entries.push(entry)
            }
            if (entries.length) {
                const promises = entries.map((entry) => traverseEntry(entry))
                Promise.all(promises).then((all) => addFiles(all.flat()))
                return
            }
        }
        addFiles(dt.files)
    }

    return (
        <div
            className={classNames("w-100 p-4 text-center border border-2 rounded", dragOver && "bg-light")}
            style={{ borderStyle: "dashed" }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <div>
                <div className="fw-semibold">Drag & Drop files or folders here</div>
                <div className="small text-muted">or use the buttons above</div>
            </div>
        </div>
    )
}

const SummaryActions = ({items, clearAll}) => {
    const totalSelected = useMemo(() => items.length, [items])
    const totalSize = useMemo(() => items.reduce((s, it) => s + (it.size || 0), 0), [items])

    // TODO - USE COMPRESSING STATUS
    const anyUploading = useMemo(() => items.some((x) => x.status === 'uploading'), [items])

    return (
        <div className="d-flex flex-wrap align-items-center gap-2">
            Selected: <span className="fw-semibold">{totalSelected}</span> files · Total size: {prettyBytes(totalSize)}
            <div className="ms-auto d-flex gap-2">
                <button type="button" onClick={clearAll} disabled={!items.length || anyUploading} className="btn btn-outline-secondary">
                    Clear all
                </button>
            </div>
        </div>
    )
}

const ImagePreview = ({it}) => {
    const f = it.file || it
    const _isV = isVideo(f)
    const _isI = isImage(f)
    const _isA = isAudio(f)
    const _isP = isPdf(f)
    const boxW = _isV ? 160 : 96 // ширше для відео
    const boxH = _isV ? 90 : 96 // 16:9 для відео

    return (
        <div
            className="bg-light rounded d-flex align-items-center justify-content-center"
            style={{ width: boxW, height: boxH, overflow: "hidden", minWidth: boxW }}
        >
            {_isI && it.previewUrl && (
                <img
                    src={it.previewUrl}
                    alt={it.name}
                    className="img-fluid"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            )}
            {_isV && it.previewUrl && (
                <video
                    controls
                    preload="metadata"
                    style={{ width: "100%", height: "100%" }}
                >
                    <source src={it.previewUrl} type={it.type || undefined} />
                </video>
            )}
            {_isA && it.previewUrl && (
                <audio src={it.previewUrl} controls className="w-100" />
            )}
            {_isP && it.previewUrl && (
                <embed src={it.previewUrl} type="application/pdf" style={{ width: "100%", height: "100%" }} />
            )}
            {!it.previewUrl && (
                <span className="small text-muted text-center p-1">
                    {it.type || (getExt(it.name) ? `.${getExt(it.name)}` : "file")}
                </span>
            )}
        </div>
    )
}

const ImageInfo = ({it}) => (
    <div className="flex-grow-1 min-w-0">
        <div className="d-flex align-items-center gap-2">
            <div className="text-truncate fw-semibold" title={it.name}>{it.name}</div>
        </div>
        <div className="small text-muted">{prettyBytes(it.size)} · {it.type || "unknown"}</div>

        {/* Text preview (fallback) */}
        {!it.previewUrl && it.type.startsWith("text/") && (
            <div className="mt-2 p-2 bg-light border rounded small" style={{ maxHeight: 96, overflow: "auto" }}>
                <pre className="m-0">{it.file ? it.file.name : "Preview not available"}</pre>
            </div>
        )}

        {/* Progress & status */}
        <div className="mt-2">
            {it.status === "uploading" && (
                <div className="progress" role="progressbar" aria-label="upload progress">
                    <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${it.progress || 30}%` }} />
                </div>
            )}
            {it.status === "uploaded" && (
                <div className="small text-success">Uploaded</div>
            )}
            {it.status === "error" && (
                <div className="small text-danger">Error: {it.error}</div>
            )}
        </div>
    </div>
)

const FilesList = ({items, removeOne, clearAll}) => {
    if (!items.length) return (
        <li className="list-group-item text-center small text-muted">No files selected yet.</li>
    )

    return (
        <>
            <SummaryActions items={items} clearAll={clearAll} />
            <ul className="list-group list-group-flush border rounded overflow-hidden">
                {items.map((it) => (
                    <li key={it.id} className="list-group-item d-flex align-items-start gap-3">
                        <ImagePreview it={it} />
                        <ImageInfo  it={it} />
                        <div className="d-flex align-items-center gap-2">
                            <button type="button" onClick={() => removeOne(it.id)} disabled={it.status === "uploading"} className="btn btn-outline-secondary btn-sm">
                                Remove
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </>
    )
}

export { createItem, SelectFiles, DropZone, SummaryActions, FilesList }
