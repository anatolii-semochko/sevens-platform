import React, { useMemo, useRef, useState } from 'react'
import { getExt, isImage, isVideo, isAudio, isPdf, prettyBytes, classNames } from './utils'
import clsx from 'clsx'

export const IsNotReady = ({ssError}) => (
    <div className="alert alert-warning py-2 my-0">
        Downloads fallback isn’t ready. Make sure <code>/streamsaver-sw.js</code> is served and not blocked by your CSP.
        {ssError ? (<><br/>Error: {ssError}</>) : null}
        Or you can try different browser.
    </div>
)

export const FormTitle = ({publicMaterial}) => (
    <h1 className="text-center mt-3 mb-4">{publicMaterial ? 'Create Public Material' : 'Create Private Token'}</h1>
)

export const SetTokenType = ({publicMaterial, setPublicMaterial}) => (
    <>
        <div className="d-flex justify-content-center mb-2">
            <div className="btn-group" role="group">
                <button
                    className={clsx('btn px-3', !publicMaterial ? 'btn-primary' : 'btn-outline-secondary')}
                    onClick={() => setPublicMaterial(false)}
                >
                    Private token
                </button>
                <button
                    type="button"
                    className={clsx('btn px-3', publicMaterial ? 'btn-primary' : 'btn-outline-secondary')}
                    onClick={() => setPublicMaterial(true)}
                >
                    Public token (create material)
                </button>
            </div>
        </div>
        <h5 className="ti-5 lh-sm lh-lg-base p-3">
            {publicMaterial ? (
                <>Create token and publish material on site. Your files will be sent to list of public materials and visible for everyone.</>
            ) : (
                <>Create private token. This operations is safe, your files will not be sent out from your device. Data will be available for no one. Only token mint transaction sends to blockchain.</>
            )}
        </h5>
    </>
)

export const SelectFiles = ({addFiles, disabled}) => {
    if (disabled) return null

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

export const DropZone = ({addFiles, disabled}) => {
    if (disabled) return null

    const [dragOver, setDragOver] = useState(false)

    const onDragLeave = () => setDragOver(false)

    const onDragOver = (e) => {
        e.preventDefault()
        if (!disabled) setDragOver(true)
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
        if (disabled) return
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
            className={classNames("w-100 p-4 text-center border border-2 rounded", dragOver && "bg-light", disabled && "opacity-50")}
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

export const SummaryActions = ({items, clearAll, disabled}) => {
    const totalSelected = useMemo(() => items.length, [items])
    const totalSize = useMemo(() => items.reduce((s, it) => s + (it.size || 0), 0), [items])
    const anyCompressing = useMemo(() => items.some((x) => x.status === 'compressing'), [items])

    return (
        <div className="d-flex flex-wrap align-items-center gap-2">
            Selected: <span className="fw-semibold">{totalSelected}</span> files · Total size: {prettyBytes(totalSize)}
            <div className="ms-auto d-flex gap-2">
                {!disabled && (
                    <button type="button" onClick={clearAll} disabled={!items.length || anyCompressing} className="btn btn-outline-secondary">
                        Clear all
                    </button>
                )}
            </div>
        </div>
    )
}

export const ImagePreview = ({it}) => {
    const f = it.file || it
    const _isV = isVideo(f)
    const _isI = isImage(f)
    const _isA = isAudio(f)
    const _isP = isPdf(f)
    const boxW = 160 // _isV ? 160 : 96
    const boxH = 90 // _isV ? 90 : 96

    return (
        <div
            className="bg-light rounded d-flex align-items-center justify-content-center"
            style={{ width: boxW, height: boxH, overflow: "hidden", minWidth: boxW }}
        >
            {_isI && it.previewUrl && (
                <img src={it.previewUrl} alt={it.name} className="img-fluid" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            {_isV && it.previewUrl && (
                <video controls preload="metadata" style={{ width: "100%", height: "100%" }}>
                    <source src={it.previewUrl} type={it.type || undefined} />
                </video>
            )}
            {_isA && it.previewUrl && <audio src={it.previewUrl} controls className="w-100" />}
            {_isP && it.previewUrl && <embed src={it.previewUrl} type="application/pdf" style={{ width: "100%", height: "100%" }} />}
            {!it.previewUrl && (
                <span className="small text-muted text-center p-1">
                    {it.type || (getExt(it.name) ? `.${getExt(it.name)}` : "file")}
                </span>
            )}
        </div>
    )
}

export const ImageInfo = ({it}) => (
    <div className="flex-grow-1 min-w-0">
        <div className="d-flex align-items-center gap-2">
            <div className="text-truncate fw-semibold" title={it.name}>{it.name}</div>
        </div>
        <div className="small text-muted">{prettyBytes(it.size)} · {it.type || 'unknown'}</div>

        {!it.previewUrl && it.type?.startsWith?.('text/') && (
            <div className="mt-2 p-2 bg-light border rounded small" style={{ maxHeight: 96, overflow: 'auto' }}>
                <pre className="m-0">{it.file ? it.file.name : 'Preview not available'}</pre>
            </div>
        )}

        <div className="mt-2">
            {it.status === "compressing" && (
                <>
                    <div className="progress" role="progressbar" aria-label="compression progress">
                        <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${it.progress || 0}%` }} />
                    </div>
                    <div className="small text-muted mt-1">Compressing… {it.progress || 0}%</div>
                </>
            )}
            {it.status === 'done' && (
                <div className="small text-success">Compressed</div>
            )}
            {it.status === 'error' && (
                <div className="small text-danger">Error: {it.error}</div>
            )}
        </div>
    </div>
)

export const FilesList = ({items, removeOne, clearAll, disabled}) => {
    if (!items.length) return (
        <li className="list-group-item text-center small text-muted">No files selected yet.</li>
    )

    return (
        <>
            <SummaryActions items={items} clearAll={clearAll} disabled={disabled}/>
            <ul className="list-group list-group-flush border rounded overflow-hidden">
                {items.map((it) => (
                    <li key={it.id} className="list-group-item d-flex align-items-start gap-3">
                        <ImagePreview it={it} />
                        <ImageInfo  it={it} />
                        {!disabled && (
                            <div className="d-flex align-items-center gap-2">
                                <button type="button" onClick={() => removeOne(it.id)} disabled={it.status === "compressing"} className="btn btn-outline-secondary btn-sm">
                                    Remove
                                </button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </>
    )
}

export const CompressingActions = ({
    items,
    createContainer,
    isCompressing,
    container,
    cancelCompression,
}) => !!items.length && (
    <div className="d-flex gap-2 align-items-center">
        {!container && !isCompressing && (
            <button className="btn btn-info" disabled={isCompressing} onClick={createContainer}>
                Create container
            </button>
        )}
        {container && isCompressing && (
            <span>
                Creating container...
                <button className="btn btn-outline-danger ms-3" onClick={cancelCompression}>Cancel</button>
            </span>
        )}
        {container && !isCompressing && (
            <div className="text-muted small">
                <div className="mb-2">Saved as <span className="fw-semibold">{container.name}</span></div>
                <div>Container hash: <span className="fw-semibold">{container.hash}</span></div>
            </div>
        )}
    </div>
)

export const CompressingStatus = ({isCompressing, overallPct}) => isCompressing && (
    <div className="d-flex align-items-center gap-2">
        <div className="flex-grow-1">
            <div className="progress" role="progressbar" aria-label="total compression progress">
                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${overallPct}%` }} />
            </div>
            <div className="small text-muted mt-1">Total: {overallPct}%</div>
        </div>
    </div>
)

export const SelectedPublicKey = ({publicKey}) => (
    <div className="text-muted small mb-3">
        {publicKey ? (
            <span>Selected wallet for mint: <span className="fw-semibold">{publicKey.toString()}</span></span>
        ) : (
            <span className="text-danger">Select and activate your wallet for token mint. Wallet needs positive balance for transaction fee payment.</span>
        )}
    </div>
)
