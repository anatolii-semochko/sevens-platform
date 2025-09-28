import React, { useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export const WalletForm = () => {
    const wallet = useWallet()

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
