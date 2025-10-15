import React, { useEffect } from 'react'
import bs58 from 'bs58'
import { useWallet } from '@solana/wallet-adapter-react'
import { fetchNonce } from '@react/api/nodeApi'
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








const texts = {
    mint: 'Creating a token requires using a wallet to store it and pay the transaction fee. Select and activate a wallet to mint the token.',
    publish: 'Publishing material requires signing the message to confirm ownership and verify that you own the token to avoid fraudulent publications. This operation does not require spending coins.',
    claim: 'Claiming material requires signing the message to confirm ownership and verify that you own the token to avoid fraudulent publications. This operation does not require spending coins.',
    sale: "Listing a token for sale, canceling a sale, or changing the price you need to send a transaction to the blockchain. You need to sign it with the wallet that owns the token. Each transaction requires a blockchain fee — the amount will be displayed in the wallet before it's signed.",
}

export const signNonce = async (wallet) => {
    const walletPublicKey = wallet.publicKey.toString()
    const derivedNonce = await fetchNonce(walletPublicKey)
    const signature = await wallet.signMessage(new TextEncoder().encode(derivedNonce.message))

    return {
        walletPublicKey,
        signature: bs58.encode(signature),
        ...derivedNonce,
    }
}

const PublicKeyText = ({wallet, expectedPublicKey}) => {
    const publicKey = wallet.publicKey?.toString()

    if (!publicKey) return (
        <p className="text-danger">Wallet is not activated.</p>
    )

    if (expectedPublicKey && publicKey !== expectedPublicKey) return (
        <div className="text-danger">
            <p className="fw-semibold">{publicKey}</p>
            <p>
                This wallet address does not match the token owner's public address. Expected wallet:
                <span className="text-primary fw-semibold ms-2">{expectedPublicKey}</span>
            </p>
        </div>
    )

    return (
        <p className="text-success fw-semibold">{publicKey}</p>
    )
}

const SignatureText = ({waitingSignature}) => waitingSignature && (
    <p className="text-danger">Waiting wallet signature</p>
)

const ErrorText = ({error}) => !!error && (
    <p className="text-danger">{error.message || error}</p>
)

export const WalletForm = ({operation, error, expectedPublicKey, waitingSignature}) => {
    const wallet = useWallet()

    useEffect(() => {
        walletConnection(wallet)
    }, [wallet.wallet, wallet.connected, wallet.connecting, wallet.connect])

    return (
        <div className="alert-success bg-light alert border text-center">
            <h4>Wallet</h4>
            <h6 className="lh-base mb-3">{texts[operation]}</h6>
            <PublicKeyText {...{wallet, expectedPublicKey}} />
            <SignatureText waitingSignature={waitingSignature} />
            <ErrorText error={error} />
            <div className="d-flex justify-content-center gap-2">
                <WalletMultiButton />
            </div>
        </div>
    )
}










// TODO - to remove
const WaitingSignatureText = ({publicKey}) => !!publicKey && (
    <p className="text-danger">Waiting wallet signature</p>
)

export const WalletSaleToken = ({operation, expectedPublicKey, error}) => {
    const wallet = useWallet()
    const publicKey = () => wallet?.publicKey?.toString()

    useEffect(() => {
        walletConnection(wallet)
    }, [wallet.wallet, wallet.connected, wallet.connecting, wallet.connect])

    return (
        <div className="alert-success bg-light alert border text-center">
            <h3>Wallet</h3>
            <h6 className="lh-base mb-3">{texts[operation]}</h6>
            <PublicKeyText {...{wallet, expectedPublicKey}} />
            <WaitingSignatureText publicKey={publicKey()} />
            <ErrorText error={error} />
            <div className="d-flex justify-content-center gap-2">
                <WalletMultiButton />
            </div>
        </div>
    )
}
