import React from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { WalletDetails } from '@react/components/wallet/components/form-elements/Blocks'
import {
    ButtonReceiveCrypto, ButtonSendCoins,
    ButtonBuyCoins, ButtonSellCoins,
    ButtonReloadWallet, ButtonSettings,
} from '@react/components/wallet/components/form-elements/Buttons'

const Main = ({walletData}) => {
    if (!walletData) return null

    const { setShowComponent } = useWalletContext()

    return (
        <>
            <WalletDetails walletData={walletData}/>
            <div className="d-grid gap-3 mb-4">
                <ButtonReceiveCrypto />
                {!!walletData?.balance && <ButtonSendCoins onClick={() => setShowComponent({component: 'SendCoins'})}/>}
                <div className="d-grid gap-2 d-md-flex">
                    <ButtonBuyCoins />
                    <ButtonSellCoins />
                </div>
                <div className="d-grid gap-2 d-md-flex">
                    <ButtonReloadWallet />
                    <ButtonSettings onClick={() => setShowComponent({component: 'Settings'})} className={'w-50'}/>
                </div>
            </div>
        </>
    )
}

export default Main
