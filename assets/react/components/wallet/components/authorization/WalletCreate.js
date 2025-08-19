import React, { useState } from 'react'
import config from '@react/components/wallet/config.json'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { createEncryptedWallets } from '@react/components/wallet/scripts/storageActions'
import { ButtonSave } from '@react/components/wallet/components/form-elements/Buttons'
import { InputPassword } from '@react/components/wallet/components/form-elements/Inputs'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import {WalletHeader} from "@react/components/wallet/components/form-elements/Blocks";

const WalletCreate = ({ onWalletCreated }) => {
    const {setPassword} = useWalletContext()
    const [passwordMain, setPasswordMain] = useState('')
    const [passwordRepeat, setPasswordRepeat] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)

    const checkPassword = () => {
        if (!passwordMain || passwordMain.length < config.PASSWORD_MIN_LENGTH) {
            throw new Error(`Password must be at least ${config.PASSWORD_MIN_LENGTH} characters long`)
        }
        if (passwordMain !== passwordRepeat) {
            throw new Error(`Passwords don't match`)
        }
    }

    const handleCreatePassword = async (e) => {
        try {
            e?.preventDefault()
            setErrorMessage(null)
            checkPassword()
            await createEncryptedWallets(passwordMain)
            setPassword(passwordMain)
            if (onWalletCreated) {
                onWalletCreated()
            }
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <div>
            <WalletHeader />
            <form onSubmit={handleCreatePassword} className="p-3 d-grid gap-3">
                <label className="text-center">Enter wallet password</label>
                <InputPassword
                    placeholder={'Enter password'}
                    password={passwordMain}
                    setPassword={setPasswordMain}
                    setErrorMessage={setErrorMessage}
                />
                <InputPassword
                    placeholder={'Repeat password'}
                    password={passwordRepeat}
                    setPassword={setPasswordRepeat}
                    setErrorMessage={setErrorMessage}
                />
                <ErrorMessageBlock message={errorMessage} className={'mb-0'} />
                <ButtonSave label={'Create Wallet'} onClick={handleCreatePassword} />
            </form>
        </div>
    )
}

export default WalletCreate
