import React, { useState } from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { getWallet } from '@react/components/wallet/scripts/apiActions'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonCancelSign, ButtonSign } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'

const SignMessage = ({ message, onSign, onCancel }) => {
    const { walletData, password, setShowComponent } = useWalletContext()
    const [error, setError] = useState(null)

    const handleSignMessage = async () => {
        try {
            setError(null)
            const wallet = getWallet(walletData, password)
            const signature = await wallet.signMessage(message)
            onSign(signature)
        } catch (error) {
            setError(error)
        } finally {
            setShowComponent(null)
        }
    }

    const handleCancel = () => {
        onCancel()
        setShowComponent(null)
    }

    if (!message) {
        return <NoMessage />
    }

    return (
        <div>
            <BlockTitle title={t('signMessage')} className={'mb-4'}/>
            <div className={'d-grid gap-3'}>
                <MessageContent message={message} />
                <WalletInformation walletData={walletData} />
                <ErrorMessageBlock message={error} className={'mb-0'} />
                <div className="d-flex gap-2">
                    <ButtonCancelSign onClick={handleCancel} />
                    <ButtonSign label={t('signMessage')} onClick={handleSignMessage} disabled={error} />
                </div>
            </div>
        </div>
    )
}

const NoMessage = () => (
    <div>
        <BlockTitle title={t('signMessage')} className={'mb-4'}/>
        <div className="alert alert-warning">No message provided</div>
    </div>
)

const MessageContent = ({message}) => {
    let messageText = message
    if (message instanceof Uint8Array) {
        messageText = new TextDecoder().decode(message)
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="text-center">Message to Sign</div>
            </div>
            <div className="card-body card-body alert alert-info mb-0">
                <div className="mb-3">
                    <strong>You are about to sign the following message:</strong>
                </div>
                {messageText.split("\n").map((phrase, key) => (
                    <div key={key} className="mb-3 text-wrap small">{phrase}</div>
                ))}
                <div className="text-muted small">
                    <strong className="me-2">Note:</strong>
                    This operation will not spend any coins. It only proves that you own the wallet address.
                </div>
            </div>
        </div>
    )
}

const WalletInformation = ({walletData}) => (
    <div className="card">
        <div className="card-header">
            <h6 className="mb-0">Wallet Information</h6>
        </div>
        <div className="card-body">
            <div className="row mb-2">
                <div className="col-sm-4"><strong>Wallet:</strong></div>
                <div className="col-sm-8">{walletData?.name || 'Unknown'}</div>
            </div>
            <div className="row">
                <div className="col-sm-4"><strong>Address:</strong></div>
                <div className="col-sm-8 small text-primary">{walletData?.publicKey || 'N/A'}</div>
            </div>
        </div>
    </div>
)

export default SignMessage
