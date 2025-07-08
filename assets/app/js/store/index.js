import { legacy_createStore as createStore } from 'redux'

const initialState = {
    currentLocale: window.AppConfig?.currentLocale,
    translationsFolder: window.AppConfig?.translationsFolder,
    helpTranslationsFolder: window.AppConfig?.helpTranslationsFolder,
    translations: {},
    helpLinks: {},
    terms: {},
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_HELP_LINKS':
            return {...state, helpLinks: action.payload}
        case 'SET_TRANSLATIONS':
            return {...state, translations: action.payload}
        default:
            return state
    }
}

const store = createStore(reducer)

export default store
