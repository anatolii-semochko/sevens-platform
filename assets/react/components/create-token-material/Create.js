import React, { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { SevensWalletAdapter } from '@react/components/wallet/WalletAdapter'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { CreateTokenMaterial } from '@react/components/create-token-material/CreateTokenMaterial'
import { CreateMaterialFromToken } from '@react/components/create-token-material/CreateMaterialFromToken'

const PRIVATE_TOKEN = 'private-token'
const TOKEN_MATERIAL = 'token-material'
const MATERIAL_FROM_TOKEN = 'material-from-token'

const Create = ({type}) => {
    const endpoint = process.env.ANCHOR_PROVIDER_URL
    const wallets = useMemo(() => [
        new SevensWalletAdapter(),
        new PhantomWalletAdapter()
    ], [])

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect={false}>
                <WalletModalProvider>
                    {type === MATERIAL_FROM_TOKEN ? (
                        <CreateMaterialFromToken />
                    ) : (
                        <CreateTokenMaterial doMaterial={type === TOKEN_MATERIAL} />
                    )}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}

export default Create
