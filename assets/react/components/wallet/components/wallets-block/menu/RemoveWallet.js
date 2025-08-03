import React, { useState } from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { ButtonBack, ButtonRemove } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock, InfoMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { reloadAllWallets, removeWallet } from '@react/components/wallet/scripts/apiAction'

const RemoveWallet = ({walletData}) => {
    const [errorMessage, setErrorMessage] = useState(null)
    const { setWalletsList, setShowComponent } = useWalletContext()

    const attention = `This operation removes wallet ${walletData.name} from you list !!!` +
        'Are you sure you want to remove this wallet ?'

    const handleRemoveWallet = async () => {
        try {
            removeWallet(walletData.publicKey)
                .then(async () => reloadAllWallets()
                    .then(setWalletsList)
                    .catch(error => setErrorMessage(error.message))
                )
                .catch(error => setErrorMessage(error.message))
            setShowComponent(null)
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <>
            <InfoMessageBlock message={attention} className="text-danger mb-0"/>
            <ErrorMessageBlock message={errorMessage} className="mb-0"/>
            <ButtonRemove onClick={handleRemoveWallet} />
            <ButtonBack />
        </>
    )
}

export default RemoveWallet
