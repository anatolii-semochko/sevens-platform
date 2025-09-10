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

export const getContainerHash = async (target, setOverallHashing) => {
    if (!target || !target.handle) {
        throw new Error('Cannot calculate hash: no file handle available')
    }

    try {
        setOverallHashing(0)
        const file = await target.handle.getFile()
        console.log('File size for hashing:', file.size, 'bytes')

        if (file.size === 0) {
            console.warn('File is empty, cannot calculate meaningful hash')
            throw new Error('File is empty')
        }

        const reader = file.stream().getReader()
        const totalSize = file.size
        let processedBytes = 0

        const chunks = []

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = new Uint8Array(value)
                chunks.push(chunk)
                processedBytes += chunk.byteLength

                const progress = Math.min(95, Math.floor((processedBytes / totalSize) * 100))
                setOverallHashing(progress)

                if (processedBytes > 1024 * 1024) {
                    await new Promise(resolve => setTimeout(resolve, 10))
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1))
                }
            }
        } finally {
            try { reader.releaseLock() } catch (_) {}
        }

        console.log('Total bytes read:', processedBytes, 'chunks:', chunks.length)

        if (processedBytes === 0) {
            new Error('No data was read from file')
        }

        setOverallHashing(98)

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
        const allBytes = new Uint8Array(totalLength)
        let offset = 0
        for (const chunk of chunks) {
            allBytes.set(chunk, offset)
            offset += chunk.length
        }

        console.log('Combined array length:', allBytes.length)
        const hashBuffer = await crypto.subtle.digest('SHA-256', allBytes)
        setOverallHashing(100)

        const hash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')

        console.log('Calculated hash:', hash)
        return hash

    } catch (error) {
        console.error('Error calculating container hash:', error)
        setOverallHashing(0)
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
























// TODO - Is for testing !!! Move out from here !!!
// =================================================== Sign Message ====================================================
/*
    зберігайти message, address, signatureBase64, date, nonce на бекенді — вони знадобляться для верифікації
    Виклик: signWithPhantom().then(console.log).catch(console.error)
    Не змінюйте ані символ у підписуваному рядку між формуванням і підписом.
    Додавайте Nonce і поточну Дата до кожного нового підпису — це захист від повторного використання підписів (replay).
    За бажання можна додати рядок Origin: your-domain.tld, щоб зв’язати підпис із вашим сайтом/доменом.
    Формат зручний для показу юзеру та простий для верифікації на сервері (ed25519 для Solana; personal_sign/EIP-191 для Ethereum).
*/
//  helpers
function nowUtc() {
    // "YYYY-MM-DD HH:MM:SS UTC"
    const iso = new Date().toISOString();                  // 2025-09-05T12:34:56.789Z
    const trimmed = iso.replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
    return trimmed;
}

function genNonce(bytes = 8) { // 8 байт => 16 hex-символів
    const a = new Uint8Array(bytes);
    crypto.getRandomValues(a);
    return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}

function buildMessage(address, date, nonce) {
    return `Підтвердження власності гаманця

Адреса: ${address}
Дата: ${date}
Nonce: ${nonce}

Я підтверджую, що цей гаманець належить мені.`;
}

async function signWithPhantom() {
    if (!window.solana) {
        throw new Error('Solana гаманець не знайдено. Встановіть Phantom або інший Solana-віджет.');
    }

    // 1) Підключення гаманця
    const resp = await window.solana.connect(); // за потреби покаже модальне вікно
    const address = resp.publicKey.toBase58();

    // 2) Формуємо повідомлення
    const date = nowUtc();
    const nonce = genNonce(8); // 16-символьний hex
    const message = buildMessage(address, date, nonce);

    // 3) Підпис
    const encoded = new TextEncoder().encode(message);
    const { signature, publicKey } = await window.solana.signMessage(encoded); // Uint8Array

    // 4) Зручно кодуємо підпис (base64)
    const signatureBase64 = btoa(String.fromCharCode(...signature));

    console.log('Message:\n', message);
    console.log('Address:', publicKey.toBase58());
    console.log('Signature (base64):', signatureBase64);

    // Повертаємо для подальшої відправки на сервер/верифікації
    return { message, address: publicKey.toBase58(), signatureBase64, date, nonce };
}

// --------- END Sign Message-------------------------------------------------------------------------------------------
