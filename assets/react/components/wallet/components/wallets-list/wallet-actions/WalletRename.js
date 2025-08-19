import React, { useState } from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { reloadAllWallets, renameWallet } from '@react/components/wallet/scripts/apiActions'
import { checkWalletName } from '@react/components/wallet/scripts/utils'
import { BlockTitle, WalletDetails } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonWalletRename } from '@react/components/wallet/components/form-elements/Buttons'
import { InputNewWalletName } from '@react/components/wallet/components/form-elements/Inputs'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'

const WalletRename = ({walletData, setShowWalletRename, setShowWalletActions}) => {
    const {walletsList, setWalletsList, password} = useWalletContext()
    const [walletName, setWalletName] = useState(walletData.name)
    const [errorMessage, setErrorMessage] = useState(null)

    const handleRenameWallet = async () => {
        setErrorMessage(null)
        try {
            if (walletName === walletData.name) {
                return setShowWalletRename(false)
            }
            checkWalletName(walletsList, walletName)
            renameWallet(walletData.publicKey, walletName, password)
                .then(async () => reloadAllWallets(password)
                    .then(setWalletsList)
                    .catch(error => setErrorMessage(error.message))
                )
                .catch(error => setErrorMessage(error.message))
            setShowWalletActions(false)
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <div>
            <BlockTitle title={`Rename Wallet ${walletData.name}`} className={'mb-4'} />
            <div className="d-grid gap-3">
                <WalletDetails walletData={walletData} className={'mb-0'} />
                <InputNewWalletName
                    walletName={walletName}
                    setWalletName={setWalletName}
                    setErrorMessage={setErrorMessage}
                />
                <ErrorMessageBlock message={errorMessage} className={'mb-0'} />
                <ButtonWalletRename onClick={() => handleRenameWallet()} />
                <ButtonBack onClick={() => setShowWalletRename(false)} />
            </div>
        </div>
    )
}

export default WalletRename
