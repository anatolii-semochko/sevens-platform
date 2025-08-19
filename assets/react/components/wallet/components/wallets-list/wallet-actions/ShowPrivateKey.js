import React, { useState } from 'react'
import { getAllSecrets } from '@react/components/wallet/scripts/crypto'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { BlockTitle, SecretsView } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonConfirm } from '@react/components/wallet/components/form-elements/Buttons'
import { InputPassword } from '@react/components/wallet/components/form-elements/Inputs'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'

const ShowPrivateKey = ({walletData, setShowWalletPrivateKey}) => {
    const [secretsPassword, setSecretsPassword] = useState('')
    const [secrets, setSecrets] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)
    const { password } = useWalletContext()

    const attention = 'Your private key and recovery phrase are highly sensitive information. ' +
        'Anyone who has them can access and spend your funds. Keep them offline and never share with anyone.'

    const handleShowSecrets = async () => {
        try {
            if (secretsPassword !== password) {
                return setErrorMessage('Invalid password')
            }
            const secrets = await getAllSecrets(walletData, secretsPassword)
            setSecrets(secrets)
        } catch (error) {
            setErrorMessage(errorMessage)
        }
    }

    return (
        <div>
            <BlockTitle title={`Show wallet private key`} className={'mb-4'}/>
            <div className={'d-grid gap-3'}>
                <ErrorMessageBlock message={attention} className="text-danger mb-0"/>
                {secrets ? (
                    <SecretsView secrets={secrets} />
                ) : (
                    <>
                        <InputPassword
                            placeholder={'Wallet password'}
                            password={secretsPassword}
                            setPassword={setSecretsPassword}
                            setErrorMessage={setErrorMessage}
                        />
                        <ErrorMessageBlock message={errorMessage} className="mb-0"/>
                        <ButtonConfirm onClick={() => handleShowSecrets()} />
                    </>
                )}
                <ButtonBack onClick={() => setShowWalletPrivateKey(false)}/>
            </div>
        </div>
    )
}

export default ShowPrivateKey
