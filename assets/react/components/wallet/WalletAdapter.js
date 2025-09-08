import {
    BaseWalletAdapter,
    WalletReadyState,
    WalletNotConnectedError,
    WalletConnectionError,
    WalletDisconnectionError,
    WalletSignTransactionError,
} from '@solana/wallet-adapter-base'
import getWalletEventBus from './EventBus.js'

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
        this._readyState = WalletReadyState.Installed
        this._connectionCheckInterval = null
        this._eventBus = getWalletEventBus()
        
        this._setupEventListeners()
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

    _setupEventListeners() {
        this._eventBus.on('sevens-wallet-opened', (event) => {
            const { wallet } = event.detail
            if (wallet && wallet.publicKey) {
                this._wallet = wallet
                this._publicKey = wallet.publicKey
                this.emit('connect', this._publicKey)
            }
        })

        this._eventBus.on('sevens-wallet-connected', (event) => {
            const { wallet } = event.detail
            if (wallet && wallet.publicKey) {
                // Update wallet reference and publicKey when wallet becomes available
                this._wallet = wallet
                if (!this._publicKey || this._publicKey.toString() !== wallet.publicKey.toString()) {
                    this._publicKey = wallet.publicKey
                    this.emit('connect', this._publicKey)
                }
            }
        })

        this._eventBus.on('sevens-wallet-closed', (event) => {
            const { forceDisconnect = false } = event.detail || {}
            if (this.connected && forceDisconnect) {
                this._wallet = null
                this._publicKey = null
                this.emit('disconnect')
            }
        })

        this._eventBus.on('sevens-wallet-account-changed', (event) => {
            const { publicKey } = event.detail
            if (publicKey) {
                this._publicKey = publicKey
                // If we don't have a wallet reference, wait for the wallet connection
                if (this._wallet) {
                    this.emit('connect', this._publicKey)
                }
            }
        })
    }

    async connect() {
        try {
            if (this.connected || this.connecting) return

            this._connecting = true

            this._eventBus.emit('sevens-wallet-connect-request', {
                adapter: this
            })

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
                this._eventBus.off('sevens-wallet-connected', handleConnection)
                reject(new WalletConnectionError('Wallet connection timeout'))
            }, 30000)

            const handleConnection = (event) => {
                const { wallet, error } = event.detail

                clearTimeout(timeout)
                this._eventBus.off('sevens-wallet-connected', handleConnection)

                if (error) {
                    reject(new WalletConnectionError(error))
                } else if (wallet) {
                    resolve(wallet)
                } else {
                    reject(new WalletConnectionError('No wallet provided'))
                }
            }

            this._eventBus.on('sevens-wallet-connected', handleConnection)
        })
    }

    async disconnect() {
        const wallet = this._wallet
        if (wallet) {
            this._wallet = null
            this._publicKey = null

            try {
                this._eventBus.emit('sevens-wallet-disconnect-request', {
                    adapter: this
                })
                
                // Emit close event with force disconnect to properly disconnect adapter
                this._eventBus.emit('sevens-wallet-closed', { forceDisconnect: true })

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
                    this._eventBus.emit('sevens-wallet-close-dialog')
                    resolve(signedTransaction)
                },
                onCancel: () => {
                    this._eventBus.emit('sevens-wallet-close-dialog')
                    reject(new WalletSignTransactionError('User rejected transaction'))
                }
            }

            this._eventBus.emit('sevens-wallet-show-sign-transaction', eventDetail)
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
