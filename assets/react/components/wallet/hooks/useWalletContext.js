import { useContext } from 'react'
import { WalletContext } from '../context/WalletContext'

const useWalletContext = () => {
    const context = useContext(WalletContext)
    if (!context) {
        throw new Error('useWalletContext must be used within a WalletContextProvider')
    }
    return context
}

export default useWalletContext
