import React, { useEffect, useState } from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { ButtonBack, ButtonTokenBurn } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { getWallet, burnSevensToken } from '@react/components/wallet/scripts/apiActions'

const TokenBurn = ({ token, setBlockBurn, setTokenAvailable, setSuccessMessage }) => {
    const {walletData, walletReload, password} = useWalletContext()
    const [errorMessage, setErrorMessage] = useState(null)
    const [confirmMessage, setConfirmMessage] = useState(null)
    const [confirm, setConfirm] = useState(null)

    const firstConfirmMessage = t('burnTokenWarning1')
    const secondConfirmMessage = t('burnTokenWarning2')

    useEffect(() => {
        setConfirmMessage(firstConfirmMessage)
    }, [])

    const handlerBurnToken = async () => {
        setErrorMessage(null)
        if (!confirm) {
            setConfirm(true)
            setConfirmMessage(secondConfirmMessage)
            return
        }
        setConfirmMessage(false)
        try {
            const wallet = getWallet(walletData, password)
            // TODO - add check what token is to burn and call "burnSevensToken" or "burnSPLToken"
            // TODO - don't show tokens in wallet which have been burned as standard SPL burn
            const transaction = await burnSevensToken(token.mint, wallet)
            setTokenAvailable(false)
            setBlockBurn(false)
            await walletReload()
            setSuccessMessage(t('tokenBurnSuccess').replace('{tx}', transaction))
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <>
            <ErrorMessageBlock message={errorMessage} className={'mb-0'} />
            <ErrorMessageBlock message={confirmMessage} className={'mb-0'} />
            <ButtonTokenBurn label={!confirm && t('confirmBurnYes')} onClick={handlerBurnToken} />
            <ButtonBack label={t('cancelTokenBurn')} onClick={() => setBlockBurn(false)} />
        </>
    )
}

export default TokenBurn
