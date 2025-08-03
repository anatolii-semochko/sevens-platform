import React from 'react'
import { showModal } from '@js/modal'
import Translation from '@react/components/translation-help/Translation'

class Wallet extends React.Component {
    render() {
        return (
            <div>
                <h1>Wallet</h1>
            </div>
        );
    }
}

const WalletButton = () =>
    <button className="btn btn-info ms-2" onClick={() => showModal({
        id: 'wallet',
        title: 'Wallet',
        body: 'Wallet body.',
        size: 'lg',
    })}>
        <Translation text={'Wallet'} />
    </button>

export { Wallet, WalletButton }
