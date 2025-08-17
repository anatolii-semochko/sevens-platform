import React, { useState } from 'react'
import ShowPrivateKey from '@react/components/wallet/components/wallets-list/wallet-actions/ShowPrivateKey'
import WalletRename from '@react/components/wallet/components/wallets-list/wallet-actions/WalletRename'
import WalletRemove from '@react/components/wallet/components/wallets-list/wallet-actions/WalletRemove'
import { BlockTitle, WalletDetails } from '@react/components/wallet/components/form-elements/Blocks'
import {
    ButtonBack, ButtonShowPrivateKey, ButtonWalletRemove, ButtonWalletRename,
} from '@react/components/wallet/components/form-elements/Buttons'

const WalletActions = ({walletData, setShowWalletActions}) => {
    const [showWalletPrivateKey, setShowWalletPrivateKey] = useState(false)
    const [showWalletRename, setShowWalletRename] = useState(false)
    const [showWalletRemove, setShowWalletRemove] = useState(false)

    if (showWalletPrivateKey) return <ShowPrivateKey
        walletData={walletData}
        setShowWalletPrivateKey={setShowWalletPrivateKey}
    />
    if (showWalletRename) return <WalletRename
        walletData={walletData}
        setShowWalletRename={setShowWalletRename}
        setShowWalletActions={setShowWalletActions}
    />
    if (showWalletRemove) return <WalletRemove
        walletData={walletData}
        setShowWalletRemove={setShowWalletRemove}
        setShowWalletActions={setShowWalletActions}
    />

    return (
        <div>
            <BlockTitle title={'Single wallet actions'} />
            <div className="d-grid gap-3 mb-4">
                <WalletDetails walletData={walletData} className={'mb-0'}/>
                <ButtonShowPrivateKey onClick={() => setShowWalletPrivateKey(true)} />
                <ButtonWalletRename onClick={() => setShowWalletRename(true)} />
                <ButtonWalletRemove onClick={() => setShowWalletRemove(true)} />
                <ButtonBack onClick={() => setShowWalletActions(false)} />
            </div>
        </div>
    )
}

export default WalletActions
