import store from '@react/store/index'

export const fetchHelps = async () => {
    const url = `${store.getState().path.helpTranslations}/help.${store.getState().currentLocale}.json`
    return fetch(url)
        .then(response => response.ok ? response.json() : {})
        .catch(() => {})
}
