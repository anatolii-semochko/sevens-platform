import React from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { WalletDetails } from '@react/components/wallet/components/form-elements/Blocks'
import {
    ButtonReceiveCrypto, ButtonSendCoins, ButtonBuyCoins, ButtonSellCoins, ButtonReloadWallet,
} from '@react/components/wallet/components/form-elements/Buttons'

const Main = ({walletData}) => {
    if (!walletData) return null

    const { setShowComponent } = useWalletContext()

    return (
        <div className="d-grid gap-3 mb-4">
            <WalletDetails walletData={walletData} />
            <ButtonReloadWallet />
            <ButtonReceiveCrypto />
            <ButtonBuyCoins />
            {!!walletData?.balance && <>
                <ButtonSendCoins onClick={() => setShowComponent({component: 'SendCoins'})} />
                <ButtonSellCoins />
            </>}
        </div>
    )
}

export default Main
