import * as bootstrap from 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import '@css/template.scss'
import '@css/custom.scss'
import '@css/material.scss'
import '@css/gallery.scss'
import '@css/404.scss'
import '@css/registration.scss'
import '@js/help-link'
import '@js/material-slider'
import '@js/side-bar'
import '@js/toast'
import '@js/password-toggle'
import React from 'react'
import ReactDOM, { createRoot } from 'react-dom/client'
import store from '@react/store/index'
import streamSaver from 'streamsaver'
import { Buffer } from 'buffer'
import { Toaster } from 'react-hot-toast'
import { RoutingWithLocale } from '@js/router/routing-with-locale'
import { showModal } from '@js/modal'
import { seo } from '@js/seo-test'
import { Provider } from 'react-redux'
import { WebSocketProvider } from '@react/context/WebSocketContext'
import { RateUpdateListener } from '@react/components/websocket/RateUpdateListener'
import { HistoryTable } from '@react/components/info-componnents/token/TokenInfo'
import { ButtonContainerDownload } from '@react/components/download-container/DownloadContainer'
import Create from '@react/components/create-token-material/Create'
import BuyToken from '@react/components/buy-token/BuyToken'
import CheckToken from '@react/components/check-token/CheckToken'
import UserAuth from '@react/components/user-auth/UserAuth'
import MaterialManage from '@react/components/material-manage/MaterialManage'
import MaterialClaim from '@react/components/material-manage/claim/MaterialClaim'
import MaterialVotes from '@react/components/material-votes/MaterialVotes'
import MaterialComments from '@react/components/material-comments/MaterialComments'
import CommentsManage from '@react/components/comments-manage/CommentsManage'

window.bootstrap = bootstrap
window.Routing = RoutingWithLocale
window.Buffer = Buffer
window.seo = seo

streamSaver.WritableStream = streamSaver.WritableStream || window.WritableStream
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/streamsaver-sw.js', { scope: '/' })
        .catch(error => console.error('SW register failed:', error))
}

// Initialize WebSocket globally
const websocketRoot = document.createElement('div')
websocketRoot.id = 'websocket-root'
document.body.appendChild(websocketRoot)
const wsRoot = createRoot(websocketRoot)
wsRoot.render(
    <Provider store={store}>
        <WebSocketProvider>
            <RateUpdateListener />
        </WebSocketProvider>
    </Provider>
)

const createTokenMaterial = document.getElementById('create-token-material')
if (createTokenMaterial) {
    const root = createRoot(createTokenMaterial)
    root.render(
        <Provider store={store}>
            <WebSocketProvider>
                <Create type={createTokenMaterial.dataset.type} />
            </WebSocketProvider>
        </Provider>
    )
}

const checkToken = document.getElementById('check-token')
if (checkToken) {
    const root = createRoot(checkToken)
    root.render(<Provider store={store}><CheckToken /></Provider>)
}

const userAuthMount = document.getElementById('user-auth-react-mount')
if (userAuthMount) {
    const root = createRoot(userAuthMount)
    root.render(<Provider store={store}><UserAuth /></Provider>)
}

const materialManage = document.getElementById('material-manage')
if (materialManage) {
    createRoot(materialManage).render(
        <Provider store={store}>
            <MaterialManage token={materialManage.dataset.token} />
        </Provider>
    )
}

const materialClaim = document.getElementById('material-claim')
if (materialClaim) {
    createRoot(materialClaim).render(
        <Provider store={store}>
            <MaterialClaim />
        </Provider>
    )
}

const materialVotes = document.getElementById('material-votes')
if (materialVotes) {
    const materialToken = materialVotes.dataset.materialToken || ''
    const initialLikes = materialVotes.dataset.initialLikes || '0'
    const initialDislikes = materialVotes.dataset.initialDislikes || '0'
    const viewCount = materialVotes.dataset.viewCount || '0'
    const root = createRoot(materialVotes)
    root.render(
        <Provider store={store}>
            <MaterialVotes
                materialToken={materialToken}
                initialLikes={parseInt(initialLikes)}
                initialDislikes={parseInt(initialDislikes)}
                viewCount={parseInt(viewCount)}
            />
        </Provider>
    )
}

const priceHistoryHistory = document.getElementById('token-price-history')
if (priceHistoryHistory) {
    const root = createRoot(priceHistoryHistory)
    root.render(
        <Provider store={store}>
            <HistoryTable tokenPublicKey={priceHistoryHistory.dataset.token} showChart={true} showTable={true} />
        </Provider>
    )
}

const materialComments = document.getElementById('material-comments')
if (materialComments) {
    const materialToken = materialComments.dataset.materialToken
    const isLoggedIn = materialComments.dataset.isLoggedIn === 'true'

    if (materialToken) {
        const root = createRoot(materialComments)
        root.render(
            <Provider store={store}>
                <MaterialComments materialToken={materialToken} isLoggedIn={isLoggedIn} />
            </Provider>
        )
    }
}

const commentsManage = document.getElementById('comments-manage')
if (commentsManage) {
    const comments = JSON.parse(commentsManage.dataset.comments || '[]')
    const root = createRoot(commentsManage)
    root.render(
        <Provider store={store}>
            <CommentsManage initialComments={comments} />
        </Provider>
    )
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('buyTokenBtn')?.addEventListener('click', () => {
        const container = document.getElementById('buyTokenForm')
        const root = ReactDOM.createRoot(container)
        root.render(
            <Provider store={store}>
                <BuyToken root={root} token={container.dataset.token} isMyMaterial={container.dataset.isMyMaterial} />
            </Provider>
        )
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
