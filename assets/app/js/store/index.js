import { legacy_createStore as createStore } from 'redux';

const initialState = {
    current_locale: window.AppConfig?.currentLocale || 'en',
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_LOCALE':
            return {
                ...state,
                current_locale: action.payload,
            };
        default:
            return state;
    }
};

const store = createStore(reducer);

export default store;
