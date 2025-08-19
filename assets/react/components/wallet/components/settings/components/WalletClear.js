import React, { useState } from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { clearWallet } from '@react/components/wallet/scripts/storageActions'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonClearWallet } from '@react/components/wallet/components/form-elements/Buttons'
import { InfoMessageBlock } from '@react/components/wallet/components/form-elements/Messages'

const WalletClear = ({setShowWalletClear}) => {
    const {setWalletsList, setShowComponent} = useWalletContext()
    const [confirm, setConfirm] = useState(false)

    const handleWalletClear = async () => {
        if (!confirm) {
            return setConfirm(true)
        }
        clearWallet()
        setWalletsList([])
        setShowComponent(null)
        setShowWalletClear(false)
    }

    return (
        <div>
            <BlockTitle title={`Clear wallet all data`} className={'mb-4'}/>
            <div className="d-grid gap-3">
                <InfoMessageBlock
                    // TODO - CRATE CORRECT MESSAGE !!!
                    message={'This operation clears all wallet data! Be sure you have saved all wallets secrets!'}
                    className={'text-danger mb-0'}
                />
                {confirm && <InfoMessageBlock
                    // TODO - CRATE CORRECT MESSAGE !!!
                    message={'Are you sure to clear the wallet?'}
                    className={'text-danger mb-0'}
                />}
                <ButtonClearWallet onClick={() => handleWalletClear()} />
                <ButtonBack onClick={() => setShowWalletClear(false)} />
            </div>
        </div>
    )
}

export default WalletClear
