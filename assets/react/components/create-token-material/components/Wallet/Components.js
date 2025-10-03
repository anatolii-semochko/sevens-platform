import React, { useEffect, useState } from 'react'
import bs58 from 'bs58'
import { fetchNonce } from '@react/api/nodeApi'
import { useWallet } from '@solana/wallet-adapter-react'
import { getAnchorErrorText } from '@js/blockchain/sevens'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'




// TODO - investigate connection issues and fix them
// Force connection check for Sevens Wallet
const walletConnection = (wallet) => {
    if (wallet.wallet?.adapter?.name === 'Sevens Wallet' && !wallet.connected && !wallet.connecting) {
        const adapter = wallet.wallet.adapter
        console.log('🔍 Sevens Wallet selected but not connected, forcing connection check')

        // TODO - Check if adapter has a wallet but React hasn't updated
        if (adapter._wallet && adapter._publicKey) {
            console.log('🔄 Adapter has wallet, forcing connect call')
            setTimeout(() => {
                wallet.connect().catch(console.error)
            }, 100)
        }
    }
}




export const WalletMintForm = () => {
    const wallet = useWallet()

    useEffect(() => {
        walletConnection(wallet)
    }, [wallet.wallet, wallet.connected, wallet.connecting, wallet.connect])

    return (
        <div className="alert-success bg-light alert border text-center">
            <h4>Wallet</h4>
            <h6 className="mb-3">
                Creating a token requires using a wallet to store it and pay the transaction fee.
                Select and activate a wallet to mint the token.
            </h6>
            {wallet.publicKey ? (
                <p className="text-success fw-semibold">{wallet.publicKey?.toString()}</p>
            ) : (
                <p className="text-danger">Wallet is not activated.</p>
            )}
            <WalletMultiButton />
        </div>
    )
}

export const WalletCheckForm = ({tokenData, walletSignature, setWalletSignature}) => {
    const wallet = useWallet()
    const [walletPublicKey, setWalletPublicKey] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    useEffect(() => {
        walletConnection(wallet)
    }, [wallet.wallet, wallet.connected, wallet.connecting, wallet.connect])

    useEffect(() => {
        setWalletPublicKey(wallet.publicKey?.toString())
        setWalletSignature(null)
    }, [wallet.publicKey])

    const handleSign = async () => {
        try {
            setWalletSignature(null)
            setErrorMessage(null)

            const derivedNonce = await fetchNonce(walletPublicKey)
            const signature = await wallet.signMessage(new TextEncoder().encode(derivedNonce.message))

            setWalletSignature({
                walletPublicKey,
                signature: bs58.encode(signature),
                ...derivedNonce,
            })
        } catch (error) {
            setErrorMessage(getAnchorErrorText(error))
        }
    }

    const PublicKeyText = ({walletPublicKey, tokenData}) => {
        if (!walletPublicKey) return (
            <p className="text-danger">Wallet is not activated.</p>
        )

        if (walletPublicKey !== tokenData.walletPublicKey) return (
            <div className="text-danger">
                <p className="fw-semibold">{walletPublicKey}</p>
                <p>
                    The wallet address does not match the token owner's public address. Expected wallet:
                    <span className="text-primary fw-semibold ms-2">{tokenData.walletPublicKey}</span>
                </p>
            </div>
        )

        return (
            <p className="text-success fw-semibold">{walletPublicKey}</p>
        )
    }

    const SignatureText = ({walletPublicKey, walletSignature}) => !!walletPublicKey && (walletSignature ? (
        <p className="text-success fw-semibold">{walletSignature.signature}</p>
    ) : (
        <p className="text-danger">Waiting wallet signature</p>
    ))

    const ErrorText = ({errorMessage}) => !!errorMessage && (
        <p className="text-danger">{errorMessage}</p>
    )

    return (
        <div className="alert-success bg-light alert border text-center">
            <h4>Wallet</h4>
            <h6 className="lh-base mb-3">
                Publishing material requires signing the message to confirm ownership and verify that you own the token
                to avoid fraudulent publications. This operation does not require spending coins.
            </h6>
            <PublicKeyText {...{walletPublicKey, tokenData}} />
            <SignatureText {...{walletPublicKey, walletSignature}} />
            <ErrorText errorMessage={errorMessage} />
            <div className="d-flex justify-content-center gap-2">
                <WalletMultiButton />
                <button className="btn btn-success py-2 px-4" disabled={!walletPublicKey} onClick={handleSign}>
                    Sign
                </button>
            </div>
        </div>
    )
}
