import React from 'react'
import { WalletWrapper } from '@react/components/form-elements/WalletForm'
import { CreateTokenMaterial } from '@react/components/create-token-material/CreateTokenMaterial'
import { CreateMaterialFromToken } from '@react/components/create-token-material/CreateMaterialFromToken'

const PRIVATE_TOKEN = 'private-token'
const TOKEN_MATERIAL = 'token-material'
const MATERIAL_FROM_TOKEN = 'material-from-token'

const Create = ({type}) => (
    <WalletWrapper>
        {type === MATERIAL_FROM_TOKEN ? (
            <CreateMaterialFromToken />
        ) : (
            <CreateTokenMaterial doMaterial={type === TOKEN_MATERIAL} />
        )}
    </WalletWrapper>
)

export default Create
