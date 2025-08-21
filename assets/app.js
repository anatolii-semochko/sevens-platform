import * as bootstrap from 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@css/template.scss'
import '@css/custom.scss'
import '@js/help-link'
import React from 'react'
import store from '@react/store/index'
import { Buffer } from 'buffer'
import { Provider } from 'react-redux'
import { createRoot } from 'react-dom/client'
import { openWallet, closeWallet } from '@js/wallet'
import CreateMaterial from '@react/components/create-material/CreateMaterial'
import CheckToken from '@react/components/check-token/CheckToken'
import UserAuth from '@react/components/user-auth/UserAuth'

window.bootstrap = bootstrap
window.Buffer = Buffer

const createMaterial = document.getElementById('create-material')
if (createMaterial) {
    const root = createRoot(createMaterial)
    root.render(<Provider store={store}><CreateMaterial /></Provider>)
}

const checkToken = document.getElementById('check-token')
if (checkToken) {
    const root = createRoot(checkToken)
    root.render(<Provider store={store}><CheckToken /></Provider>)
}

const userAuth = document.getElementById('user-auth')
if (userAuth) {
    const userDataElement = userAuth.querySelector('[data-user]')
    const userData = userDataElement?.dataset?.user ? JSON.parse(userDataElement.dataset.user) : null
    const registerUrl = userAuth.querySelector('[data-register-url]')?.dataset?.registerUrl || '/register'

    const root = createRoot(userAuth)
    root.render(<Provider store={store}><UserAuth user={userData} registerUrl={registerUrl} /></Provider>)
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('openWalletBtn')?.addEventListener('click', () => openWallet())
    document.getElementById('closeWalletBtn')?.addEventListener('click',() => closeWallet())
})

console.log('Start sevenstime APP')
