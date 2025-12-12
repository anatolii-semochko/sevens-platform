import React, { useCallback, useMemo, useRef, useState } from 'react'
import streamSaver from 'streamsaver'
import { downloadZip } from 'client-zip'
import { createSHA256 } from 'hash-wasm'
import { clearTargetRef, getContainerName } from '../../utils/files'
import { CompressingActions, CompressingStatus, HashingStatus } from './Components'

// --- налаштування тротлінгу UI ---
const UI_THROTTLE_MS = 150;

export const CompressContainer = ({tokenFiles, setTokenFiles, container, setContainer, setErrorContainer, targetRef}) => {
    const [overallCompressing, setOverallCompressing] = useState(0)
    const [overallHashing, setOverallHashing] = useState(0)

    const cancelFlagRef = useRef(false)
    const zipReaderRef = useRef(null)         // ReadableStreamDefaultReader для ZIP stream
    const hasherRef = useRef(null)            // hash-wasm SHA256 hasher instance для streaming hashing
    const isProcessingRef = useRef(false)  // Запобігає повторним викликам createContainer

    // тротлінг UI
    const lastUiGlobalRef = useRef(0)
    const lastUiHashRef = useRef(0)

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

        try { await zipReaderRef.current?.cancel() } catch (_) {}
        zipReaderRef.current = null

        try { await targetRef.current?.abort() } catch (_) {}

        // Очищаємо hasher
        hasherRef.current = null

        // Розблокуємо processing flag при скасуванні
        isProcessingRef.current = false

        setTokenFiles((prev) => prev.map((x) => {
            if (x.status === 'compressing') return { ...x, status: 'error', error: 'Canceled by user' }
            return x
        }))

        setOverallHashing(0)
        setContainer(null)
    }, [container?.isCompressing])

    const createContainer = useCallback(async () => {
        // Перевірка на повторний виклик
        if (isProcessingRef.current) return

        if (!tokenFiles.length || container?.isCompressing) return

        // Блокуємо повторні виклики
        isProcessingRef.current = true

        setContainer(null)
        setOverallCompressing(0)
        setOverallHashing(0)
        cancelFlagRef.current = false
        zipReaderRef.current = null

        // Ініціалізуємо SHA256 hasher для streaming hashing (hash-wasm)
        hasherRef.current = await createSHA256()

        // Force clear targetRef to prevent hanging on deleted files
        clearTargetRef(targetRef)

        // скидання тротлінгу
        lastUiGlobalRef.current = 0
        lastUiHashRef.current = 0

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
                    size: 0,
                },
                targetRef: targetRef,
            }

            setContainer(containerObj)

            // позначаємо всі як compressing
            setTokenFiles((prev) => prev.map((x) => ({ ...x, status: 'compressing', progress: 0, error: null })))

            // Підготовка файлів для client-zip
            const files = tokenFiles.map(it => ({
                name: (it.relativePath && it.relativePath.trim()) ? it.relativePath : it.name,
                lastModified: it.lastModified ? new Date(it.lastModified) : new Date(),
                input: it.file, // File object
            }))

            // Створення ZIP stream через client-zip (без компресії, швидко)
            const zipResponse = downloadZip(files, {
                buffersAreUTF8: true // підтримка UTF-8 для кирилиці
            })

            // Отримуємо reader для ZIP stream
            const reader = zipResponse.body.getReader()
            zipReaderRef.current = reader

            let processedBytes = 0
            let totalHashBytes = 0

            const updateGlobalProgress = (pct) => {
                const now = performance.now()
                if (pct === 100 || now - lastUiGlobalRef.current >= UI_THROTTLE_MS) {
                    setOverallCompressing(pct)
                    lastUiGlobalRef.current = now
                }
            }

            // Читаємо ZIP stream, пишемо в файл та хешуємо одночасно
            while (true) {
                if (cancelFlagRef.current) break

                const { value, done } = await reader.read()
                if (done) break

                // Записуємо chunk в файл
                await target.write(value)

                processedBytes += value.byteLength
                totalHashBytes += value.byteLength

                // Оновлюємо hasher (streaming hashing без завантаження в пам'ять)
                if (hasherRef.current) {
                    hasherRef.current.update(value)

                    // Оновлюємо UI прогрес хешування (тротл)
                    const now = performance.now()
                    if (totalBytes > 0 && (now - lastUiHashRef.current >= UI_THROTTLE_MS)) {
                        const hashProgress = Math.min(95, Math.floor((totalHashBytes / totalBytes) * 95))
                        setOverallHashing(hashProgress)
                        lastUiHashRef.current = now
                    }
                }

                // Оновлюємо загальний прогрес компресії
                if (totalBytes > 0) {
                    const pctAll = Math.max(0, Math.min(100, Math.floor((processedBytes / totalBytes) * 100)))
                    updateGlobalProgress(pctAll)
                }

                // Передаємо керування UI
                await new Promise(r => setTimeout(r, 0))
            }

            try { reader.releaseLock() } catch (_) {}
            zipReaderRef.current = null

            if (!cancelFlagRef.current) {
                // Закриваємо файл
                await target.close()

                updateGlobalProgress(100)

                // Позначаємо всі файли як done
                setTokenFiles((prev) => prev.map((x) =>
                    x.status === 'compressing' ? { ...x, status: 'done', progress: 100 } : x
                ))

                // Фінальний хеш - отримуємо результат з hasher (хешування відбувалось під час компресії)
                try {
                    setContainer(prev => prev ? { ...prev, isHashing: true } : null)

                    let hash = null
                    let fileSize = totalHashBytes

                    if (hasherRef.current) {
                        setOverallHashing(96)

                        // Фіналізуємо хеш (hasher вже отримав всі дані через update() в Zip callback)
                        // hash-wasm повертає hex строку напряму
                        hash = hasherRef.current.digest('hex')

                        setOverallHashing(98)

                        // Очищаємо hasher
                        hasherRef.current = null
                    }

                    // Отримуємо розмір файлу якщо можливо
                    if (targetRef.current?.kind === 'savePicker' && targetRef.current?.handle) {
                        try {
                            await new Promise(resolve => setTimeout(resolve, 200))
                            const file = await targetRef.current.handle.getFile()
                            if (file && file.size > 0) {
                                fileSize = file.size
                            }
                        } catch (_) {
                            // Не критично, використаємо totalHashBytes
                        }
                    }

                    setOverallHashing(100)

                    setContainer(prev => prev ? {
                        ...prev,
                        hash,
                        isHashing: false,
                        file: {
                            ...prev?.file,
                            size: fileSize
                        }
                    } : null)

                } catch (hashError) {
                    console.error('Hash calculation error:', hashError)
                    setContainer(prev => prev ? { ...prev, isHashing: false } : null)
                    setErrorContainer(`Could not calculate container hash: ${hashError}`)
                    hasherRef.current = null
                }
            }
        } catch (e) {
            console.error(e)
            const msg = e?.message || String(e)
            setTokenFiles((prev) => prev.map((x) =>
                (x.status === 'compressing' || x.status === 'queued') ? { ...x, status: 'error', error: msg } : x
            ))
            // Очищаємо hasher у випадку помилки
            hasherRef.current = null
            alert(msg)
        } finally {
            if (!cancelFlagRef.current) {
                setContainer(prev => prev ? { ...prev, isCompressing: false } : null)
            }
            // Розблокуємо можливість повторного виклику
            isProcessingRef.current = false
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
