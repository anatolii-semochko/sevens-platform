import {
    BaseWalletAdapter,
    WalletReadyState,
    WalletNotConnectedError,
    WalletConnectionError,
    WalletDisconnectionError,
    WalletSignTransactionError,
} from '@solana/wallet-adapter-base'

export class SevensWalletAdapter extends BaseWalletAdapter {


    // TODO - Check if it is needed
    name = 'Sevens Wallet'
    url = 'https://sevenstime.local'
    icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzAwNzdjZiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UzwvdGV4dD48L3N2Zz4='
    supportedTransactionVersions = null


    constructor() {
        super()
        this._connecting = false
        this._wallet = null
        this._publicKey = null
        this._readyState = WalletReadyState.Installed // Installed or Loadable
        this._connectionCheckInterval = null
    }

    get publicKey() {
        return this._publicKey
    }

    get connecting() {
        return this._connecting
    }

    get connected() {
        return !!this._wallet && !!this._publicKey
    }

    get readyState() {
        return this._readyState
    }

    async connect() {
        try {
            if (this.connected || this.connecting) return

            this._connecting = true

            // Dispatch standard event to request wallet connection
            window.dispatchEvent(new CustomEvent('sevens-wallet-connect-request', {
                detail: { adapter: this }
            }))

            // Wait for wallet response
            const wallet = await this._waitForWalletConnection()

            this._publicKey = wallet.publicKey
            this._wallet = wallet

            this.emit('connect', this._publicKey)
        } catch (error) {
            this.emit('error', error)
            throw error
        } finally {
            this._connecting = false
        }
    }

    _waitForWalletConnection() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                window.removeEventListener('sevens-wallet-connected', handleConnection)
                reject(new WalletConnectionError('Wallet connection timeout'))
            }, 30000)

            const handleConnection = (event) => {
                const { wallet, error } = event.detail

                clearTimeout(timeout)
                window.removeEventListener('sevens-wallet-connected', handleConnection)

                if (error) {
                    reject(new WalletConnectionError(error))
                } else if (wallet) {
                    resolve(wallet)
                } else {
                    reject(new WalletConnectionError('No wallet provided'))
                }
            }

            window.addEventListener('sevens-wallet-connected', handleConnection)
        })
    }

    async disconnect() {
        const wallet = this._wallet
        if (wallet) {
            this._wallet = null
            this._publicKey = null

            try {
                // Notify Sevens Wallet about disconnection
                window.dispatchEvent(new CustomEvent('sevens-wallet-disconnect-request', {
                    detail: { adapter: this }
                }))

                if (wallet.disconnect) {
                    await wallet.disconnect()
                }

                this.emit('disconnect')
            } catch (error) {
                this.emit('error', new WalletDisconnectionError(error?.message, error))
            }
        }
    }

    async signTransaction(transaction) {
        try {
            const wallet = this._wallet
            if (!wallet) throw new WalletNotConnectedError()

            console.log('signTransaction', transaction)
            
            // Open SignTransaction page and wait for user decision
            return await this._showSignTransactionDialog(transaction)

        } catch (error) {
            this.emit('error', error)
            throw new WalletSignTransactionError(error?.message, error)
        }
    }

    _showSignTransactionDialog(transaction) {
        return new Promise((resolve, reject) => {
            // Dispatch event to show SignTransaction page
            const eventDetail = {
                transaction,
                onSign: (signedTransaction) => {
                    // Close the dialog
                    window.dispatchEvent(new CustomEvent('sevens-wallet-close-dialog'))
                    resolve(signedTransaction)
                },
                onCancel: () => {
                    // Close the dialog
                    window.dispatchEvent(new CustomEvent('sevens-wallet-close-dialog'))
                    reject(new WalletSignTransactionError('User rejected transaction'))
                }
            }

            window.dispatchEvent(new CustomEvent('sevens-wallet-show-sign-transaction', {
                detail: eventDetail
            }))
        })
    }

    async signAllTransactions(transactions) {
        try {
            const wallet = this._wallet
            if (!wallet) throw new WalletNotConnectedError()

            console.log('signAllTransactions', transactions)
            // TODO - simulate transaction in assets/react/components/wallet/scripts/simulate.js
            // TODO - open page by setShowComponent({component: 'SignTransaction'})
            // TODO - show simulated data in SignTransaction

            // Use the signAllTransactions method from getWalletFromKeypair
            const signedTransactions = await wallet.signAllTransactions(transactions)
            return signedTransactions

        } catch (error) {
            this.emit('error', error)
            throw new WalletSignTransactionError(error?.message, error)
        }
    }

    async signMessage(message) {
        try {
            const wallet = this._wallet
            if (!wallet) throw new WalletNotConnectedError()

            console.log('signMessage', message)
            // TODO - simulate transaction in assets/react/components/wallet/scripts/simulate.js
            // TODO - open page by setShowComponent({component: 'SignTransaction'})
            // TODO - show simulated data in SignTransaction

            // Use the signMessage method from getWalletFromKeypair
            const signature = await wallet.signMessage(message)
            return signature

        } catch (error) {
            this.emit('error', error)
            throw new WalletSignTransactionError(error?.message, error)
        }
    }
}
