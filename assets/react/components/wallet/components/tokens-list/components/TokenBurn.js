import React, { useEffect, useState } from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { ButtonBack, ButtonTokenBurn } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { reloadAllWallets, getWallet, burnToken } from '@react/components/wallet/scripts/apiActions'

const TokenBurn = ({ token, setBlockBurn, setTokenAvailable, setSuccessMessage }) => {
    const [errorMessage, setErrorMessage] = useState(null)
    const [confirmMessage, setConfirmMessage] = useState(null)
    const { setWalletsList, walletData, password } = useWalletContext()
    useEffect(() => {
        setConfirmMessage('Burning this token is irreversible.\nAre you sure you want to burn it?')
    }, [])

    const handlerBurnToken = async () => {
        setErrorMessage(null)
        setConfirmMessage(false)
        try {
            const wallet = getWallet(walletData, password)
            const transaction = await burnToken(token.mint, wallet)
            const updated = await reloadAllWallets(password)
            setTokenAvailable(false)
            setBlockBurn(false)
            setWalletsList(updated)
            setSuccessMessage(`Token has been successfully burned.\n Transaction ${transaction}.`)
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <>
            <ErrorMessageBlock message={errorMessage} className={'mb-0'} />
            <ErrorMessageBlock message={confirmMessage} className={'mb-0'} />
            <ButtonTokenBurn onClick={handlerBurnToken} />
            <ButtonBack label={'Cancel Token Transfer'} onClick={() => setBlockBurn(false)} />
        </>
    )
}

export default TokenBurn
