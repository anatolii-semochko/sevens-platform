import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@css/main.scss'
import '@js/help-link'
import React from 'react'
import { Provider } from 'react-redux';
import store from '@store/index';
import { createRoot } from 'react-dom/client';
import CreateMaterial from '@components/create-material/CreateMaterial'
import CheckToken from '@components/check-token/CheckToken'

const initialState = {
    current_locale: window.AppConfig?.currentLocale,
}

const createMaterial = document.getElementById('create-material');
if (createMaterial) {
    const root = createRoot(createMaterial);
    root.render(<Provider store={store}><CreateMaterial /></Provider>);
}

const checkToken = document.getElementById('check-token');
if (checkToken) {
    const root = createRoot(checkToken);
    root.render(<Provider store={store}><CheckToken /></Provider>);
}

console.log('Start sevenstime APP')
