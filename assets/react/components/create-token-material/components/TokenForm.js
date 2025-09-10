import React, { useEffect, useState } from 'react'
import { sevensIdl } from '@js/blockchain/sevens-token'
import { Input, TextArea, Select } from '@react/components/form-elements/Inputs'

const Name = ({name, setName, nameMaxLength, error, setErrorMessage}) => (
    <div className="col-12 col-lg-4">
        <label htmlFor="tokenName" className="form-label">Token name:</label>
        <Input
            id={'tokenName'}
            placeholder={'required'}
            maxLength={nameMaxLength}
            required={true}
            value={name}
            onChange={setName}
            setErrorMessage={setErrorMessage}
        />
        {error && <div className="invalid-feedback">Invalid</div>}
    </div>
)

const Author = ({author, setAuthor, authorMaxLength, error, setErrorMessage}) => (
    <div className="col-12 col-lg-4">
        <label htmlFor="tokenAuthor" className="form-label">Token author:</label>
        <Input
            id={'tokenAuthor'}
            placeholder={'optional'}
            maxLength={authorMaxLength}
            required={true}
            value={author}
            onChange={setAuthor}
            setErrorMessage={setErrorMessage}
        />
        {error && <div className="invalid-feedback">Invalid</div>}
    </div>
)

const Burnable = ({burnable, setBurnable, error, setErrorMessage}) => (
    <div className="col-12 col-lg-4">
        <label htmlFor="tokenAuthor" className="form-label">Burnable:</label>
        <Select
            id={'tokenBurnable'}
            required={true}
            value={burnable}
            options={[{
                value: 0,
                label: 'No (eternal)',
            }, {
                value: 1,
                label: 'Yes (can be burned)',
            }]}
            onChange={setBurnable}
            setErrorMessage={setErrorMessage}
        />
        {error && <div className="invalid-feedback">Invalid</div>}
    </div>
)

const Description = ({description, setDescription, descriptionMaxLength, error, setErrorMessage}) => (
    <div className="col-12">
        <label htmlFor="tokenDescription" className="form-label">Token description:</label>
        <TextArea
            id={'tokenDescription'}
            placeholder={'optional'}
            maxLength={descriptionMaxLength}
            rows={3}
            value={description}
            onChange={setDescription}
            setErrorMessage={setErrorMessage}
        />
        {error && <div className="invalid-feedback">Invalid</div>}
    </div>
)

export const TokenForm = ({tokenData, setTokenData, setErrorMessage}) => {
    const [name, setName] = useState('')
    const [author, setAuthor] = useState('')
    const [burnable, setBurnable] = useState(false)
    const [description, setDescription] = useState('')

    // TODO - take values from sevens IDL
    // console.log({sevensIdl})
    const nameMaxLength = 32
    const authorMaxLength = 32
    const descriptionMaxLength = 128

    useEffect(() => {
        setName(tokenData?.name || '')
        setAuthor(tokenData?.author || '')
        setBurnable(tokenData?.burnable || false)
        setDescription(tokenData?.description || '')
    }, [tokenData])

    useEffect(() => {
        setTokenData({name, author, burnable, description})
    }, [name, author, burnable, description])

    return (
        <div className="mb-3">
            <div className="row g-3 mb-3">
                <Name {...{name, setName, nameMaxLength, setErrorMessage}} />
                <Author {...{author, setAuthor, authorMaxLength, setErrorMessage}} />
                <Burnable {...{burnable, setBurnable, setErrorMessage}} />
            </div>
            <div className="row g-3">
                <Description {...{description, setDescription, descriptionMaxLength, setErrorMessage}} />
            </div>
        </div>
    )
}
