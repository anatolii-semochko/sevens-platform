import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@css/template.scss'
import '@css/custom.scss'
import '@js/help-link'
import React from 'react'
import { Provider } from 'react-redux';
import store from '@store/index';
import { createRoot } from 'react-dom/client';
import CreateMaterial from '@components/create-material/CreateMaterial'
import CheckToken from '@components/check-token/CheckToken'
import UserAuth from '@components/user-auth/UserAuth'

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

const userAuth = document.getElementById('user-auth');
if (userAuth) {
    const userDataElement = userAuth.querySelector('[data-user]');
    const registerUrlElement = userAuth.querySelector('[data-register-url]');
    const userData = userDataElement ? JSON.parse(userDataElement.dataset.user) : null;
    const registerUrl = registerUrlElement ? registerUrlElement.dataset.registerUrl : '/register';
    
    const root = createRoot(userAuth);
    root.render(<Provider store={store}><UserAuth user={userData} registerUrl={registerUrl} /></Provider>);
}

console.log('Start sevenstime APP')
