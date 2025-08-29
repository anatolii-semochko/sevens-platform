import React, { useState } from 'react'
import config from '@react/components/wallet/config.json'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { createEncryptedWallets } from '@react/components/wallet/scripts/storageActions'
import { ButtonSave } from '@react/components/wallet/components/form-elements/Buttons'
import { InputPassword } from '@react/components/wallet/components/form-elements/Inputs'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { WalletHeader } from '@react/components/wallet/components/form-elements/Blocks'

const WalletCreate = ({ onWalletCreated }) => {
    const {setPassword} = useWalletContext()
    const [passwordMain, setPasswordMain] = useState('')
    const [passwordRepeat, setPasswordRepeat] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)

    const checkPassword = () => {
        if (!passwordMain || passwordMain.length < config.PASSWORD_MIN_LENGTH) {
            throw new Error(t('passwordTooShort').replace('{n}', config.PASSWORD_MIN_LENGTH))
        }
        if (passwordMain !== passwordRepeat) {
            throw new Error(t('passwordsDontMatch'))
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
                <label className="text-center">{t('enterWalletPassword')}</label>
                <InputPassword
                    placeholder={t('enterPassword')}
                    password={passwordMain}
                    setPassword={setPasswordMain}
                    setErrorMessage={setErrorMessage}
                />
                <InputPassword
                    placeholder={t('repeatPassword')}
                    password={passwordRepeat}
                    setPassword={setPasswordRepeat}
                    setErrorMessage={setErrorMessage}
                />
                <ErrorMessageBlock message={errorMessage} className={'mb-0'} />
                <ButtonSave label={t('createWallet')} onClick={handleCreatePassword} />
            </form>
        </div>
    )
}

export default WalletCreate
