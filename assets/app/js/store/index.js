import { legacy_createStore as createStore } from 'redux'

const initialState = {
    currentLocale: window.AppConfig?.currentLocale || 'en',
    helpLinks: {},
    terms: {},
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_LOCALE':
            return {
                ...state,
                currentLocale: action.payload,
            }
        case 'SET_HELP_LINK':
            return {
                ...state,
                helpLinks: {
                    ...state.helpLinks,
                    [action.payload.name]: action.payload.data,
                }
            }
        default:
            return state
    }
}

const store = createStore(reducer)

export default store
