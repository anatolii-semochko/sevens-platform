const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

export const getExt = (name = '') => name.split('.').pop()?.toLowerCase() || ''
export const isImage = (f) => f?.type?.startsWith('image/') || ['png','jpg','jpeg','gif','bmp','webp','avif'].includes(getExt(f?.name))
export const isVideo = (f) => f?.type?.startsWith('video/') || ['mp4','webm','mov','m4v','mkv','avi'].includes(getExt(f?.name))
export const isAudio = (f) => f?.type?.startsWith('audio/') || ['mp3','wav','ogg','m4a','aac','flac'].includes(getExt(f?.name))
export const isPdf   = (f) => f?.type === 'application/pdf' || getExt(f?.name) === 'pdf'

export const createItem = (file) => ({
    id: genId(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    relativePath: file.webkitRelativePath || file.relativePath || file.path || '',
    previewUrl: (isImage(file) || isVideo(file) || isAudio(file) || isPdf(file)) ? URL.createObjectURL(file) : null,
    status: 'queued',
    progress: 0,
    error: null,
})

export const prettyBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

export const classNames = (...xs) => xs.filter(Boolean).join(' ')

export const getContainerName = () => {
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = now.toISOString().slice(11, 16).replace(':', '-')
    return `Token_Container_${date}_${time}.zip`
}

export const getContainerHash = async (target) => {
    if (!target || !target.handle) {
        throw new Error('Cannot calculate hash: no file handle available')
    }

    try {
        const file = await target.handle.getFile()
        const reader = file.stream().getReader()
        const hashContext = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(''),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        ).catch(() => crypto.subtle.digest.bind(crypto.subtle, 'SHA-256'))

        let hasher
        if (typeof hashContext === 'function') {
            const chunks = []
            try {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    chunks.push(new Uint8Array(value))
                }

                const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
                const allBytes = new Uint8Array(totalLength)
                let offset = 0
                for (const chunk of chunks) {
                    allBytes.set(chunk, offset)
                    offset += chunk.length
                }

                const hashBuffer = await hashContext(allBytes)
                return Array.from(new Uint8Array(hashBuffer))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('')
            } finally {
                try { reader.releaseLock() } catch (_) {}
            }
        }

        hasher = await crypto.subtle.digest('SHA-256', new Uint8Array(0))
        const chunks = []
        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                chunks.push(new Uint8Array(value))
            }
        } finally {
            try { reader.releaseLock() } catch (_) {}
        }

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
        const allBytes = new Uint8Array(totalLength)
        let offset = 0
        for (const chunk of chunks) {
            allBytes.set(chunk, offset)
            offset += chunk.length
        }

        const hashBuffer = await crypto.subtle.digest('SHA-256', allBytes)
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')

    } catch (error) {
        console.error('Error calculating container hash:', error)
        throw error
    }
}

export const removeContainer = async (container, targetRef, setTokenFiles, setContainer) => {
    if (!container) return

    try {
        if (targetRef.current?.kind === 'savePicker' && targetRef.current?.handle) {
            try {
                await targetRef.current.handle.remove()
            } catch (removeError) {
                console.warn('Could not remove container file:', removeError.message)
            }
        } else if (targetRef.current?.kind === 'downloads') {
            console.log('Downloads folder file cannot be automatically removed')
        }

        setTokenFiles(prev => prev.map(item => ({
            ...item,
            status: 'queued',
            progress: 0,
            error: null,
        })))

        setContainer(null)
        targetRef.current = null

    } catch (error) {
        console.error('Error removing container:', error)
        throw error
    }
}

export const checkSwAvailability = (setSsReady, setSsError) => {
    let cancelled = false

    const setupStreamSaver = async () => {
        setSsError(null)
        if (!('serviceWorker' in navigator)) {
            setSsReady(false)
            return
        }
        try {
            const streamSaver = (await import('streamsaver')).default
            streamSaver.WritableStream = streamSaver.WritableStream || window.WritableStream
            if (navigator.serviceWorker.controller) {
                if (!cancelled) setSsReady(true)
                return
            }
            await navigator.serviceWorker.register('/streamsaver-sw.js', { scope: '/' })
            await new Promise((resolve, reject) => {
                const t = setTimeout(() => reject(new Error('Service Worker did not take control in time')), 5000)
                function onCtrl() {
                    clearTimeout(t)
                    navigator.serviceWorker.removeEventListener('controllerchange', onCtrl)
                    resolve()
                }
                navigator.serviceWorker.addEventListener('controllerchange', onCtrl)
                if (navigator.serviceWorker.controller) onCtrl()
            })
            if (!cancelled) setSsReady(true)
        } catch (e) {
            if (!cancelled) {
                setSsReady(false)
                setSsError(e?.message || String(e))
            }
        }
    }

    setupStreamSaver().catch()
    return () => { cancelled = true }
}
