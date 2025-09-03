import React from 'react'
import { Input, TextArea } from '@react/components/form-elements/Inputs'

const TokenName = ({value, onChange, maxLength, error, setErrorMessage}) => (
    <div className="col-12 col-lg-6">
        <label htmlFor="tokenName" className="form-label">Token name:</label>
        <Input
            id="tokenName"
            placeholder="required"
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
    <div className="col-12 col-lg-6">
        <label htmlFor="tokenAuthor" className="form-label">Token author:</label>
        <Input
            id="tokenAuthor"
            placeholder="ptional"
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
    <div className="col-12">
        <label htmlFor="tokenAuthor" className="form-label">Token description:</label>
        <TextArea
            id="tokenDescription"
            placeholder="optional"
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
