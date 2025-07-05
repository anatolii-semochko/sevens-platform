import store from '@store/index'

export const fetchHelps = async () => {
    const url = `${store.getState().helpTranslationsFolder}/help.${store.getState().currentLocale}.json`
    return fetch(url)
        .then(response => response.ok ? response.json() : {})
        .catch(() => {})
}
