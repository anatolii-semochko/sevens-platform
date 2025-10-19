import React from 'react'
import bs58 from 'bs58'
import { useWallet } from '@solana/wallet-adapter-react'
import { fetchNonce } from '@react/api/nodeApi'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'










export const wallets = [
    // new SevensWalletAdapter(),
    // new PhantomWalletAdapter()
]

const texts = {
    mint: 'Creating a token requires using a wallet to store it and pay the transaction fee. Select and activate a wallet to mint the token.',
    publish: 'Publishing material requires signing the message to confirm ownership and verify that you own the token to avoid fraudulent publications. This operation does not require spending coins.',
    claim: 'Claiming material requires signing the message to confirm ownership and verify that you own the token to avoid fraudulent publications. This operation does not require spending coins.',
    sale: "Listing a token for sale, canceling a sale, or changing the price you need to send a transaction to the blockchain. You need to sign it with the wallet that owns the token. Each transaction requires a blockchain fee — the amount will be displayed in the wallet before it's signed.",
    buy: "To purchase a token, you need to activate your wallet and sign the transaction. You'll see the expected coin spend amount before signing the transaction."
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
            <div className="alert-danger alert text-center text-break pt-4">
                <h6>This wallet address does not match the token owner's public address.</h6>
                <h5 className="p-2">Expected wallet:</h5>
                <span className="text-primary fw-semibold ms-2">{expectedPublicKey}</span>
            </div>
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


// export const BuyToken = ({root, token, isMyMaterial}) => (
//     <ConnectionProvider endpoint={process.env.ANCHOR_PROVIDER_URL}>
//         <WalletProvider wallets={wallets} autoConnect={true}>
//             <WalletModalProvider>
//                 <BuyTokenInner tokenPublicKey={token} root={root} isMyMaterial={isMyMaterial} />
//             </WalletModalProvider>
//         </WalletProvider>
//     </ConnectionProvider>
// )
