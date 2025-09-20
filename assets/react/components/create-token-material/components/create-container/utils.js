





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
