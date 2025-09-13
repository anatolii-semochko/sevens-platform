import React, { useMemo, useRef, useState } from 'react'
import { getExt, isImage, isVideo, isAudio, isPdf, prettyBytes, classNames, getTokenContainerName, renameContainerFile } from './utils'
import { StatusBar } from '@react/components/form-elements/Charts'
import clsx from 'clsx'

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

export const SelectContainerFile = ({container, onSelectContainer}) => {
    if (container?.files) return null

    const fileInputRef = useRef(null)

    const onPickContainer = (e) => {
        const files = e.target.files
        if (files.length > 0) {
            const file = files[0]
            if (file.name.toLowerCase().endsWith('.zip')) {
                onSelectContainer(file)
            } else {
                alert('Please select a ZIP container file')
            }
        }
    }

    return (
        <div className="d-flex flex-wrap align-items-center gap-2">
            Select container file:
            <div className="ms-auto d-flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-outline-primary">
                    Select ZIP Container
                </button>
                <input ref={fileInputRef} type="file" accept=".zip" className="d-none" onChange={onPickContainer} />
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

export const SummaryActions = ({tokenFiles, clearAll, disabled}) => {
    const totalSelected = useMemo(() => tokenFiles.length, [tokenFiles])
    const totalSize = useMemo(() => tokenFiles.reduce((s, it) => s + (it.size || 0), 0), [tokenFiles])
    const anyCompressing = useMemo(() => tokenFiles.some((x) => x.status === 'compressing'), [tokenFiles])

    return (
        <div className="d-flex flex-wrap align-items-center gap-2">
            Selected: <span className="fw-semibold">{totalSelected}</span> files · Total size: {prettyBytes(totalSize)}
            <div className="ms-auto d-flex gap-2">
                {!disabled && (
                    <button type="button" onClick={clearAll} disabled={!tokenFiles.length || anyCompressing} className="btn btn-outline-secondary">
                        Clear all
                    </button>
                )}
            </div>
        </div>
    )
}

export const ImagePreview = ({it, width, height}) => {
    const f = it.file || it
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

export const FilesList = ({tokenFiles, removeOne, clearAll, disabled}) => {
    if (!tokenFiles.length) return (
        <li className="list-group-item text-center small text-muted">No files selected yet.</li>
    )

    return (
        <>
            <SummaryActions tokenFiles={tokenFiles} clearAll={clearAll} disabled={disabled}/>
            <ul className="list-group list-group-flush border rounded overflow-hidden">
                {tokenFiles.map((it) => (
                    <li
                        key={it.id}
                        className="list-group-item d-flex align-items-start gap-3"
                        style={{background: it.main ? 'aliceblue' : ''}}
                    >
                        <ImagePreview it={it} width={160} height={90} />
                        <ImageInfo it={it} />
                        <div className="d-flex align-items-center gap-2">
                            {!disabled && (
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
        {container && !container.isCompressing && (
            <div className="text-muted small">
                <div className="mb-2">Saved as <span className="fw-semibold">{container.name}</span></div>
                {container.hash && (
                    <div>Container hash: <span className="fw-semibold">{container.hash}</span></div>
                )}
            </div>
        )}
    </div>
)

export const CompressingStatus = ({container, overallCompressing}) => container?.isCompressing && (
    <StatusBar label={'Adding files to container'} processStatus={overallCompressing} />
)

export const DecompressingStatus = ({container, overallDecompressing}) => container?.isCompressing && (
    <StatusBar label={'Retrieving files from container'} processStatus={overallDecompressing} />
)

export const RenamingStatus = ({overallRenaming}) => (
    <div className="mt-3">
        <StatusBar label={'Renaming files container'} processStatus={overallRenaming} className={'bg-success'} />
    </div>
)

export const HashingStatus = ({container, overallHashing}) => (container?.isCompressing || container?.isHashing) && (
    <StatusBar label={'Calculating container hash'} processStatus={overallHashing} className={'bg-success'} />
)

export const SelectedPublicKey = ({wallet}) => (
    <div className="text-muted small mb-3">
        {wallet.publicKey ? (
            <span>Selected wallet for token minting: <span className="fw-semibold">{wallet.publicKey?.toString()}</span></span>
        ) : (
            <span className="text-primary fw-semibold">To create and store a token, select and activate your wallet. A positive wallet balance is required to pay the transaction fee.</span>
        )}
    </div>
)

export const MintedInfo = ({minted}) => minted && (
    <div className="alert-success alert text-break p-4" role="alert">
        <h4 className="text-center">Congratulations !</h4>
        <p className="text-center">Your token has been successfully minted.</p>
        <div className="d-flex justify-content-center">
            <table className=" table-sm w-auto text-start">
                <tbody>
                <tr>
                    <td><strong>Token public key:</strong></td>
                    <td className="ps-3">{minted.mint}</td>
                </tr>
                <tr>
                    <td><strong>Transaction signature:</strong></td>
                    <td className="ps-3">{minted.signature}</td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
)

const RenameButton = ({container, minted, setContainer}) => {
    const handleRename = async () => {
        try {
            const newName = getTokenContainerName(minted.mint)

            // Call showSaveFilePicker directly in user gesture context
            const savePickerOptions = {
                suggestedName: newName,
                types: [{ description: 'ZIP archive', accept: { 'application/zip': ['.zip'] } }],
            }

            savePickerOptions.startIn = 'downloads'

            const newHandle = await window.showSaveFilePicker(savePickerOptions)

            // Now call the utils function with the handle
            await renameContainerFile(null, minted.mint, container, setContainer, newHandle)

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error in rename button:', error)
            }
        }
    }

    return (
        <button
            className="btn btn-primary w-100 mt-3"
            onClick={handleRename}
        >
            Перейменувати токент контейнер на Token_Container_{minted.mint}.zip
        </button>
    )
}

export const RenameContainerFile = ({container, minted, setContainer}) => !!minted && (
    <div className="alert-info alert text-break p-4" role="alert">
        <h5 className="text-center">
            Save and keep the container file in a safe place! It is an integral part of the token !
        </h5>
        <div className="text-center w-100 pb-2">
            Container file: <span className="text-primary fw-bold">{container.fileName}</span>
        </div>
        <p className="text-justify ti-4 mb-0">
            If you lose the container, the token loses its value!
            Also we recommend to rename the token container (to add a public key of the token to the name of the file)
            for future comfortability, to understand which token it belongs to, or to leave the current name.
        </p>
        {container.canBeRenamed && !container.isRenamed && !container.isRenaming && (
            <RenameButton container={container} minted={minted} setContainer={setContainer} />
        )}
        {container.isRenaming && (
            <RenamingStatus overallRenaming={container.overallRenaming} />
        )}
    </div>
)

export const TryMoreOptions = ({minted, doMaterial, handlerClear}) => minted && !doMaterial && (
    <div className="d-flex flex-column align-items-center gap-2 text-center mb-3">
        <h6>You can try:</h6>
        <div className="d-flex flex-wrap justify-content-center gap-2">
            <button className="btn btn-primary">Check your token container</button>
            <button className="btn btn-primary" onClick={handlerClear}>Mint a new token</button>
            <button className="btn btn-primary">Publish material on site</button>
        </div>
    </div>
)
