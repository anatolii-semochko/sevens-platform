export const getDateTimeFromDate = (text) => {
    const date = new Date(text)
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0')
}

export const getDateFromDate = (text) => {
    const date = new Date(text)
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0')
}

export const nowUtc = () => {
    const iso = new Date().toISOString()
    return iso.replace('T', ' ').replace(/\.\d+Z$/, ' UTC')
}
