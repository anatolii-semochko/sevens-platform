import React from 'react'
import useWalletContext from '../hooks/useWalletContext'
import { ButtonWalletUnLock } from '@react/components/wallet/components/form-elements/Buttons'

const UnlockWallet = ({ unlock }) => {
    const { password, setPassword } = useWalletContext()

    const handleSubmit = (e) => {
        e.preventDefault()
        unlock()
    }

    
    
    
    return (
        <form onSubmit={handleSubmit} className="p-3">
            <input
                type="password"
                className="form-control mt-2 mb-3"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <ButtonWalletUnLock />
        </form>
    )
}

export default UnlockWallet
