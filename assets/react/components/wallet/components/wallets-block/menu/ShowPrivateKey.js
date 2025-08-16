import React, { useState } from 'react'
import WalletTranslation from '@react/components/wallet/components/form-elements/WalletTranslation'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { ButtonBack, ButtonConfirm, ButtonCopy } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { getAllSecrets } from '@react/components/wallet/scripts/crypto'
import { copyToClipboard } from '@react/components/wallet/scripts/utils'

const ShowPrivateKey = ({walletData}) => {
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
        <>
            <ErrorMessageBlock message={attention} className="text-danger mb-0"/>
            {secrets ? <>
                <div className="text-center small d-md-block h6 my-2 mb-3">
                    <WalletTranslation text="Recovery Phrase"/>
                    <hr className="my-2"/>
                    <div className="d-grid gap-2">
                        <div className="row g-2 mb-2">
                            {secrets.mnemonic?.split(' ').map((word, i) => (
                                <div className="col-4" key={`choice-${i}`}>
                                    <button className="btn w-100">{word}</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <ButtonCopy
                        label={'Copy Recovery Phrase'}
                        onClick={() => copyToClipboard(secrets.mnemonic)}
                        className={'mb-3'}
                    />
                </div>
                <div className="text-center small d-md-block h6 my-2 mb-3">
                    <WalletTranslation text="64-byte Private Key (base58)"/>
                    <hr className="my-2"/>
                    <p className="text-break">{secrets.secretKey.base58}</p>
                    <ButtonCopy
                        label={'Copy Private Key'}
                        onClick={() => copyToClipboard(secrets.seed.base58)}
                        className={'mb-3'}
                    />
                </div>
                <div className="text-center small d-md-block h6 my-2 mb-3">
                    <WalletTranslation text="32-byte Seed (base58)"/>
                    <hr className="my-2"/>
                    <p className="text-break">{secrets.seed.base58}</p>
                    <ButtonCopy
                        label={'Copy Seed'}
                        onClick={() => copyToClipboard(secrets.secretKey.base58)}
                        className={'mb-3'}
                    />
                </div>
            </> : <>
                <input
                    className="form-control"
                    placeholder="Wallet password"
                    value={secretsPassword}
                    onChange={(e) => {
                        setSecretsPassword(e.target.value)
                        setErrorMessage(null)
                    }}
                />
                <ErrorMessageBlock message={errorMessage} className="mb-0"/>
                <ButtonConfirm onClick={() => handleShowSecrets()} />
            </>}
            <ButtonBack />
        </>
    )
}

export default ShowPrivateKey
