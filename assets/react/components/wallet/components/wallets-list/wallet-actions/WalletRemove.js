import React, { useState } from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { removeWallet } from '@react/components/wallet/scripts/apiActions'
import { BlockTitle, WalletDetails } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonWalletRemove } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock, InfoMessageBlock } from '@react/components/wallet/components/form-elements/Messages'

const WalletRemove = ({walletData, setShowWalletRemove, setShowWalletActions}) => {
    const {walletReload, password} = useWalletContext()
    const [confirm, setConfirm] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    const handleRemoveWallet = async () => {
        setErrorMessage(null)
        if (!confirm) {
            return setConfirm(true)
        }
        try {
            removeWallet(walletData.publicKey, password)
                .then(async () => await walletReload())
                .catch(error => setErrorMessage(error.message))
            setShowWalletActions(false)
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <div>
            <BlockTitle title={t('removeWalletTitle').replace('{name}', walletData.name)} className={'mb-4'}/>
            <div className="d-grid gap-3">
                <WalletDetails walletData={walletData} className={'mb-0'} />
                {confirm && <InfoMessageBlock
                    message={t('walletRemoveConfirm')}
                    className={'text-danger mb-0'}
                />}
                <ErrorMessageBlock message={errorMessage} className={'mb-0'} />
                <ButtonWalletRemove onClick={() => handleRemoveWallet()} />
                <ButtonBack onClick={() => setShowWalletRemove(false)} />
            </div>
        </div>
    )
}
export default WalletRemove
