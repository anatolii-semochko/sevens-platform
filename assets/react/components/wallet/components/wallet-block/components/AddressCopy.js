import React from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import QRCode from 'react-qr-code'
import { copyToClipboard } from '@react/components/wallet/scripts/utils'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonCopy } from '@react/components/wallet/components/form-elements/Buttons'

const AddressCopy = () => {
    const { walletData, setShowComponent } = useWalletContext()
    const address = walletData.publicKey.toString()

    return (
        <div className="flex flex-col items-center text-center text-break">
            <BlockTitle title={'Receive crypto to this wallet'} className={'mb-4'}/>
            <QRCode className="mb-4" value={address} size={256} />
            <div className="mb-4 text-sm"><b>{address}</b></div>
            <ButtonCopy label={'Copy Address'} onClick={() => copyToClipboard(address)} className={' mb-3'} />
            <ButtonBack onClick={() => setShowComponent(null)} />
        </div>
    )
}

export default AddressCopy
