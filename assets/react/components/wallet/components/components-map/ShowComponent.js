import React from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import WalletsList from '@react/components/wallet/components/wallets-list/WalletsList'
import AddWallet from '@react/components/wallet/components/wallet-add/AddWallet'
import AddressCopy from '@react/components/wallet/components/wallet-block/components/AddressCopy'
import SendCoins from '@react/components/wallet/components/wallet-block/components/SendCoins'
import Token from '@react/components/wallet/components/tokens-list/Token'
import Settings from '@react/components/wallet/components/settings/Settings'
import SettingsConnection from '@react/components/wallet/components/settings/components/SettingsConnection'
import ChangePassword from '@react/components/wallet/components/settings/components/ChangePassword'
import WalletClear from '@react/components/wallet/components/settings/components/WalletClear'
import SignTransaction from '@react/components/wallet/components/sign-transaction/SignTransaction'

const componentsMap = {
    WalletsList,
    AddWallet,
    AddressCopy,
    SendCoins,
    Token,
    Settings,
    SettingsConnection,
    ChangePassword,
    WalletClear,
    SignTransaction,
}

const ShowComponent = () => {
    const { showComponent } = useWalletContext()
    const ComponentToRender = componentsMap[showComponent.component] || null
    const props = showComponent.props || {}

    return (
        <div className="d-grid gap-3">
            {ComponentToRender ? <ComponentToRender {...props} /> : null}
        </div>
    )
}

export default ShowComponent
