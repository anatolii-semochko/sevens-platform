import React, { useCallback, useMemo, useRef, useState } from 'react'
import streamSaver from 'streamsaver'
import { Zip, AsyncZipDeflate, ZipPassThrough } from 'fflate'
import { clearTargetRef } from '../../utils/files'
import { getExt } from '@js/utils/file'
import { CompressingActions, CompressingStatus, HashingStatus } from './Components'
import { getContainerName, getFileHash } from '../../utils/files'

// --- налаштування backpressure та тротлінгу ---
const MAX_BUFFERED_BYTES = 64 * 1024 * 1024; // 64MB максимум незаписаних даних
const UI_THROTTLE_MS = 150;

// формати, які вже стиснені — кладемо як store (без повторної компресії)
const STORE_EXTS = new Set([
    'jpg','jpeg','png','webp','gif','avif',
    'mp4','mov','m4v','mkv','webm','avi',
    'mp3','aac','ogg','m4a','flac',
    'pdf','zip','7z','gz','bz2','xz'
]);

export const CompressContainer = ({tokenFiles, setTokenFiles, container, setContainer, setErrorContainer, targetRef}) => {
    const [overallCompressing, setOverallCompressing] = useState(0)
    const [overallHashing, setOverallHashing] = useState(0)

    const cancelFlagRef = useRef(false)
    const activeReadersRef = useRef([])       // ReadableStreamDefaultReader[]
    const zipInstanceRef = useRef(null)       // Zip

    // backpressure лічильник
    const bufferedBytesRef = useRef(0)        // скільки байтів ще не записано
    const writeChainRef = useRef(Promise.resolve())

    // тротлінг UI
    const lastUiFileRef = useRef(0)
    const lastUiGlobalRef = useRef(0)

    const totalBytes = useMemo(() => tokenFiles.reduce((s, it) => s + (it.size || 0), 0), [tokenFiles])

    // ---- Writable target: SaveFilePicker (де є) або StreamSaver (Downloads) ----
    const getWritableTarget = async (suggestedName) => {
        if (window.showSaveFilePicker && typeof window.showSaveFilePicker === 'function') {
            const handle = await window.showSaveFilePicker({
                suggestedName,
                startIn: 'downloads', // Valid WellKnownDirectory value
                types: [{ description: 'ZIP archive', accept: { 'application/zip': ['.zip'] } }],
            })
            const writable = await handle.createWritable()
            let aborted = false
            return {
                kind: 'savePicker',
                name: handle.name || suggestedName,
                handle: handle,
                write: async (chunk) => {
                    if (aborted) return
                    try {
                        await writable.write(chunk)
                    } catch (err) {
                        if (!aborted && !err.message?.includes('closing')) {
                            throw err
                        }
                    }
                },
                close: async () => {
                    if (aborted) return
                    try {
                        await writable.close()
                    } catch (err) {
                        if (!err.message?.includes('closed') && !err.message?.includes('closing') && !err.message?.includes('ERRORED')) {
                            throw err
                        }
                    }
                },
                abort: async () => {
                    if (aborted) return
                    aborted = true
                    try {
                        await writable.abort()
                        // Remove the file after aborting
                        try {
                            await handle.remove()
                        } catch (removeErr) {
                            // File might not exist or permission denied, ignore
                            console.warn('Could not remove aborted file:', removeErr)
                        }
                    } catch (err) {
                        if (!err.message?.includes('closed') && !err.message?.includes('closing')) {
                            throw err
                        }
                    }
                },
            }
        }

        const fileStream = streamSaver.createWriteStream(suggestedName)
        const writer = fileStream.getWriter()
        let closed = false
        let aborted = false
        return {
            kind: 'downloads',
            name: suggestedName,
            write: async (chunk) => {
                if (closed || aborted) return
                try {
                    const data = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk)
                    await writer.write(data)
                } catch (err) {
                    if (!closed && !aborted && !err.message?.includes('closing')) {
                        throw err
                    }
                }
            },
            close: async () => {
                if (closed || aborted) return
                closed = true
                try {
                    await writer.close()
                } catch (err) {
                    if (!err.message?.includes('closed') && !err.message?.includes('closing') && !err.message?.includes('ERRORED')) {
                        throw err
                    }
                }
            },
            abort: async () => {
                if (closed || aborted) return
                aborted = true
                try {
                    await writer.abort()
                } catch (err) {
                    if (!err.message?.includes('closed') && !err.message?.includes('closing')) {
                        throw err
                    }
                }
            },
        }
    }

    const cancelCompression = useCallback(async () => {
        if (!container?.isCompressing) return
        cancelFlagRef.current = true

        for (const r of activeReadersRef.current) { try { await r.cancel() } catch (_) {} }
        activeReadersRef.current = []

        try { zipInstanceRef.current?.end() } catch (_) {}
        try { await targetRef.current?.abort() } catch (_) {}

        setTokenFiles((prev) => prev.map((x) => {
            if (x.status === 'compressing') return { ...x, status: 'error', error: 'Canceled by user' }
            return x
        }))

        setOverallHashing(0)
        setContainer(null)
    }, [container?.isCompressing])

    const createContainer = useCallback(async () => {
        if (!tokenFiles.length || container?.isCompressing) return

        setContainer(null)
        setOverallCompressing(0)
        setOverallHashing(0)
        cancelFlagRef.current = false
        activeReadersRef.current = []
        zipInstanceRef.current = null

        // Force clear targetRef to prevent hanging on deleted files
        clearTargetRef(targetRef)

        // скидання backpressure лічильників
        bufferedBytesRef.current = 0
        writeChainRef.current = Promise.resolve()
        lastUiFileRef.current = 0
        lastUiGlobalRef.current = 0

        const zipName = getContainerName()

        try {
            const target = await getWritableTarget(zipName)
            targetRef.current = target

            const containerObj = {
                name: zipName,
                where: target.kind,
                isCompressing: true,
                isHashing: false,
                isRenaming: false,
                isRenamed: false,
                file: {
                    name: zipName,
                    size: 0
                },
                targetRef: targetRef,
            }

            setContainer(containerObj)

            // позначаємо всі як compressing
            setTokenFiles((prev) => prev.map((x) => ({ ...x, status: 'compressing', progress: 0, error: null })))

            // обгортка запису з обліком буфера
            const enqueueWrite = (chunk) => {
                if (cancelFlagRef.current) return Promise.resolve()
                const len = (chunk?.length ?? chunk?.byteLength ?? 0) | 0
                bufferedBytesRef.current += len
                writeChainRef.current = writeChainRef.current.then(async () => {
                    if (!cancelFlagRef.current) {
                        await target.write(chunk)
                    }
                    bufferedBytesRef.current -= len
                })
                return writeChainRef.current
            }

            let processedBytes = 0

            const zip = new Zip((err, chunk, final) => {
                if (err) throw err
                if (cancelFlagRef.current) return
                enqueueWrite(chunk)
                if (final && !cancelFlagRef.current) {
                    writeChainRef.current = writeChainRef.current.then(() => {
                        if (!cancelFlagRef.current) {
                            return target.close()
                        }
                    })
                }
            })
            zipInstanceRef.current = zip

            const updateFileProgress = (id, pct) => {
                const now = performance.now()
                if (pct === 100 || now - lastUiFileRef.current >= UI_THROTTLE_MS) {
                    setTokenFiles((prev) => prev.map((x) => (x.id === id ? { ...x, progress: pct } : x)))
                    lastUiFileRef.current = now
                }
            }
            const updateGlobalProgress = (pct) => {
                const now = performance.now()
                if (pct === 100 || now - lastUiGlobalRef.current >= UI_THROTTLE_MS) {
                    setOverallCompressing(pct)
                    lastUiGlobalRef.current = now
                }
            }

            for (const it of tokenFiles) {
                if (cancelFlagRef.current) break

                const entryName = (it.relativePath && it.relativePath.trim()) ? it.relativePath : it.name
                const ext = getExt(it.name)

                // вибір способу: store (без компресії) або deflate
                const useStore = STORE_EXTS.has(ext)
                const entry = useStore
                    ? new ZipPassThrough(entryName, { mtime: it.lastModified ? new Date(it.lastModified) : new Date() })
                    : new AsyncZipDeflate(entryName, { level: 6, mtime: it.lastModified ? new Date(it.lastModified) : new Date() })

                zip.add(entry)

                const reader = it.file.stream().getReader()
                activeReadersRef.current.push(reader)

                let loaded = 0
                const total = it.size || 1

                while (true) {
                    if (cancelFlagRef.current) break
                    const { value, done } = await reader.read()
                    if (done) break

                    loaded += value.byteLength
                    processedBytes += value.byteLength

                    // подаємо дані в ZIP
                    entry.push(value)

                    // file progress (тротл)
                    const pctFile = Math.max(0, Math.min(99, Math.floor((loaded / total) * 100)))
                    updateFileProgress(it.id, pctFile)

                    // global progress (тротл)
                    if (totalBytes > 0) {
                        const pctAll = Math.max(0, Math.min(100, Math.floor((processedBytes / totalBytes) * 100)))
                        updateGlobalProgress(pctAll)
                    }

                    // backpressure: якщо накопичили більше за ліміт — чекаємо, поки запишеться
                    if (bufferedBytesRef.current > MAX_BUFFERED_BYTES) {
                        await writeChainRef.current // даємо запису наздогнати
                    }

                    // передаємо керування UI
                    await new Promise(r => setTimeout(r, 0))
                }

                try { reader.releaseLock() } catch (_) {}

                if (cancelFlagRef.current) {
                    try { entry.push(new Uint8Array(0), true) } catch (_) {}
                    break
                }

                entry.push(new Uint8Array(0), true) // закрити entry
                updateFileProgress(it.id, 100)
                setTokenFiles((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: 'done' } : x)))
            }

            if (cancelFlagRef.current) {
                try { zip.end() } catch (_) {}
                await writeChainRef.current
            } else {
                zip.end()
                await writeChainRef.current
                updateGlobalProgress(100)

                if (targetRef.current?.kind === 'savePicker' && targetRef.current?.handle) {
                    try {
                        // Longer delay to ensure file is fully written to disk
                        await new Promise(resolve => setTimeout(resolve, 500))
                        setContainer(prev => prev ? { ...prev, isHashing: true } : null)
                        const fileHandle = targetRef.current
                        const file = await fileHandle.handle.getFile()
                        const hash = await getFileHash(
                            file,
                            setOverallHashing,
                        )
                        setContainer(prev => prev ? {
                            ...prev,
                            hash,
                            isHashing: false,
                            file: {
                                ...prev?.file,
                                size: file.size
                            }
                        } : null)
                    } catch (hashError) {
                        setContainer(prev => prev ? { ...prev, isHashing: false } : null)
                        setErrorContainer(`Could not calculate container hash: ${hashError}`)
                    }
                }
            }
        } catch (e) {
            console.error(e)
            const msg = e?.message || String(e)
            setTokenFiles((prev) => prev.map((x) =>
                (x.status === 'compressing' || x.status === 'queued') ? { ...x, status: 'error', error: msg } : x
            ))
            alert(msg)
        } finally {
            if (!cancelFlagRef.current) {
                setContainer(prev => prev ? { ...prev, isCompressing: false } : null)
            }
        }
    }, [tokenFiles, container?.isCompressing, totalBytes])

    return (
        <>
            <CompressingStatus {...{container, overallCompressing}} />
            <HashingStatus {...{container, overallHashing}} />
            <CompressingActions {...{tokenFiles, createContainer, container, cancelCompression}} />
        </>
    )
}
