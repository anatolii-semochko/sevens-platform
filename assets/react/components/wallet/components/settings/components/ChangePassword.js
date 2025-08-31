import React, { useState } from 'react'
import config from '@react/components/wallet/config.json'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { changePassword } from '@react/components/wallet/scripts/storageActions'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { InputPassword } from '@react/components/wallet/components/form-elements/Inputs'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { ButtonBack, ButtonChangePassword, ButtonConfirm } from '@react/components/wallet/components/form-elements/Buttons'

const ChangePassword = () => {
    const {password, setUnlocked, setPassword, setShowComponent} = useWalletContext()
    const [currentPassword, setCurrentPassword] = useState('')
    const [currentPasswordConfirmed, setCurrentPasswordConfirmed] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)

    const checkPassword = () => {
        if (!newPassword || newPassword.length < config.PASSWORD_MIN_LENGTH) {
            throw new Error(t('passwordTooShort').replace('{n}', config.PASSWORD_MIN_LENGTH))
        }
        if (newPassword !== newPasswordConfirm) {
            throw new Error(t('passwordsDontMatch'))
        }
    }

    const handlerCurrentPasswordConfirm = (value) => {
        setErrorMessage(null)
        if (currentPassword === password) {
            setCurrentPasswordConfirmed(true)
        } else {
            setCurrentPassword('')
            setErrorMessage(t('invalidPassword'))
        }
    }

    const handlerSaveNewPassword = async () => {
        setErrorMessage(null)
        try {
            checkPassword()
            await changePassword(currentPassword, newPassword)
            setUnlocked(false)
            setPassword('')
            setShowComponent(null)
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <div>
            <BlockTitle title={t('changePassword')} className={'mb-4'}/>
            <div className={'d-grid gap-3'}>
                {!currentPasswordConfirmed ? <>
                    <InputPassword
                        placeholder={t('currentPassword')}
                        password={currentPassword}
                        setPassword={setCurrentPassword}
                        setErrorMessage={setErrorMessage}
                    />
                    <ErrorMessageBlock message={errorMessage} className={'mb-0'}/>
                    <ButtonConfirm onClick={() => handlerCurrentPasswordConfirm()}/>
                </> : <>
                    <InputPassword
                        placeholder={t('newPassword')}
                        password={newPassword}
                        setPassword={setNewPassword}
                        setErrorMessage={setErrorMessage}
                    />
                    <InputPassword
                        placeholder={t('repeatPassword')}
                        password={newPasswordConfirm}
                        setPassword={setNewPasswordConfirm}
                        setErrorMessage={setErrorMessage}
                    />
                    <ErrorMessageBlock message={errorMessage} className={'mb-0'}/>
                    <ButtonChangePassword onClick={() => handlerSaveNewPassword()}/>
                </>}
                <ButtonBack onClick={() => setShowComponent({component: 'Settings'})}/>
            </div>
        </div>
    )
}

export default ChangePassword
