import { legacy_createStore as createStore } from 'redux'

const initialState = {
    currentLocale: window.AppConfig?.currentLocale,
    isMobile: window.AppConfig?.isMobile,
    path: window.AppConfig?.path,
    user: window.AppConfig?.user,
    translations: {},
    helpLinks: {},
    terms: {},
    sevensUsdRate: 5,
}

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_HELP_LINKS':
            return {...state, helpLinks: action.payload}
        case 'SET_TRANSLATIONS':
            return {...state, translations: action.payload}
        case 'SET': {
            const { type, ...updates } = action
            return {...state, ...updates}
        }
        default:
            return state
    }
}

const store = createStore(reducer)

export default store
