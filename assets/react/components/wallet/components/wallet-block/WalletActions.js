import React from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import WalletTranslation from '@react/components/wallet/components/form-elements/WalletTranslation'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getBlurredAddress } from '@react/components/wallet/scripts/utils'
import {
    ButtonBuyCoins,
    ButtonReloadWallet,
    ButtonReceiveCrypto,
    ButtonSendCoins,
} from '@react/components/wallet/components/form-elements/Buttons'

const WalletActions = ({walletData}) => {
    if (!walletData) return null

    const { hideBalances, setShowComponent } = useWalletContext()

    const balance = hideBalances ? '...' : <>
        {walletData?.balance ? walletData?.balance / LAMPORTS_PER_SOL : 0}
        <span className="fst-italic mx-2">$SEV</span>
    </>

    const tokens = hideBalances ? '...' : (walletData?.tokens?.length || 0)

    return (
        <>
            <div className="card">
                <h5 className="card-header">{walletData.name}</h5>
                <div className="card-body">
                    <table className="table table-borderless mb-0 w-75 mx-auto">
                        <tbody>
                            <tr>
                                <td><WalletTranslation text={'Address'} />:</td>
                                <td><b>{getBlurredAddress(walletData.publicKey)}</b></td>
                            </tr>
                            <tr>
                                <td><WalletTranslation text={'Balance'} />:</td>
                                <td><b>{balance}</b></td>
                            </tr>
                            <tr>
                                <td><WalletTranslation text={'Tokens'} />:</td>
                                <td><b>{tokens}</b></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="d-grid gap-3 mb-4">
                <ButtonReloadWallet />
                {!!walletData?.balance && <ButtonSendCoins onClick={() => setShowComponent({component: 'SendCoins'})}/>}
                <ButtonBuyCoins />
                <ButtonReceiveCrypto />
            </div>
        </>
    )
}

export default WalletActions
