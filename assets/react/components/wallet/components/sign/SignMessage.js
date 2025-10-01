import React, { useState } from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { getWallet } from '@react/components/wallet/scripts/apiActions'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'

const SignMessage = ({ message, onSign, onCancel }) => {
    const [isSigning, setIsSigning] = useState(false)
    const [signingError, setSigningError] = useState(null)

    const { walletData, password } = useWalletContext()

    const handleSignMessage = async () => {
        try {
            setIsSigning(true)
            setSigningError(null)

            const wallet = getWallet(walletData, password)
            const signature = await wallet.signMessage(message)

            if (onSign) {
                onSign(signature)
            }
        } catch (error) {
            console.error('Message signing failed:', error)
            setSigningError(`Signing failed: ${error.message}`)
        } finally {
            setIsSigning(false)
        }
    }

    const handleCancel = () => {
        if (onCancel) {
            onCancel()
        }
    }

    if (!message) {
        return (
            <div>
                <BlockTitle title="Sign Message" className={'mb-4'}/>
                <div className="alert alert-warning">
                    No message provided
                </div>
            </div>
        )
    }

    // Convert message from Uint8Array to string if needed
    let messageText = message
    if (message instanceof Uint8Array) {
        messageText = new TextDecoder().decode(message)
    }

    return (
        <div>
            <BlockTitle title="Sign Message" className={'mb-4'}/>

            {signingError && (
                <div className="alert alert-danger">
                    <strong>Signing Error:</strong> {signingError}
                </div>
            )}

            <div className={'d-grid gap-3'}>
                {/* Message Content */}
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

                {/* Wallet Information */}
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
                            <div className="col-sm-8">
                                <code className="small">{walletData?.publicKey || 'N/A'}</code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={handleCancel}
                        disabled={isSigning}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSignMessage}
                        disabled={isSigning}
                    >
                        {isSigning ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </span>
                                Signing...
                            </>
                        ) : (
                            'Sign Message'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SignMessage
