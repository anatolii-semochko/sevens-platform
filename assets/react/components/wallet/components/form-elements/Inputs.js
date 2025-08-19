import React from 'react'
import config from '@react/components/wallet/config.json'
import { SUPPORTED_BITS, BIP_LENGTHS } from '@react/components/wallet/scripts/crypto'
import clsx from 'clsx'

const InputPassword = ({placeholder, password, setPassword, setErrorMessage}) => (
    <input
        type={'password'}
        className="form-control"
        placeholder={placeholder}
        value={password}
        onChange={(e) => {
            setPassword(e.target.value)
            setErrorMessage(null)
        }}
    />
)

const InputNewWalletName = ({walletName, setWalletName, setErrorMessage}) => (
    <div className="d-flex align-items-center">
        <label className="me-2 mb-0 text-nowrap">Wallet name: </label>
        <input
            className="form-control flex-grow-1"
            placeholder="New wallet name"
            value={walletName}
            maxLength={15}
            onChange={(e) => {
                setWalletName(e.target.value)
                setErrorMessage(null)
            }}
        />
    </div>
)

const SelectRecoveryType = ({type, setType, setErrorMessage, TYPE_PHRASE, TYPE_PRIVATE_KEY, TYPE_SEED}) => (
    <div className="row mb-1">
        <div className="col-2 mt-2">From: </div>
        <div className="col-10">
            <select
                className="form-control"
                value={type}
                onChange={(e) => {
                    setType(e.target.value)
                    setErrorMessage(null)
                }}>
                <option value={TYPE_PHRASE}>Recovery Phrase</option>
                <option value={TYPE_PRIVATE_KEY}>Private Key</option>
                <option value={TYPE_SEED}>Seed</option>
            </select>
        </div>
    </div>
)

const SelectPhraseLength = ({value, onChange, className}) => (
    <div className={clsx('d-flex align-items-center', className)}>
        <label className="me-2 mb-0 text-nowrap">Phrase length: </label>
        <select
            id="mnemonic-length"
            className="form-select flex-grow-1 mb-1"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
        >
            {SUPPORTED_BITS.map((bits) => (
                <option key={bits} value={bits}>
                    {BIP_LENGTHS[bits]} words
                </option>
            ))}
        </select>
    </div>
)

const SelectConnection = ({value, onChange, className}) => {
    // TODO - Add to translations
    const netLabels = {
        "main": "Main NET (original)",
        "dev": "Dev NET (testing and development)",
        "local": "Local NET (local environment)",
        "custom": "Custom NET (advanced option)",
    }

    return (
        <select
            id="select-connection"
            className={clsx('form-select', className)}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {Object.keys(config.CONNECTION_ENDPOINTS).map(key => (
                <option key={key} value={key}>
                    {netLabels[key]}
                </option>
            ))}
        </select>
    )
}

const InputConnection = ({value, onChange, disabled, className}) => (
    <input
        id="input-connection"
        className={clsx('form-control', className)}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
    />
)

export {
    InputPassword,
    InputNewWalletName, SelectRecoveryType, SelectPhraseLength, 
    SelectConnection, InputConnection, 
}
