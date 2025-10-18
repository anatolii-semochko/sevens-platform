import React from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { wallets } from '@react/components/form-elements/WalletForm'
import { CreateTokenMaterial } from '@react/components/create-token-material/CreateTokenMaterial'
import { CreateMaterialFromToken } from '@react/components/create-token-material/CreateMaterialFromToken'

const PRIVATE_TOKEN = 'private-token'
const TOKEN_MATERIAL = 'token-material'
const MATERIAL_FROM_TOKEN = 'material-from-token'

const Create = ({type}) => (
    <ConnectionProvider endpoint={process.env.ANCHOR_PROVIDER_URL}>
        <WalletProvider wallets={wallets} autoConnect={true}>
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

export default Create
