import React, { useRef, useState } from 'react'
import { sevensIdl } from '@js/blockchain/sevens-token'
import { TokenAuthor, TokenDescription, TokenName } from '@react/components/create-material/components/FormElements'
import { CreateContainer } from '@react/components/create-material/components/CreateContainer'
import { removeContainer } from '@react/components/create-material/components/create-container/utils'
import { MessagesBlock } from '@react/components/form-elements/Messages'

const CreateMaterial = () => {
    const targetRef = useRef(null)
    const [tokenFiles, setTokenFiles] = useState([])
    const [container, setContainer] = useState(null) // { name, where: 'savePicker'|'downloads' }
    const [isCompressing, setIsCompressing] = useState(false)
    const [tokenName, setTokenName] = useState('')
    const [tokenAuthor, setTokenAuthor] = useState('')
    const [tokenDescription, setTokenDescription] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)

    console.log({sevensIdl})
    const tokenNameMaxLength = 5
    const tokenAuthorMaxLength = 5
    const tokenDescriptionMaxLength = 5

    const handlerChangeFiles = () => {
        removeContainer(container, targetRef, setTokenFiles, setContainer).catch(e => setErrorMessage(e.message))
    }

    const handlerClear = () => {
        handlerChangeFiles()
        setTokenFiles([])
        setTokenName('')
        setTokenAuthor('')
        setTokenDescription('')
    }

    const handlerCreateToken = () => {
        console.log('Create Token')
    }

    return (
        <div className="row justify-content-center mb-3">
            <div className="col-12 col-lg-6">
                <h1 className="mb-2 text-center">Create Material</h1>
                <CreateContainer
                    items={tokenFiles}
                    setItems={setTokenFiles}
                    container={container}
                    setContainer={setContainer}
                    targetRef={targetRef}
                    isCompressing={isCompressing}
                    setIsCompressing={setIsCompressing}
                />
                {!!container && !isCompressing && (
                    <>
                        <div className="row g-3 mb-3">
                            <TokenName value={tokenName} onChange={setTokenName} maxLength={tokenNameMaxLength} setErrorMessage={setErrorMessage}/>
                            <TokenAuthor value={tokenAuthor} onChange={setTokenAuthor} maxLength={tokenAuthorMaxLength} setErrorMessage={setErrorMessage}/>
                        </div>
                        <div className="row g-3">
                            <TokenDescription value={tokenDescription} onChange={setTokenDescription} maxLength={tokenDescriptionMaxLength} setErrorMessage={setErrorMessage}/>
                        </div>
                        <MessagesBlock error={errorMessage}/>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button className="btn btn-outline-primary" onClick={handlerChangeFiles}>Change files</button>
                            <button className="btn btn-outline-primary" onClick={handlerClear}>Clear</button>
                            <button className="btn btn-success" onClick={handlerCreateToken}>Create Token</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default CreateMaterial
