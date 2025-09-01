import React, { useState } from 'react'
import { sevensIdl } from '@js/blockchain/sevens-token'
import { TokenAuthor, TokenDescription, TokenName } from '@react/components/create-material/components/FormElements'
import { ImagesBlock } from '@react/components/create-material/components/ImagesBlock'
import { MessagesBlock } from '@react/components/form-elements/Messages'

const CreateMaterial = () => {
    const [tokenName, setTokenName] = useState('')
    const [tokenAuthor, setTokenAuthor] = useState('')
    const [tokenImages, setTokenImages] = useState([])
    const [tokenDescription, setTokenDescription] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)

    console.log({sevensIdl})
    const tokenNameMaxLength = 5
    const tokenAuthorMaxLength = 5
    const tokenDescriptionMaxLength = 5

    return (
        <div className="flex flex-col items-center">
            <div className="w-50">
                <h1 className="mb-5">Create Material</h1>
                <TokenName value={tokenName} onChange={setTokenName} maxLength={tokenNameMaxLength} setErrorMessage={setErrorMessage} />
                <TokenAuthor value={tokenAuthor} onChange={setTokenAuthor} maxLength={tokenAuthorMaxLength} setErrorMessage={setErrorMessage}/>
                <ImagesBlock tokenImages={tokenImages} setTokenImages={setTokenImages}/>
                <TokenDescription value={tokenDescription} onChange={setTokenDescription} maxLength={tokenDescriptionMaxLength} setErrorMessage={setErrorMessage}/>
                <MessagesBlock error={errorMessage} />
            </div>
        </div>
    )
}

export default CreateMaterial
