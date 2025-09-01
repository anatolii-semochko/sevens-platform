import React from 'react'
import { Input, TextArea } from '@react/components/form-elements/Inputs'

const TokenName = ({value, onChange, maxLength, error, setErrorMessage}) => (
    <div className="mb-3">
        <label htmlFor="tokenName" className="form-label">Token name:</label>
        <Input
            id="tokenName"
            placeholder="Token name"
            maxLength={maxLength}
            required={true}
            value={value}
            onChange={onChange}
            setErrorMessage={setErrorMessage}
        />
        {error && <div className="invalid-feedback">Invalid</div>}
    </div>
)

const TokenAuthor = ({value, onChange, maxLength, error, setErrorMessage}) => (
    <div className="mb-3">
        <label htmlFor="tokenAuthor" className="form-label">Token author:</label>
        <Input
            id="tokenAuthor"
            placeholder="Token author"
            maxLength={maxLength}
            required={true}
            value={value}
            onChange={onChange}
            setErrorMessage={setErrorMessage}
        />
        {error && <div className="invalid-feedback">Invalid</div>}
    </div>
)

const TokenDescription = ({value, onChange, maxLength, error, setErrorMessage}) => (
    <div className="mb-3">
        <label htmlFor="tokenAuthor" className="form-label">Token description:</label>
        <TextArea
            id="tokenDescription"
            placeholder="Token Description"
            maxLength={maxLength}
            rows={5}
            value={value}
            onChange={onChange}
            setErrorMessage={setErrorMessage}
        />
        {error && <div className="invalid-feedback">Invalid</div>}
    </div>
)

export { TokenName, TokenAuthor, TokenDescription }
