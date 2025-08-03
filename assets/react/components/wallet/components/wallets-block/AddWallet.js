import React, { useState, useEffect } from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import {
    ButtonGenerateNewWallet,
    ButtonRestoreWalletFromSeed,
    ButtonAddWallet, ButtonBack,
} from '@react/components/wallet/components/form-elements/Buttons'
import RestoreWallet from '@react/components/wallet/components/wallets-block/restore/RestoreWallet'
import GenerateWallet from '@react/components/wallet/components/wallets-block/generate/GenerateWallet'
import { getNextWalletName, checkWalletName } from '@react/components/wallet/scripts/utils'
import { MessagesBlock } from '@react/components/wallet/components/form-elements/Messages'
import { addWallet, reloadAllWallets } from '@react/components/wallet/scripts/apiAction'
import { InputNewWalletName } from '@react/components/wallet/components/wallets-block/components/AddWalletComponents'

const AddWallet = () => {
    const [showBlockGenerateWallet, setShowBlockGenerateWallet] = useState(false)
    const [showBlockRestoreWallet, setShowBlockRestoreWallet] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [walletName, setWalletName] = useState('')
    const [mnemonic, setMnemonic] = useState('')
    const { walletsList, setWalletsList, password, setWalletIndex, setShowComponent } = useWalletContext()

    useEffect(() => {
        setWalletName(getNextWalletName(walletsList))
    }, [walletsList])

    const handlerAddWallet = async () => {
        try {
            checkWalletName(walletsList, walletName)
            addWallet(walletName, mnemonic.join(' '), password)
                .then(() => reloadAllWallets()
                    .then(setWalletsList).catch(error => setErrorMessage(error.message))
                    .then(() => setWalletIndex(walletsList.length)).catch(error => setErrorMessage(error.message))
                ).catch(error => setErrorMessage(error.message))
            setShowComponent(null)
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    if (showBlockGenerateWallet) return <GenerateWallet
        setShowBlockGenerateWallet={setShowBlockGenerateWallet}
        setMnemonic={setMnemonic}
    />
    if (showBlockRestoreWallet) return <RestoreWallet setShowBlockRestoreWallet={setShowBlockRestoreWallet} />

    return (
        <div className="d-grid gap-3 pt-1">
            <h6 className="d-flex justify-content-center mb-0">Add New Wallet</h6>
            <MessagesBlock error={errorMessage} className={'mb-0'}/>
            {mnemonic ? <>
                <InputNewWalletName
                    walletName={walletName}
                    setWalletName={setWalletName}
                    setErrorMessage={setErrorMessage}
                />
                <ButtonAddWallet onClick={() => handlerAddWallet()} className={'mt-1'}/>
            </> : <>
                <ButtonGenerateNewWallet onClick={() => setShowBlockGenerateWallet(true)} />
                <ButtonRestoreWalletFromSeed onClick={() => setShowBlockRestoreWallet(true)} />
            </>}
            <ButtonBack />
        </div>
    )
}

export default AddWallet
