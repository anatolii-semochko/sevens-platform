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
        this._id = Math.random().toString(36).substr(2, 9) // For debugging
        this._hasEmittedConnect = false // Track if we've emitted connect event

        console.log(`🏗️ [Adapter-${this._id}] SevensWalletAdapter constructor called`)

        this._setupEventListeners()

        // Check for existing wallet after a longer delay to ensure React has settled
        setTimeout(() => {
            console.log(`⏰ [Adapter-${this._id}] Auto-connect timeout triggered`)
            if (!this.connected && !this.connecting) {
                this._autoConnectIfAvailable()
            } else {
                console.log(`⏹️ [Adapter-${this._id}] Skipping auto-connect: connected=${this.connected}, connecting=${this.connecting}`)
            }
        }, 500)
    }

    get publicKey() {
        return this._publicKey
    }

    get connecting() {
        return this._connecting
    }

    get connected() {
        const isConnected = !!this._wallet && !!this._publicKey
        // Uncomment for debugging:
        console.log('🔍 [Adapter] Connected check:', { isConnected, hasWallet: !!this._wallet, hasPublicKey: !!this._publicKey })
        return isConnected
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
                console.log(`📡 [Adapter-${this._id}] Received sevens-wallet-connected, current state:`, {
                    connected: this.connected,
                    hasWallet: !!this._wallet,
                    hasPublicKey: !!this._publicKey
                })

                const previousKey = this._publicKey?.toString()
                const newKey = wallet.publicKey.toString()
                const wasConnected = this.connected

                console.log(`🔄 [Adapter-${this._id}] Updating wallet connection:`, {
                    previousKey,
                    newKey,
                    same: previousKey === newKey,
                    wasConnected,
                    connecting: this._connecting
                })

                // Update wallet reference and publicKey
                this._wallet = wallet
                this._publicKey = wallet.publicKey

                // Always emit connect event for new adapters or when wallet changes
                // Check if this is a fresh adapter (no previous emissions)
                const shouldEmit = !wasConnected || previousKey !== newKey || this._connecting || !this._hasEmittedConnect

                if (shouldEmit) {
                    console.log(`✅ [Adapter-${this._id}] Emitting connect event via sevens-wallet-connected`)
                    this.emit('readyStateChange', this._readyState) // First emit readyStateChange
                    this.emit('connect', this._publicKey) // Then emit connect
                    this._hasEmittedConnect = true

                    // Force re-emit after a short delay to ensure React hooks update
                    setTimeout(() => {
                        if (this.connected && this._wallet && this._publicKey) {
                            console.log(`🔄 [Adapter-${this._id}] Force re-emitting connect event for React sync`)
                            this.emit('connect', this._publicKey)
                        }
                    }, 100)
                } else {
                    console.log(`⏭️ [Adapter-${this._id}] Skipping connect event - already connected to same wallet`)
                }
            }
        })

        this._eventBus.on('sevens-wallet-closed', (event) => {
            const { forceDisconnect = false } = event.detail || {}
            if (this.connected && forceDisconnect) {
                this._wallet = null
                this._publicKey = null
                this._hasEmittedConnect = false // Reset flag on disconnect
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

    async _autoConnectIfAvailable() {
        try {
            console.log(`🔍 [Adapter-${this._id}] Auto-checking for available wallet...`)
            const currentWallet = await this._checkForExistingWallet()

            if (currentWallet && currentWallet.publicKey) {
                console.log(`✅ [Adapter-${this._id}] Auto-connecting to existing wallet:`, currentWallet.publicKey.toString())
                this._publicKey = currentWallet.publicKey
                this._wallet = currentWallet
                console.log(`📡 [Adapter-${this._id}] Emitting connect event from auto-connect`)
                this.emit('readyStateChange', this._readyState)
                this.emit('connect', this._publicKey)
                this._hasEmittedConnect = true
            } else {
                console.log(`❌ [Adapter-${this._id}] No wallet available for auto-connect`)
            }
        } catch (error) {
            console.warn(`⚠️ [Adapter-${this._id}] Auto-connect check failed:`, error)
        }
    }

    async connect() {
        try {
            console.log('🚀 [Adapter] Connect method called')
            console.log('📊 [Adapter] Current state:', {
                connected: this.connected,
                connecting: this.connecting,
                hasWallet: !!this._wallet,
                hasPublicKey: !!this._publicKey
            })

            if (this.connected || this.connecting) {
                console.log('⏹️ [Adapter] Already connected or connecting, returning')
                return
            }

            this._connecting = true
            console.log('🔄 [Adapter] Setting connecting state to true')

            // First, check if there's already an available wallet
            console.log('🔍 [Adapter] Starting check for existing wallet...')
            const currentWallet = await this._checkForExistingWallet()

            if (currentWallet && currentWallet.publicKey) {
                console.log('✅ [Adapter] Found existing wallet:', currentWallet.publicKey.toString())
                this._publicKey = currentWallet.publicKey
                this._wallet = currentWallet
                console.log('📡 [Adapter] Emitting connect event from manual connect')
                this.emit('connect', this._publicKey)
                this._hasEmittedConnect = true
                return
            }

            console.log('❌ [Adapter] No existing wallet found, requesting connection')

            // If no existing wallet, request connection
            console.log('📤 [Adapter] Emitting sevens-wallet-connect-request')
            this._eventBus.emit('sevens-wallet-connect-request', {
                adapter: this
            })

            // Wait for wallet response
            console.log('⏳ [Adapter] Waiting for wallet connection...')
            const wallet = await this._waitForWalletConnection()

            console.log('✅ [Adapter] Got wallet from connection request:', wallet.publicKey.toString())
            this._publicKey = wallet.publicKey
            this._wallet = wallet

            console.log('📡 [Adapter] Emitting connect event')
            this.emit('connect', this._publicKey)
            this._hasEmittedConnect = true
        } catch (error) {
            console.error('❌ [Adapter] Connect error:', error)
            this.emit('error', error)
            throw error
        } finally {
            this._connecting = false
            console.log('✅ [Adapter] Setting connecting state to false')
        }
    }

    _checkForExistingWallet() {
        return new Promise((resolve) => {
            let resolved = false
            console.log('🔍 [Adapter] Checking for existing wallet...')

            const handleResponse = (wallet) => {
                if (!resolved) {
                    resolved = true
                    console.log('✅ [Adapter] Got wallet response:', wallet ? 'Found wallet' : 'No wallet', wallet?.publicKey?.toString())
                    resolve(wallet)
                }
            }

            // Method 1: Request current wallet status via event
            console.log('📤 [Adapter] Emitting sevens-wallet-get-current')
            this._eventBus.emit('sevens-wallet-get-current', {
                callback: handleResponse
            })

            // Method 0: Try direct global access as fallback
            setTimeout(() => {
                if (!resolved && typeof window !== 'undefined' && window.__sevensCurrentWallet) {
                    console.log('🌐 [Adapter] Found wallet via global access')
                    handleResponse(window.__sevensCurrentWallet)
                }
            }, 100)

            // Method 2: Listen for any existing wallet announcements
            const handleExistingConnection = (event) => {
                console.log('👂 [Adapter] Received sevens-wallet-connected event:', event.detail)
                const { wallet } = event.detail || {}
                if (wallet && wallet.publicKey && !resolved) {
                    console.log('✅ [Adapter] Found existing connection via event')
                    this._eventBus.off('sevens-wallet-connected', handleExistingConnection)
                    handleResponse(wallet)
                }
            }

            this._eventBus.on('sevens-wallet-connected', handleExistingConnection)

            // Trigger a potential announcement of current state
            console.log('📤 [Adapter] Emitting sevens-wallet-ping')
            this._eventBus.emit('sevens-wallet-ping')

            // Timeout after 1 second if no response
            setTimeout(() => {
                if (!resolved) {
                    console.log('⏰ [Adapter] Timeout waiting for existing wallet response')
                    this._eventBus.off('sevens-wallet-connected', handleExistingConnection)
                    handleResponse(null)
                }
            }, 1000)
        })
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
            this._hasEmittedConnect = false // Reset flag on disconnect

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
