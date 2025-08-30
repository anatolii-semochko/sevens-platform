import * as bootstrap from 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@css/template.scss'
import '@css/custom.scss'
import '@css/material.scss'
import '@css/gallery.scss'
import '@css/404.scss'
import '@js/help-link'
import '@js/material-slider'
import React from 'react'
import store from '@react/store/index'
import { Buffer } from 'buffer'
import { Provider } from 'react-redux'
import { createRoot } from 'react-dom/client'
import { openWallet, closeWallet } from '@js/wallet'
import CreateMaterial from '@react/components/create-material/CreateMaterial'
import CheckToken from '@react/components/check-token/CheckToken'
import UserAuth from '@react/components/user-auth/UserAuth'
import MaterialVotes from '@react/components/material-votes/MaterialVotes'
import MaterialComments from '@react/components/material-comments/MaterialComments'

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

const materialVotes = document.getElementById('material-votes')
if (materialVotes) {
    const materialToken = materialVotes.dataset.materialToken || ''
    const initialLikes = materialVotes.dataset.initialLikes || '0'
    const initialDislikes = materialVotes.dataset.initialDislikes || '0'
    const viewCount = materialVotes.dataset.viewCount || '0'
    
    if (materialToken) {
        const root = createRoot(materialVotes)
        root.render(
            <MaterialVotes 
                materialToken={materialToken}
                initialLikes={parseInt(initialLikes)}
                initialDislikes={parseInt(initialDislikes)}
                viewCount={parseInt(viewCount)}
            />
        )
    } else {
        console.error('Material token is missing from data attributes')
    }
}

const materialComments = document.getElementById('material-comments')
if (materialComments) {
    const materialToken = materialComments.dataset.materialToken
    const isLoggedIn = materialComments.dataset.isLoggedIn === 'true'
    
    if (materialToken) {
        const root = createRoot(materialComments)
        root.render(<MaterialComments materialToken={materialToken} isLoggedIn={isLoggedIn} />)
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('openWalletBtn')?.addEventListener('click', () => openWallet())
    document.getElementById('closeWalletBtn')?.addEventListener('click',() => closeWallet())
})

console.log('Start sevenstime APP')
