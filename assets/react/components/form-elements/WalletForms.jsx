import React, {useEffect, useState} from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {fetchNonce} from "@react/api/nodeApi";
import bs58 from "bs58";
import {getAnchorErrorText} from "@js/blockchain/sevens";




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





const PublicKeyText = ({publicKey, expectedPublicKey}) => {
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

const WaitingSignatureText = ({publicKey}) => !!publicKey && (
    <p className="text-danger">Waiting wallet signature</p>
)

const ErrorText = ({error}) => !!error && (
    <p className="text-danger">{error.message || error}</p>
)

export const WalletSaleToken = ({expectedPublicKey, error}) => {
    const wallet = useWallet()
    const publicKey = () => wallet?.publicKey?.toString()

    useEffect(() => {
        walletConnection(wallet)
    }, [wallet.wallet, wallet.connected, wallet.connecting, wallet.connect])

    return (
        <div className="alert-success bg-light alert border text-center">
            <h3>Wallet</h3>
            <h6 className="lh-base mb-3">
                Listing a token for sale, canceling a sale, or changing the price you need to send a transaction to the
                blockchain. You need to sign it with the wallet that owns the token. Each transaction requires a
                blockchain fee — the amount will be displayed in the wallet before it's signed.
            </h6>
            <PublicKeyText {...{publicKey: publicKey(), expectedPublicKey}} />
            <WaitingSignatureText publicKey={publicKey()} />
            <ErrorText error={error} />
            <div className="d-flex justify-content-center gap-2">
                <WalletMultiButton />
            </div>
        </div>
    )
}

// export const WalletBuyToken = () => {
//     const wallet = useWallet()
//     const publicKey = () => wallet?.publicKey?.toString()
//
//     useEffect(() => {
//         walletConnection(wallet)
//     }, [wallet.wallet, wallet.connected, wallet.connecting, wallet.connect])
//
//     return (
//         <div className="alert-success bg-light alert border text-center">
//             <h4>Wallet</h4>
//             <h6 className="lh-base mb-3">
//                 Listing a token for sale, canceling a sale, or changing the price you need to send a transaction to the
//                 blockchain. You need to sign it with the wallet that owns the token. Each transaction requires a
//                 blockchain fee — the amount will be displayed in the wallet before it's signed.
//             </h6>
//             <PublicKeyText {...{publicKey: publicKey(), expectedPublicKey}} />
//             <WaitingSignatureText publicKey={publicKey()} />
//             <div className="d-flex justify-content-center gap-2">
//                 <WalletMultiButton />
//             </div>
//         </div>
//     )
// }















export const WalletClaimMaterialsForm = ({walletSignature, setWalletSignature}) => {
    const wallet = useWallet()
    const [walletPublicKey, setWalletPublicKey] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    useEffect(() => {
        walletConnection(wallet)
    }, [wallet.wallet, wallet.connected, wallet.connecting, wallet.connect])

    useEffect(() => {
        setWalletPublicKey(wallet.publicKey?.toString())
        setWalletSignature(null)
        setErrorMessage(null)
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


    const SignatureText = ({walletPublicKey, walletSignature}) => !!walletPublicKey && (walletSignature ? (
        <p className="text-success fw-semibold">{walletSignature.signature}</p>
    ) : (
        <p className="text-danger">Waiting wallet signature</p>
    ))

    return (
        <div className="alert-success bg-light alert border text-center">
            <h4>Wallet</h4>
            <h6 className="lh-base mb-3">
                Publishing material requires signing the message to confirm ownership and verify that you own the token
                to avoid fraudulent publications. This operation does not require spending coins.
            </h6>
            <PublicKeyText publicKey={wallet.publicKey?.toString()} />
            <SignatureText {...{walletPublicKey, walletSignature}} />
            <ErrorText errorMessage={errorMessage} />
            <div className="d-flex justify-content-center gap-2">
                <WalletMultiButton />
                <button
                    className="btn btn-success py-2 px-4"
                    disabled={!walletPublicKey}
                    onClick={handleSign}
                >
                    Sign
                </button>
            </div>
        </div>
    )
}
