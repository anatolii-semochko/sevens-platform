import React, { useEffect, useState } from 'react'
import { t } from '@react/components/wallet/translations/translations'
import { getKeyFromPrivateKey } from '@react/components/wallet/scripts/crypto'
import { capitalizeFirstLetter } from '@react/components/wallet/scripts/utils'
import { ButtonContinue } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'

const RestoreByPrivateKey = ({setKp}) => {
    const [privateKey, setPrivateKey] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)
    useEffect(() => {
        setKp(null)
    }, [])

    const checkWallet = async () => {
        setErrorMessage(null)
        try {
            const kp = getKeyFromPrivateKey(privateKey)
            setKp(kp)
        } catch (error) {
            setErrorMessage(capitalizeFirstLetter(error.message))
        }
    }

    return (
        <>
            <textarea
                className="form-control mb-1"
                placeholder={t('privateKey64')}
                rows={3}
                value={privateKey}
                onChange={(e) => {
                    setPrivateKey(e.target.value.trim())
                    setErrorMessage(null)
                }}
            />
            <ErrorMessageBlock message={errorMessage} className={'mb-1'} />
            {privateKey && <ButtonContinue onClick={() => checkWallet()} />}
        </>
    )
}

export default RestoreByPrivateKey
