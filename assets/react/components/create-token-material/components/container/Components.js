import React, { useMemo, useRef, useState, useEffect } from 'react'
import { getExt, prettyBytes, isImage, isVideo, isAudio, isPdf } from '@js/utils/file'
import { StatusBar } from '@react/components/form-elements/Charts'
import { InnerTable } from '../../components/token/Components'

export const IsNotReady = ({ssError}) => (
    <div className="alert alert-warning py-2 my-0">
        Downloads fallback isn’t ready. Make sure <code>/streamsaver-sw.js</code> is served and not blocked by your CSP.
        {ssError ? (<><br/>Error: {ssError}</>) : null}
        Or you can try different browser.
    </div>
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

export const SelectContainerFile = ({container, onSelectContainer, needsExtraction = false}) => {
    if (container) return null

    const fileInputRef = useRef(null)

    const onPickContainer = (e) => {
        const files = e.target.files
        if (files.length > 0) {
            const file = files[0]
            if (file.name.toLowerCase().endsWith('.zip')) {
                if (needsExtraction) {
                    onSelectContainer(file, null)
                } else {
                    onSelectContainer(file)
                }
            } else {
                alert('Please select a ZIP container file')
            }
        }
        // Reset input value to allow selecting the same file again
        e.target.value = ''
    }

    const handleButtonClick = async () => {
        // Use modern File System Access API if available
        if (window.showOpenFilePicker) {
            try {
                const fileHandles = await window.showOpenFilePicker({
                    types: [{
                        description: 'ZIP files',
                        accept: { 'application/zip': ['.zip'] }
                    }],
                    multiple: false
                })

                if (fileHandles && fileHandles[0]) {
                    const file = await fileHandles[0].getFile()

                    if (needsExtraction) {
                        // Try to get Downloads folder for extraction
                        let downloadsHandle = null
                        try {
                            downloadsHandle = await window.showDirectoryPicker({
                                startIn: 'downloads',
                                mode: 'readwrite'
                            })
                        } catch (dirError) {
                            if (dirError.name === 'AbortError') {
                                return // User cancelled directory selection
                            }
                            // Continue without handle - will show error asking user to select folder
                        }
                        onSelectContainer(file, downloadsHandle)
                    } else {
                        // Just return the file without extraction
                        onSelectContainer(file)
                    }
                    return
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    return // User cancelled
                }
                console.warn('File picker failed, falling back to input:', error)
            }
        }

        // Fallback to traditional file input
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    return (
        <div className="mb-4">
            <button onClick={handleButtonClick} className="btn btn-primary fs-4 w-100 p-3">
                Select container file
            </button>
            <input ref={fileInputRef} type="file" accept=".zip" className="d-none" onChange={onPickContainer} />
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

    const classNames = (...xs) => xs.filter(Boolean).join(' ')

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

export const SummaryActions = ({tokenFiles, clearAll, disabled}) => {
    const totalSelected = useMemo(() => tokenFiles.length, [tokenFiles])
    const totalSize = useMemo(() => tokenFiles.reduce((s, it) => s + (it.size || 0), 0), [tokenFiles])
    const anyCompressing = useMemo(() => tokenFiles.some((x) => x.status === 'compressing'), [tokenFiles])

    return (
        <div className="d-flex flex-wrap align-items-center gap-2">
            Selected: <span className="fw-semibold">{totalSelected}</span> files · Total size: {prettyBytes(totalSize)}
            <div className="ms-auto d-flex gap-2">
                {!disabled && clearAll && (
                    <button type="button" onClick={clearAll} disabled={!tokenFiles.length || anyCompressing} className="btn btn-outline-secondary">
                        Clear all
                    </button>
                )}
            </div>
        </div>
    )
}

export const ImagePreview = ({file, width, height}) => {
    const f = file.file || file
    const _isV = isVideo(f)
    const _isI = isImage(f)
    const _isA = isAudio(f)
    const _isP = isPdf(f)
    // const boxW = 160 // _isV ? 160 : 96
    // const boxH = 90 // _isV ? 90 : 96

    return (
        <div
            className="bg-light rounded d-flex align-items-center justify-content-center"
            style={{ width: width, height: height, overflow: "hidden", minWidth: width }}
        >
            {_isI && file.previewUrl && (
                <img src={file.previewUrl} alt={file.name} className="img-fluid" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            {_isV && file.previewUrl && (
                <video key={file.previewUrl} controls preload="metadata" style={{ width: "100%", height: "100%" }}>
                    <source src={file.previewUrl} type={file.type || undefined} />
                </video>
            )}
            {_isA && file.previewUrl && <audio src={file.previewUrl} controls className="w-100" />}
            {_isP && file.previewUrl && <embed src={file.previewUrl} type="application/pdf" style={{ width: "100%", height: "100%" }} />}
            {!file.previewUrl && (
                <span className="small text-muted text-center p-1">
                    {file.diskPath ? "💾" : ""} {file.type || (getExt(file.name) ? `.${getExt(file.name)}` : "file")}
                </span>
            )}
        </div>
    )
}

export const ImageInfo = ({file}) => (
    <div className="flex-grow-1 min-w-0">
        <div className="d-flex align-items-center gap-2">
            <div className="text-truncate fw-semibold" title={file.name}>{file.name}</div>
        </div>
        <div className="small text-muted">
            {prettyBytes(file.size)} · {file.type || 'unknown'}
            {file.diskPath && (
                <div>📁 {file.diskPath}</div>
            )}
        </div>

        {!file.previewUrl && file.type?.startsWith?.('text/') && (
            <div className="mt-2 p-2 bg-light border rounded small" style={{ maxHeight: 96, overflow: 'auto' }}>
                <pre className="m-0">{file.file ? file.file.name : 'Preview not available'}</pre>
            </div>
        )}

        <div className="mt-2">
            {file.status === "compressing" && (
                <>
                    <div className="progress" role="progressbar" aria-label="compression progress">
                        <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${file.progress || 0}%` }} />
                    </div>
                    <div className="small text-muted mt-1">Compressing… {file.progress || 0}%</div>
                </>
            )}
            {file.status === 'done' && (
                <div className="small text-success">
                    {file.isOnDisk ? 'Extracted to disk' : 'Compressed'}
                </div>
            )}
            {file.status === 'error' && (
                <div className="small text-danger">Error: {file.error}</div>
            )}
        </div>
    </div>
)

export const FilesList = ({tokenFiles, removeOne, clearAll, disabled}) => {
    if (!tokenFiles.length) return (
        <li className="list-group-item text-center small text-muted">No files selected yet.</li>
    )

    return (
        <>
            <SummaryActions {...{tokenFiles, clearAll, disabled}} />
            <ul className="list-group list-group-flush border rounded overflow-hidden">
                {tokenFiles.map((it) => (
                    <li
                        key={it.id}
                        className="list-group-item d-flex align-items-start gap-3"
                        style={{background: it.main ? 'aliceblue' : ''}}
                    >
                        <ImagePreview file={it} width={160} height={90} />
                        <ImageInfo file={it} />
                        <div className="d-flex align-items-center gap-2">
                            {!disabled && removeOne && (
                                <button
                                    type="button"
                                    onClick={() => removeOne(it.id)}
                                    disabled={it.status === "compressing"}
                                    className="btn btn-outline-secondary btn-sm"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </>
    )
}

export const CompressingActions = ({
    tokenFiles,
    createContainer,
    container,
    cancelCompression,
}) => !!tokenFiles.length && (
    <div className="d-flex gap-2 align-items-center">
        {!container && (
            <button className="btn btn-info" onClick={createContainer}>
                Create container
            </button>
        )}
        {container && container.isCompressing && (
            <span>
                Creating container...
                <button className="btn btn-outline-danger ms-3" onClick={cancelCompression}>Cancel</button>
            </span>
        )}
    </div>
)

export const CompressingStatus = ({container, overallCompressing}) => container?.isCompressing && (
    <StatusBar label={'Adding files to container'} processStatus={overallCompressing} />
)

export const DecompressingStatus = ({container, overallDecompressing}) => {
    if (!container?.isDecompressing) return null

    const label = container?.usedMemory
        ? 'Extracting files to memory...'
        : 'Extracting files to disk...'

    return <StatusBar label={label} processStatus={overallDecompressing} />
}

export const HashingStatus = ({container, overallHashing}) => (container?.isCompressing || container?.isHashing) && (
    <StatusBar label={'Calculating container hash'} processStatus={overallHashing} className={'bg-success'} />
)

export const ContainerFileInfo = ({container, setErrorContainer}) => {
    const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    const ERROR_REASONS = "It's possible that some files cannot be added to the container."
    const isSizeInvalid = setErrorContainer && container?.file && !container.file.size
    const isHashInvalid = setErrorContainer && container?.hash === EMPTY_HASH

    useEffect(() => {
        if (!setErrorContainer || !container?.hash) {
            return
        }
        if (!container.file.size) {
            setErrorContainer('Error creating file container - file size 0 bytes. ' + ERROR_REASONS)
            return
        }
        if (container.hash === EMPTY_HASH) {
            setErrorContainer('The file container hash was calculated incorrectly. ' + ERROR_REASONS)
        }
    }, [container?.file?.size, container?.hash, setErrorContainer])

    return !!container?.hash && (
        <div className="mb-4">
            <div className="alert-success bg-light alert border">
                <h3 className="text-center">Files Container</h3>
                <InnerTable data={[
                    ['File name', container.file?.name],
                    ['File size', [prettyBytes(container.file.size), isSizeInvalid ? 'text-danger' : '']],
                    ['File hash', [container.hash, isHashInvalid ? 'text-danger' : '']],
                ]} />
            </div>
        </div>
    )
}
