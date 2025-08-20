import React, { useState } from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import WalletClear from '@react/components/wallet/components/settings/components/WalletClear'
import CurrentLanguage from '@react/components/wallet/components/settings/components/CurrentLanguage'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import {
    ButtonBack, ButtonBalancesVisibility, ButtonChangeConnection,
    ButtonChangePassword, ButtonClearWallet,
} from '@react/components/wallet/components/form-elements/Buttons'

const Settings = () => {
    // const {} = useWalletContext()
    const [showWalletClear, setShowWalletClear] = useState(false)

    if (showWalletClear) return <WalletClear setShowWalletClear={setShowWalletClear}/>
    
    return (
        <div>
            <BlockTitle title={'Wallet Settings'} className={'mb-4'}/>
            <div className={'d-grid gap-3'}>
                <CurrentLanguage />
                <ButtonChangeConnection />
                <ButtonBalancesVisibility />
                <ButtonChangePassword />
                <ButtonClearWallet onClick={() => setShowWalletClear(true)}/>
                <ButtonBack />
            </div>
        </div>
    )
}

export default Settings
