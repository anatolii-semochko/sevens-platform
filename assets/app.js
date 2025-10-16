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
import '@js/toast'
import React from 'react'
import ReactDOM, { createRoot } from 'react-dom/client'
import store from '@react/store/index'
import streamSaver from 'streamsaver'
import { Buffer } from 'buffer'
import { Toaster } from 'react-hot-toast'
import { RoutingWithLocale } from '@js/router/routing-with-locale'
import { Provider } from 'react-redux'
import { showModal } from '@js/modal'
import { openWallet, closeWallet } from '@js/wallet'
import { ButtonContainerDownload } from '@react/components/download-container/DownloadContainer'
import Create from '@react/components/create-token-material/Create'
import BuyToken from '@react/components/buy-token/BuyToken'
import CheckToken from '@react/components/check-token/CheckToken'
import UserAuth from '@react/components/user-auth/UserAuth'
import MaterialManage from '@react/components/material-manage/MaterialManage'
import MaterialClaim from '@react/components/material-manage/claim/MaterialClaim'
import MaterialVotes from '@react/components/material-votes/MaterialVotes'
import MaterialComments from '@react/components/material-comments/MaterialComments'

window.bootstrap = bootstrap
window.Buffer = Buffer

streamSaver.WritableStream = streamSaver.WritableStream || window.WritableStream
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/streamsaver-sw.js', { scope: '/' })
        .catch(error => console.error('SW register failed:', error))
}

const createTokenMaterial = document.getElementById('create-token-material')
if (createTokenMaterial) {
    const root = createRoot(createTokenMaterial)
    root.render(<Provider store={store}><Create type={createTokenMaterial.dataset.type} /></Provider>)
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

const materialManage = document.getElementById('material-manage')
if (materialManage) {
    createRoot(materialManage).render(<MaterialManage token={materialManage.dataset.token} />)
}

const materialClaim = document.getElementById('material-claim')
if (materialClaim) {
    createRoot(materialClaim).render(<MaterialClaim />)
}

const materialVotes = document.getElementById('material-votes')
if (materialVotes) {
    const materialToken = materialVotes.dataset.materialToken || ''
    const initialLikes = materialVotes.dataset.initialLikes || '0'
    const initialDislikes = materialVotes.dataset.initialDislikes || '0'
    const viewCount = materialVotes.dataset.viewCount || '0'
    const root = createRoot(materialVotes)
    root.render(
        <MaterialVotes
            materialToken={materialToken}
            initialLikes={parseInt(initialLikes)}
            initialDislikes={parseInt(initialDislikes)}
            viewCount={parseInt(viewCount)}
        />
    )
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
    document.getElementById('closeWalletBtn')?.addEventListener('click',() => closeWallet())
    document.getElementById('buyTokenBtn')?.addEventListener('click', () => {
        const container = document.getElementById('buyTokenForm')
        const root = ReactDOM.createRoot(container)
        root.render(<BuyToken root={root} token={container.dataset.token} isMyMaterial={container.dataset.isMyMaterial}/>)
    })
    document.querySelectorAll('.download-container-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.dataset) {
                showModal({
                    id: 'download-files-container-' + this.dataset.token,
                    title: 'Download token files container',
                    body: React.createElement(ButtonContainerDownload.DownloadContainer, { token: this.dataset.token }),
                    size: 'lg',
                })
            }
        })
    })

    // Global toast for using by TWIG
    const toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    document.body.appendChild(toastContainer)
    const toastRoot = createRoot(toastContainer)
    toastRoot.render(<Toaster position="top-right" />)
})

window.Routing = RoutingWithLocale
