export const getExt = (fileName = '') => fileName.split('.').pop()?.toLowerCase() || ''

export const getFileType = (fileName) => {
    const ext = getExt(fileName)
    const mimeTypes = {
        'txt': 'text/plain',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'pdf': 'application/pdf',
        'zip': 'application/zip',
        'json': 'application/json',
        'js': 'application/javascript',
        'css': 'text/css',
        'html': 'text/html'
    }

    return mimeTypes[ext] || 'application/octet-stream'
}

export const isImage = (f) => f?.type?.startsWith('image/') || ['png','jpg','jpeg','gif','bmp','webp','avif'].includes(getExt(f?.name))
export const isVideo = (f) => f?.type?.startsWith('video/') || ['mp4','webm','mov','m4v','mkv','avi'].includes(getExt(f?.name))
export const isAudio = (f) => f?.type?.startsWith('audio/') || ['mp3','wav','ogg','m4a','aac','flac'].includes(getExt(f?.name))
export const isPdf   = (f) => f?.type === 'application/pdf' || getExt(f?.name) === 'pdf'

export const prettyBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}
