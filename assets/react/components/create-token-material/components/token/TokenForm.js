import React, { useEffect, useState } from 'react'
import { sevensIdl } from '@js/utils/blockchain'
import { Input, TextArea, Select } from '@react/components/form-elements/Inputs'

const Name = ({name, setName, maxLength, error, setErrorMessage}) => (
    <div className="col-12 col-lg-4">
        <label htmlFor="tokenName" className="form-label">Token name:</label>
        <Input
            id={'tokenName'}
            placeholder={'required'}
            maxLength={maxLength}
            required={true}
            value={name}
            onChange={setName}
            setErrorMessage={setErrorMessage}
        />
        {error && <div className="invalid-feedback">Invalid</div>}
    </div>
)

const Author = ({author, setAuthor, maxLength, error, setErrorMessage}) => (
    <div className="col-12 col-lg-4">
        <label htmlFor="tokenAuthor" className="form-label">Token author:</label>
        <Input
            id={'tokenAuthor'}
            placeholder={'optional'}
            maxLength={maxLength}
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

const Description = ({description, setDescription, maxLength, error, setErrorMessage}) => (
    <div className="col-12">
        <label htmlFor="tokenDescription" className="form-label">Token description:</label>
        <TextArea
            id={'tokenDescription'}
            placeholder={'optional'}
            maxLength={maxLength}
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
    const [lengths, setLengths] = useState({})

    useEffect(() => {
        const lengthConstants = {}
        sevensIdl.constants.map(constant => {
            if (constant.name === 'MAX_TOKEN_NAME_LENGTH') lengthConstants.name = constant.value
            if (constant.name === 'MAX_AUTHOR_LENGTH') lengthConstants.author = constant.value
            if (constant.name === 'MAX_DESCRIPTION_LENGTH') lengthConstants.description = constant.value
        })
        setLengths(lengthConstants)
    }, [])

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
        <div className="mb-4">
            <div className="row g-3 mb-3">
                <Name {...{name, setName, maxLength: lengths.name, setErrorMessage}} />
                <Author {...{author, setAuthor, maxLength: lengths.author, setErrorMessage}} />
                <Burnable {...{burnable, setBurnable, setErrorMessage}} />
            </div>
            <div className="row g-3">
                <Description {...{description, setDescription, maxLength: lengths.description, setErrorMessage}} />
            </div>
        </div>
    )
}
