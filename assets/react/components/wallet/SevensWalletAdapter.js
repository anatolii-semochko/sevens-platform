import {
    BaseMessageSignerWalletAdapter,
    WalletConnectionError,
    WalletNotConnectedError,
    WalletReadyState,
    WalletSignMessageError,
    WalletSignTransactionError,
} from '@solana/wallet-adapter-base'

// Глобальний екземпляр адаптера
let globalSevensWalletAdapter = null

/**
 * Sevens Wallet Adapter - стандартний Solana wallet adapter
 * Повна сумісність з PhantomWalletAdapter API
 */
class SevensWalletAdapterImpl extends BaseMessageSignerWalletAdapter {
    name = 'Sevens Wallet'
    url = '#'
    icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI4IiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTUlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMDA3QkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj43Nzc8L3RleHQ+Cjwvc3ZnPg=='
    supportedTransactionVersions = new Set(['legacy', 0])

    constructor() {
        super()
        this._connecting = false
        this._wallet = null
        this._publicKey = null
        this._readyState = this._getReadyState()
    }

    _getReadyState() {
        if (typeof window === 'undefined') {
            return WalletReadyState.Unsupported
        }

        const wallet = this._getSevensWallet()
        return wallet ? WalletReadyState.Installed : WalletReadyState.Loadable
    }

    _getSevensWallet() {
        if (typeof window === 'undefined') return null

        if (window.solana?.isSevens) {
            return window.solana
        }

        if (window.sevens?.isSevens) {
            return window.sevens
        }

        return null
    }

    get publicKey() {
        return this._publicKey
    }

    get connecting() {
        return this._connecting
    }

    get connected() {
        return !!this._wallet
    }

    get readyState() {
        // Динамічно перевіряти стан при кожному запиті
        return this._getReadyState()
    }

    async connect() {
        try {
            if (this.connected || this.connecting) return

            this._connecting = true

                let wallet = this._getSevensWallet()
            if (!wallet) {
                for (let i = 0; i < 5; i++) {
                    await new Promise(resolve => setTimeout(resolve, 50))
                    wallet = this._getSevensWallet()
                    if (wallet) break
                }
            }

            if (!wallet) {
                throw new WalletConnectionError('Sevens Wallet not found. Please make sure Sevens Wallet is available.')
            }

            wallet.on('connect', this._handleConnect)
            wallet.on('disconnect', this._handleDisconnect)
            wallet.on('accountChanged', this._handleAccountChanged)

            const response = await wallet.connect()

            if (!response?.publicKey) {
                throw new WalletConnectionError('Failed to connect to Sevens Wallet')
            }

        } catch (error) {
            const errorMessage = error?.message || String(error)
            this.emit('error', errorMessage)
            throw error
        } finally {
            this._connecting = false
        }
    }

    async disconnect() {
        const wallet = this._wallet || this._getSevensWallet()
        if (wallet) {
            wallet.off('connect', this._handleConnect)
            wallet.off('disconnect', this._handleDisconnect)
            wallet.off('accountChanged', this._handleAccountChanged)

            this._wallet = null
            this._publicKey = null

            try {
                await wallet.disconnect()
            } catch (error) {
                const errorMessage = error?.message || String(error)
                this.emit('error', errorMessage)
            }
        }

        this.emit('disconnect')
    }

    async signTransaction(transaction) {
        try {
            const wallet = this._wallet || this._getSevensWallet()
            if (!wallet) throw new WalletNotConnectedError()

            try {
                return await wallet.signTransaction(transaction)
            } catch (error) {
                throw new WalletSignTransactionError(error?.message, error)
            }
        } catch (error) {
            const errorMessage = error?.message || String(error)
            this.emit('error', errorMessage)
            throw error
        }
    }

    async signAllTransactions(transactions) {
        try {
            const wallet = this._wallet || this._getSevensWallet()
            if (!wallet) throw new WalletNotConnectedError()

            try {
                return await wallet.signAllTransactions(transactions)
            } catch (error) {
                throw new WalletSignTransactionError(error?.message, error)
            }
        } catch (error) {
            const errorMessage = error?.message || String(error)
            this.emit('error', errorMessage)
            throw error
        }
    }

    async signMessage(message) {
        try {
            const wallet = this._wallet || this._getSevensWallet()
            if (!wallet) throw new WalletNotConnectedError()

            try {
                return await wallet.signMessage(message)
            } catch (error) {
                throw new WalletSignMessageError(error?.message, error)
            }
        } catch (error) {
            const errorMessage = error?.message || String(error)
            this.emit('error', errorMessage)
            throw error
        }
    }

    // Event handlers
    _handleConnect = (publicKey) => {
        if (publicKey) {
            this._wallet = this._getSevensWallet()
            this._publicKey = publicKey
            this.emit('connect', publicKey)
        }
    }

    _handleDisconnect = () => {
        this._wallet = null
        this._publicKey = null
        this.emit('disconnect')
    }

    _handleAccountChanged = (publicKey) => {
        if (publicKey) {
            this._publicKey = publicKey
            this.emit('accountChanged', publicKey)
            // Додатково емітити connect для форсування оновлення useWallet()
            this.emit('connect', publicKey)
        } else {
            this._handleDisconnect()
        }
    }
}

// Синглтон адаптер
export class SevensWalletAdapter {
    constructor() {
        if (!globalSevensWalletAdapter) {
            globalSevensWalletAdapter = new SevensWalletAdapterImpl()
        }

        return globalSevensWalletAdapter
    }
}
