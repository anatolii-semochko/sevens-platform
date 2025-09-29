import React, { useEffect, useState } from 'react'
import bs58 from 'bs58'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { fetchNonce, validateNonce } from '@react/api/nodeApi'

export const WalletForm = ({type}) => {
    const wallet = useWallet()
    const [nonce, setNonce] = useState(null)

    // // TODO - Check if it is needed
    // Force connection check for Sevens Wallet
    useEffect(() => {
        if (wallet.wallet?.adapter?.name === 'Sevens Wallet' && !wallet.connected && !wallet.connecting) {
            const adapter = wallet.wallet.adapter
            console.log('🔍 [CreateMaterial] Sevens Wallet selected but not connected, forcing connection check')

            // TODO - Check if adapter has a wallet but React hasn't updated
            if (adapter._wallet && adapter._publicKey) {
                console.log('🔄 [CreateMaterial] Adapter has wallet, forcing connect call')
                setTimeout(() => {
                    wallet.connect().catch(console.error)
                }, 100)
            }
        }
    }, [wallet.wallet, wallet.connected, wallet.connecting, wallet.connect])

    const types = {
        createToken: {
            title: 'Creating a token requires using a wallet to store it and pay the transaction fee. Select and activate a wallet to mint the token.',
            signButton: false,
        },
        signMessage: {
            title: 'Publishing material requires signing the message to confirm ownership and verify that you own the token to avoid fraudulent publications. This operation does not require spending coins.',
            signButton: true,
        },
    }

    const getNonce = async () => {
        const derivedNonce = await fetchNonce(wallet.publicKey.toString())
        setNonce(derivedNonce)
    }

    useEffect(() => {
        if (wallet.publicKey) {
            getNonce().catch(error => console.log('Nonce has been not derived.', error))
        } else {
            setNonce(null)
        }
    }, [wallet.publicKey])

    const handleSign = async () => {
        try {
            if (!nonce) {
                console.error('No nonce available')
                return
            }

            const message = nonce.message
            const signedMessage = await wallet.signMessage(new TextEncoder().encode(message))

            // Convert signature to base58
            const signatureBase58 = bs58.encode(signedMessage)

            const response = await validateNonce(
                wallet.publicKey.toString(),
                signatureBase58,
                nonce.nonce
            )

            console.log('Nonce has been successfully validated.', response)
        } catch (error) {
            console.log('Error during signing process:', error)
        }
    }

    return (
        <div className="alert-success bg-light alert border text-center">
            <h4>Wallet</h4>
            <h6 className="lh-base mb-3">{types[type].title}</h6>
            {wallet.publicKey ? (
                <p className="text-success fw-semibold">{wallet.publicKey?.toString()}</p>
            ) : (
                <p className="text-danger">Wallet is not activated.</p>
            )}
            <div className="d-flex justify-content-center gap-2">
                <WalletMultiButton />
                {types[type].signButton && (
                    <button
                        className="btn btn-success py-2 px-4"
                        disabled={!wallet.publicKey || !nonce}
                        onClick={handleSign}
                    >
                        Sign
                    </button>
                )}
            </div>
        </div>
    )
}

export const MintedInfo = ({minted}) => minted && (
    <div className="alert-success alert text-break p-4">
        <h4 className="text-center">Congratulations !</h4>
        <p className="text-center">Your token has been successfully minted.</p>
        <div className="d-flex justify-content-center">
            <InnerTable data={[
                ['Token public key', minted.mint],
                ['Transaction signature', minted.signature],
            ]} />
        </div>
    </div>
)

export const ShowTokenValidity = ({container, tokenData}) => {
    if (!tokenData) return

    return tokenData.error ? (
        <div className="alert-danger alert text-center text-break p-4">
            <h4>Token not found for this files container.</h4>
            <InnerTable data={[
                ['File', container.file.name],
                ['Hash', container.hash],
            ]} />
        </div>
    ) : (
        <div className="alert-success alert text-center text-break p-4">
            <h4>Your container has been successfully checked in blockchain.</h4>
            <div className="d-flex justify-content-center">
                <InnerTable data={[
                    ['Container file', container.file.name],
                    ['Container hash', tokenData.metadata.hash],
                    ['Token public key', tokenData.tokenPublicKey],
                    ['Token name', tokenData.metadata.tokenName],
                    ['Token author', tokenData.metadata.author],
                    ['Token description', tokenData.metadata.description],
                    ['Token can be burned', tokenData.metadata.canBeBurned ? 'Yes' : 'No'],
                ]} />
            </div>
        </div>
    )
}

export const TryMoreOptions = ({minted, doMaterial, handlerClear}) => minted && !doMaterial && (
    <div className="d-flex flex-column align-items-center gap-2 text-center mb-3">
        <h6>You can try:</h6>
        <div className="d-flex flex-wrap justify-content-center gap-2">
            <button className="btn btn-primary">Check your token container</button>
            <button className="btn btn-primary" onClick={handlerClear}>Mint a new token</button>
            <button className="btn btn-primary">Publish material on site</button>
        </div>
    </div>
)

export const InnerTable = ({data}) => {
    const getValue = (value) => {
        if (Array.isArray(value) && value[1]) {
            return <span className={value[1]}>{value[0] || '-'}</span>
        }
        return value || '-'
    }

    return (
        <div className="d-flex justify-content-center">
            <table className="table-sm w-auto text-start">
                <tbody>
                {data.map((row, key) => (
                    <tr key={key}>
                        <td className="text-nowrap">{row[0]}:</td>
                        <td className="ps-3 fw-bold text-break">{getValue(row[1])}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}
