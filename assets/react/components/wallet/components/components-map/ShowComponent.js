import React from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import AddWallet from '@react/components/wallet/components/wallets-block/AddWallet'
import RenameWallet from '@react/components/wallet/components/wallets-block/menu/RenameWallet'
import RemoveWallet from '@react/components/wallet/components/wallets-block/menu/RemoveWallet'
import AddressCopy from '@react/components/wallet/components/wallet-block/AddressCopy'
import ShowPrivateKey from '@react/components/wallet/components/wallets-block/menu/ShowPrivateKey'
import SendCoins from '@react/components/wallet/components/wallet-block/SendCoins'
import Token from '@react/components/wallet/components/tokens-block/Token'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'

const componentsMap = {
    AddWallet,
    RenameWallet,
    RemoveWallet,
    AddressCopy,
    ShowPrivateKey,
    SendCoins,
    Token,
}

const ShowComponent = () => {
    const { showComponent } = useWalletContext()
    const ComponentToRender = componentsMap[showComponent.component] || null
    const props = showComponent.props || {}

    return (
        <div className="d-grid gap-3">
            {props.componentLabel?.split('\n').map((line, idx) => (
                <h6 className="text-center mb-0" key={idx}>{line}</h6>
            ))}
            {ComponentToRender ? <ComponentToRender {...props} /> : null}
            <ErrorMessageBlock message={props.errorMessage} />
        </div>
    )
}

export default ShowComponent
