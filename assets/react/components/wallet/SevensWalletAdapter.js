import {
    BaseMessageSignerWalletAdapter,
    WalletConnectionError,
    WalletDisconnectionError,
    WalletError,
    WalletNotConnectedError,
    WalletNotReadyError,
    WalletReadyState,
    WalletSignMessageError,
    WalletSignTransactionError,
} from '@solana/wallet-adapter-base'
import { PublicKey } from '@solana/web3.js'

// Глобальний екземпляр адаптера
let globalSevensWalletAdapter = null

/**
 * Sevens Wallet Adapter - стандартний адаптер як PhantomWalletAdapter
 * Працює через window.solana для повної сумісності
 */
class SevensWalletAdapterImpl extends BaseMessageSignerWalletAdapter {
    name = 'Sevens Wallet'
    url = '#' // Не переходити на зовнішній сайт
    icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2MzY2RjEiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI2IiB5PSI2Ij4KPHBhdGggZD0iTTEwIDJMMTggMTBMMTAgMThMMiAxMEwxMCAyWiIgZmlsbD0id2hpdGUiLz4KPHN2Zz4K'
    supportedTransactionVersions = new Set(['legacy', 0])

    constructor() {
        super()
        this._connecting = false
        this._wallet = null
        this._publicKey = null
        this._readyState = this._getReadyState()
        this._adapterId = Math.random().toString(36).substr(2, 9)
        console.log('🏗️ SevensWalletAdapter created with ID:', this._adapterId)
    }

    _getReadyState() {
        if (typeof window === 'undefined') {
            return WalletReadyState.Unsupported
        }
        
        // Перевірити чи є Sevens Wallet доступний (window.solana або window.sevens)
        const wallet = this._getSevensWallet()
        // Повертаємо Loadable замість NotDetected для більшої толерантності
        return wallet ? WalletReadyState.Installed : WalletReadyState.Loadable
    }

    _getSevensWallet() {
        if (typeof window === 'undefined') return null
        
        // Спочатку перевірити window.solana
        if (window.solana?.isSevens) {
            console.log('🔍 Found Sevens Wallet at window.solana')
            return window.solana
        }
        
        // Потім перевірити window.sevens
        if (window.sevens?.isSevens) {
            console.log('🔍 Found Sevens Wallet at window.sevens')
            return window.sevens
        }
        
        console.log('⚠️ Sevens Wallet not found. Available:', {
            'window.solana': !!window.solana,
            'window.solana.isSevens': window.solana?.isSevens,
            'window.sevens': !!window.sevens,
            'window.sevens.isSevens': window.sevens?.isSevens
        })
        
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

            // Перевірити чи є Sevens Wallet доступний з retry
            let wallet = this._getSevensWallet()
            if (!wallet) {
                // Чекати трохи для ініціалізації та повторити кілька разів
                console.log('⏳ Waiting for Sevens Wallet to initialize...')
                for (let i = 0; i < 5; i++) {
                    await new Promise(resolve => setTimeout(resolve, 50))
                    wallet = this._getSevensWallet()
                    if (wallet) break
                }
            }
            
            if (!wallet) {
                throw new WalletConnectionError('Sevens Wallet not found. Please make sure Sevens Wallet is available.')
            }

            // Встановити event listeners
            wallet.on('connect', this._handleConnect)
            wallet.on('disconnect', this._handleDisconnect)
            wallet.on('accountChanged', this._handleAccountChanged)

            // Підключитися
            const response = await wallet.connect()
            
            if (!response?.publicKey) {
                throw new WalletConnectionError('Failed to connect to Sevens Wallet')
            }

        } catch (error) {
            this.emit('error', error)
            throw error
        } finally {
            this._connecting = false
        }
    }

    async disconnect() {
        const wallet = this._wallet || this._getSevensWallet()
        if (wallet) {
            // Видалити event listeners
            wallet.off('connect', this._handleConnect)
            wallet.off('disconnect', this._handleDisconnect)
            wallet.off('accountChanged', this._handleAccountChanged)

            this._wallet = null
            this._publicKey = null

            try {
                await wallet.disconnect()
            } catch (error) {
                this.emit('error', new WalletDisconnectionError(error?.message, error))
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
            this.emit('error', error)
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
            this.emit('error', error)
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
            this.emit('error', error)
            throw error
        }
    }

    // Event handlers
    _handleConnect = (publicKey) => {
        console.log(`🔗 SevensWalletAdapter[${this._adapterId}]._handleConnect:`, publicKey?.toString())
        if (publicKey) {
            this._wallet = this._getSevensWallet()
            this._publicKey = publicKey
            console.log(`📡 Emitting 'connect' to useWallet() with:`, publicKey?.toString())
            this.emit('connect', publicKey)
        }
    }

    _handleDisconnect = () => {
        console.log(`💥 SevensWalletAdapter[${this._adapterId}]._handleDisconnect`)
        this._wallet = null
        this._publicKey = null
        this.emit('disconnect')
    }

    _handleAccountChanged = (publicKey) => {
        console.log(`🔄 SevensWalletAdapter[${this._adapterId}]._handleAccountChanged:`, publicKey?.toString())
        console.log(`🔍 Old publicKey:`, this._publicKey?.toString())
        if (publicKey) {
            this._publicKey = publicKey
            console.log(`✅ Updated adapter[${this._adapterId}] publicKey to:`, this._publicKey?.toString())
            console.log(`📡 Emitting 'accountChanged' to useWallet() with:`, publicKey?.toString())
            
            // Спробувати різні способи сповістити useWallet()
            this.emit('accountChanged', publicKey)
            
            // Додатково емітити connect для форсування оновлення
            console.log(`🔄 Also emitting 'connect' to force update...`)
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
            console.log('🏗️ Created global SevensWalletAdapter singleton:', globalSevensWalletAdapter._adapterId)
        } else {
            console.log('♻️ Reusing existing SevensWalletAdapter singleton:', globalSevensWalletAdapter._adapterId)
        }
        
        return globalSevensWalletAdapter
    }
}