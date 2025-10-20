import { PublicKey } from '@solana/web3.js'
import useWalletContext from './hooks/useWalletContext'
import { useEffect, useRef } from 'react'

/**
 * Sevens Wallet Provider - повна імітація window.solana як у Phantom
 * Створює глобальний об'єкт window.solana для сумісності з стандартними адаптерами
 */
class SevensWalletProvider {
    constructor() {
        this.isPhantom = false
        this.isSevens = true
        this.isConnected = false
        this.publicKey = null
        this._events = new Map()
        this._walletData = null
        this._connecting = false
        this._hasWalletContext = false
    }

    // Phantom-сумісні методи
    async connect() {
        console.log('🚀 SevensWalletProvider.connect() called, _hasWalletContext:', this._hasWalletContext)
        
        if (this._connecting) {
            return { publicKey: this.publicKey }
        }

        this._connecting = true
        
        try {
            // Якщо немає WalletContext, повернути помилку з інструкціями
            if (!this._hasWalletContext) {
                throw new Error('Sevens Wallet requires WalletContextProvider. This component needs to be wrapped with WalletContextProvider or use a component that has access to it.')
            }
            
            // Отримати поточний активний гаманець від WalletContext з retry
            let currentWallet = await this._getCurrentWallet()
            
            // Якщо немає даних, почекати та спробувати ще раз (для race conditions)
            if (!currentWallet?.publicKey) {
                console.log('⏳ Wallet not ready, retrying...')
                await new Promise(resolve => setTimeout(resolve, 200))
                currentWallet = await this._getCurrentWallet()
            }
            
            if (currentWallet?.publicKey) {
                this.publicKey = new PublicKey(currentWallet.publicKey)
                this.isConnected = true
                this._walletData = currentWallet
                
                // Емітити події як Phantom
                this.emit('connect', this.publicKey)
                this.emit('accountChanged', this.publicKey)
                
                return { publicKey: this.publicKey }
            } else {
                throw new Error('No wallet available. Please unlock your Sevens wallet first.')
            }
        } finally {
            this._connecting = false
        }
    }

    async disconnect() {
        if (this.isConnected) {
            this.publicKey = null
            this.isConnected = false
            this._walletData = null
            
            this.emit('disconnect')
        }
    }

    async signTransaction(transaction) {
        if (!this.isConnected) {
            throw new Error('Wallet not connected')
        }

        return new Promise((resolve, reject) => {
            // Відкрити Sevens Wallet UI для підпису
            const event = new CustomEvent('sevens-wallet-show-sign-transaction', {
                detail: {
                    transaction,
                    onSign: (signedTransaction) => {
                        resolve(signedTransaction)
                    },
                    onCancel: () => {
                        reject(new Error('User rejected the transaction'))
                    }
                }
            })
            
            window.dispatchEvent(event)
        })
    }

    async signAllTransactions(transactions) {
        const signedTransactions = []
        for (const transaction of transactions) {
            const signed = await this.signTransaction(transaction)
            signedTransactions.push(signed)
        }
        return signedTransactions
    }

    async signMessage(message) {
        if (!this.isConnected) {
            throw new Error('Wallet not connected')
        }

        return new Promise((resolve, reject) => {
            const event = new CustomEvent('sevens-wallet-show-sign-message', {
                detail: {
                    message,
                    onSign: (signature) => {
                        resolve(signature)
                    },
                    onCancel: () => {
                        reject(new Error('User rejected the message'))
                    }
                }
            })
            
            window.dispatchEvent(event)
        })
    }

    // Event system як у Phantom
    on(event, callback) {
        if (!this._events.has(event)) {
            this._events.set(event, new Set())
        }
        this._events.get(event).add(callback)
    }

    off(event, callback) {
        if (this._events.has(event)) {
            this._events.get(event).delete(callback)
        }
    }

    emit(event, data) {
        if (this._events.has(event)) {
            this._events.get(event).forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error('Error in wallet event callback:', error)
                }
            })
        }
    }

    // Метод для отримання поточного гаманця від WalletContext
    async _getCurrentWallet() {
        return new Promise((resolve) => {
            let isResolved = false
            let bestResponse = null
            let responseCount = 0
            
            const resolveOnce = (data, isUnlocked) => {
                responseCount++
                console.log(`🔄 WalletContext response #${responseCount}:`, data, 'unlocked:', isUnlocked)
                
                // Зберегти найкращу відповідь (розблокований контекст з publicKey)
                if (isUnlocked && data?.publicKey) {
                    bestResponse = data
                }
                
                // Дочекатися всіх відповідей або знайти розблокований
                if (!isResolved && (bestResponse || responseCount >= 3)) {
                    isResolved = true
                    resolve(bestResponse)
                }
            }
            
            console.log('📡 Requesting wallet data from WalletContext...')
            const event = new CustomEvent('sevens-wallet-get-current', {
                detail: {
                    callback: resolveOnce
                }
            })
            window.dispatchEvent(event)
            
            // Fallback якщо немає WalletContext (наприклад в BuyToken)
            setTimeout(() => {
                if (!isResolved) {
                    console.warn('No WalletContext available, Sevens Wallet not accessible in this component')
                    isResolved = true
                    resolve(bestResponse)
                }
            }, 150)
        })
    }

    // Встановити чи доступний WalletContext
    setHasWalletContext(hasContext) {
        this._hasWalletContext = hasContext
        globalHasWalletContext = hasContext
    }

    // Обновити стан коли змінюється walletData
    updateWallet(walletData) {
        const newPublicKey = walletData?.publicKey ? new PublicKey(walletData.publicKey) : null
        const wasConnected = this.isConnected
        const oldPublicKey = this.publicKey

        // console.log('🔄 updateWallet called:', {
        //     newPublicKey: newPublicKey?.toString(),
        //     oldPublicKey: oldPublicKey?.toString(),
        //     wasConnected
        // })

        if (newPublicKey) {
            this.publicKey = newPublicKey
            this.isConnected = true
            this._walletData = walletData

            // Емітити події відповідно до стану
            if (!wasConnected) {
                console.log('✅ Emitting connect event')
                this.emit('connect', this.publicKey)
            } else if (!oldPublicKey || !oldPublicKey.equals(newPublicKey)) {
                console.log('🔄 Emitting accountChanged event')
                this.emit('accountChanged', this.publicKey)
            } else {
                console.log('ℹ️ Same publicKey, no event needed')
            }
        } else {
            if (wasConnected) {
                console.log('❌ Emitting disconnect event')
                this.publicKey = null
                this.isConnected = false
                this._walletData = null
                this.emit('disconnect')
            } else {
                console.log('ℹ️ Already disconnected, no event needed')
            }
        }
    }
}

// Створити глобальний екземпляр
let sevensWalletProvider = null
let globalHasWalletContext = false

export function initializeSevensWallet() {
    if (typeof window !== 'undefined' && !sevensWalletProvider) {
        sevensWalletProvider = new SevensWalletProvider()
        
        // Синхронізувати з глобальним флагом
        sevensWalletProvider._hasWalletContext = globalHasWalletContext
        
        // Встановити глобальний провайдер
        try {
            // Завжди використовуємо window.sevens для уникнення конфліктів
            window.sevens = sevensWalletProvider
            console.log('✅ Sevens Wallet Provider initialized as window.sevens')
            
            // Спробувати встановити window.solana якщо можливо
            if (!window.solana) {
                try {
                    // Спочатку спробувати прямий запис
                    window.solana = sevensWalletProvider
                    console.log('✅ Also set as window.solana (direct assignment)')
                } catch (e) {
                    // Якщо прямий запис не працює, спробувати defineProperty
                    try {
                        Object.defineProperty(window, 'solana', {
                            value: sevensWalletProvider,
                            writable: false,
                            configurable: true
                        })
                        console.log('✅ Also set as window.solana (defineProperty)')
                    } catch (e2) {
                        console.log('ℹ️ Could not set window.solana, using only window.sevens')
                    }
                }
            } else if (window.solana.isSevens) {
                console.log('ℹ️ window.solana already contains Sevens Wallet')
            } else {
                console.log('ℹ️ window.solana already exists with other wallet, using only window.sevens')
            }
        } catch (error) {
            console.error('❌ Failed to initialize Sevens Wallet Provider:', error)
        }
    } else if (sevensWalletProvider) {
        // Якщо провайдер вже існує, синхронізувати флаг
        sevensWalletProvider._hasWalletContext = globalHasWalletContext
    }
    
    return sevensWalletProvider
}

export function getSevensWalletProvider() {
    return sevensWalletProvider || initializeSevensWallet()
}

// React Hook для синхронізації з WalletContext
export function useSevensWalletSync() {
    const { walletData, unlocked } = useWalletContext()
    const providerRef = useRef(getSevensWalletProvider())
    const previousWalletDataRef = useRef(null)

    useEffect(() => {
        const provider = providerRef.current
        
        // Встановити що WalletContext доступний
        provider.setHasWalletContext(true)
        
        if (unlocked && walletData?.publicKey) {
            // Синхронізувати стан provider з WalletContext
            provider.updateWallet(walletData)
            previousWalletDataRef.current = walletData
        } else if (!unlocked) {
            // Відключити тільки якщо гаманець дійсно заблокований
            provider.updateWallet(null)
            previousWalletDataRef.current = null
        }
        // Ігнорувати випадки коли unlocked=true але walletData тимчасово null
        // (під час зміни гаманця)
        
    }, [walletData, unlocked])

    return providerRef.current
}