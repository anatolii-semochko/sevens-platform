import React from 'react'
import { Number } from '@react/components/form-elements/Inputs'
import { ButtonWithProcessing } from '@react/components/form-elements/Buttons'
import { $Sevens, $Usd } from '@react/components/info-componnents/Currency'

export const SaleForm = ({
    price,
    currentPrice,
    setPrice,
    retailPrice,
    currentRetailPrice,
    setRetailPrice,
    tariffBuy,
    setError,
    busy,
    round,
}) => (
    <div className="d-flex justify-content-center">
        <table className="align-middle mb-3">
            <tbody>
            <tr>
                {!!currentPrice && (
                    <td>Current token price: <$Sevens sevens={currentPrice} label color bold /></td>
                )}
                <td className="text-end ps-5 pe-3">
                    <label htmlFor="material-price-1" className="col-form-label">
                        {currentPrice ? 'New token Price' : 'Token price'}:
                    </label>
                </td>
                <td className="pe-2">
                    <Number
                        id="material-price-1"
                        type="number"
                        placeholder="Enter price in SOL (e.g., 1.5)"
                        value={price}
                        min={0}
                        max={1000000000}
                        maxDecimals={9}
                        disabled={busy()}
                        onChange={v => {
                            if (v === '' || v === null || v === undefined) {
                                setPrice('')
                                setRetailPrice('')
                                return
                            }
                            const value = parseFloat(v)
                            if (!isNaN(value) && value >= 0) {
                                setPrice(value)
                                setRetailPrice(round(value * (1 + tariffBuy / 100)))
                            }
                        }}
                        setErrorMessage={setError}
                    />
                </td>
                <td>$SEV <span className="ms-2">(<$Usd sevens={price} label color bold />)</span></td>
            </tr>
            {(!!tariffBuy || (currentPrice && currentRetailPrice && (currentPrice !== currentRetailPrice))) && (
                <tr>
                    {!!currentPrice && (
                        <td>Current retail price: <$Sevens sevens={currentRetailPrice} label color bold /></td>
                    )}
                    <td className="text-end ps-5 pe-3">
                        <label htmlFor="material-price-2" className="col-form-label">
                            {currentPrice ? 'New retail Price' : 'Retail price'}:
                        </label>
                    </td>
                    <td className="pe-2">
                        <Number
                            id="material-price-2"
                            type="number"
                            placeholder="Enter price in SOL (e.g., 1.5)"
                            value={retailPrice}
                            min={0}
                            max={1000000000}
                            maxDecimals={9}
                            disabled={busy()}
                            onChange={v => {
                                if (v === '' || v === null || v === undefined) {
                                    setRetailPrice('')
                                    setPrice('')
                                    return
                                }
                                const value = parseFloat(v)
                                if (!isNaN(value) && value >= 0) {
                                    setRetailPrice(value)
                                    const calculatedPrice = value / (1 + tariffBuy / 100)
                                    setPrice(round(calculatedPrice))
                                }
                            }}
                            setErrorMessage={setError}
                        />
                    </td>
                    <td>$SEV <span className="ms-2">(<$Usd sevens={retailPrice} label color bold />)</span></td>
                </tr>
            )}
            </tbody>
        </table>
    </div>
)

export const SaleMessage = ({type, price, retailPrice}) => {
    const text = type === 'sale'
        ? `Put the token up for sale at ${price} $SEV` + (retailPrice !== price ? ` (Retail price ${retailPrice} $SEV)` : '')
        : 'Remove a token from sale'

    return (
        <h4 className="text-center mb-4">{text}</h4>
    )
}

export const SaleActions = ({tokenData, setType, price, currentPrice, setError}) => (
    <div className="row justify-content-center align-items-center mb-4">
        {!!tokenData.sale.price && (
            <div className="col-6">
                <ButtonWithProcessing
                    className={'btn-primary w-100'}
                    label={'Cancel token sale'}
                    onClick={() => {
                        setType('cancel')
                        setError(null)
                    }}
                />
            </div>
        )}
        <div className={tokenData.sale.price ? 'col-6' : 'col-12'}>
            <ButtonWithProcessing
                className={'btn-success w-100'}
                label={'Set token for sale'}
                disabled={price === currentPrice}
                onClick={() => {
                    setType('sale')
                    setError(null)
                }}
            />
        </div>
    </div>
)

export const SignActions = ({type, waitingSignature, busy, handleCancel, handleSetSale}) => (
    <div className="row justify-content-center align-items-center mb-4">
        <div className="col-6">
            <ButtonWithProcessing
                className={'btn-danger w-100'}
                label={'Cancel'}
                onClick={handleCancel}
            />
        </div>
        <div className="col-6">
            <ButtonWithProcessing
                className={'btn-success w-100'}
                label={type === 'sale' ? 'Sign sale token transaction' : 'Sign cancel sale token transaction'}
                processingLabel={waitingSignature ? 'Waiting signature...' : 'Processing...'}
                processing={busy()}
                disabled={busy()}
                onClick={handleSetSale}
            />
        </div>
    </div>
)

export const ButtonBack = ({setMaterialForm, busy}) => (
    <button className="btn btn-primary w-100" onClick={() => setMaterialForm(null)} disabled={busy()}>
        Back
    </button>
)
