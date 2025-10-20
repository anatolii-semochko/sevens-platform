import { useEffect } from 'react'
import { initializeSevensWallet, useSevensWalletSync } from './SevensWalletProvider'

/**
 * Базовий ініціалізатор для компонентів без WalletContext
 */
export const SevensWalletInitializer = () => {
    // Ініціалізувати одразу, не чекаючи useEffect
    initializeSevensWallet()
    
    useEffect(() => {
        // Додаткова перевірка після mount з невеликою затримкою
        const timer = setTimeout(() => {
            initializeSevensWallet()
        }, 10)
        
        return () => clearTimeout(timer)
    }, [])

    return null
}

/**
 * Повний ініціалізатор з синхронізацією для компонентів з WalletContext
 */
export const SevensWalletSyncInitializer = () => {
    // Ініціалізувати одразу, не чекаючи useEffect
    initializeSevensWallet()
    
    useEffect(() => {
        // Додаткова перевірка після mount з невеликою затримкою
        const timer = setTimeout(() => {
            initializeSevensWallet()
        }, 10)
        
        return () => clearTimeout(timer)
    }, [])

    // Синхронізувати з WalletContext
    useSevensWalletSync()

    return null
}