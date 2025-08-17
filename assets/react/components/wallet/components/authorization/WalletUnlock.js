import React, { useState } from 'react'
import config from '@react/components/wallet/config.json'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { readEncryptedWallets } from '@react/components/wallet/scripts/storageActions'
import { InputPassword } from '@react/components/wallet/components/form-elements/Inputs'
import { ButtonWalletUnLock } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import {WalletHeader} from "@react/components/wallet/components/form-elements/Blocks";

const WalletUnlock = ({unlock}) => {
    const {setPassword, setWalletsList} = useWalletContext()
    const [password, setUnlockPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)
    const [isBlocked, setIsBlocked] = useState(false)

    const checkPassword = () => {
        if (isBlocked) {
            throw new Error(`Please wait ${config.PASSWORD_REPEAT_DELAY_SECONDS} seconds before trying again`)
        }
        if (!password) {
            throw new Error('Please enter your password')
        }
    }
    
    const handleAuthorize = async (e) => {
        try {
            e.preventDefault()
            setErrorMessage(null)
            checkPassword()
            const wallets = await readEncryptedWallets(password)
            setPassword(password)
            setWalletsList(wallets)
            unlock()
        } catch (error) {
            setErrorMessage(error.message || 'Invalid password')
            setIsBlocked(true)
            setTimeout(() => {
                setIsBlocked(false)
                setErrorMessage(null)
            }, config.PASSWORD_REPEAT_DELAY_SECONDS * 1000)
        }
    }

    return (
        <div>
            <WalletHeader />
            <form onSubmit={handleAuthorize} className="p-3 d-grid gap-3">
                <div className="d-flex align-items-center">
                    <label className="me-2 px-1">Password: </label>
                    <InputPassword
                        placeholder={'password'}
                        password={password}
                        setPassword={setUnlockPassword}
                        setErrorMessage={setErrorMessage}
                    />
                </div>
                <ErrorMessageBlock message={errorMessage} className={'mb-0'} />
                <ButtonWalletUnLock />
            </form>
        </div>
    )
}

export default WalletUnlock
