import React, { useState } from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { ButtonBack, ButtonSave } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { reloadAllWallets, renameWallet } from '@react/components/wallet/scripts/apiAction'

const RenameWallet = ({walletData}) => {
    const [newWalletName, setNewWalletName] = useState(walletData?.name ? walletData.name : '')
    const [errorMessage, setErrorMessage] = useState(null)
    const { setWalletsList, setShowComponent } = useWalletContext()

    const handleSaveWalletName = () => {
        renameWallet(walletData.publicKey, newWalletName)
            .then(async () => reloadAllWallets()
                .then(setWalletsList)
                .catch(error => setErrorMessage(error.message))
            )
            .catch(error => setErrorMessage(error.message))
        setShowComponent(null)
    }

    return (
        <>
            <input
                className="form-control"
                placeholder="New wallet name"
                value={newWalletName}
                maxLength={15}
                onChange={(e) => {
                    setNewWalletName(e.target.value)
                    setErrorMessage(null)
                }}
            />
            <ErrorMessageBlock message={errorMessage} />
            <ButtonSave onClick={handleSaveWalletName} />
            <ButtonBack />
        </>
    )
}

export default RenameWallet
