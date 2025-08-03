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
import CreateMaterial from '@react/components/create-material/CreateMaterial'
import CheckToken from '@react/components/check-token/CheckToken'

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

console.log('Start sevenstime APP')
