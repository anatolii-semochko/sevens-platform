import React, { useEffect, useState } from 'react'
import MaterialSaleApi from '@react/api/materialSaleApi'
import { getDateTimeFromDate } from '@js/utils/time'
import { InnerTable } from '@react/components/create-token-material/components/token/Components'
import { ErrorMessageBlock } from '@react/components/info-componnents/Messages'
import { PriceHistoryChart } from '@react/components/info-componnents/token/PriceHistoryChart'

const materialSaleApi = new MaterialSaleApi()

export const TokenInfo = ({tokenData}) => {
    if (!tokenData) return

    return tokenData.error ? (
        <div className="alert-danger alert text-center text-break p-4">
            <h4>Token not found: {tokenData.error}.</h4>
        </div>
    ) : (
        <div className="alert-success alert text-center text-break p-4">
            <h4>Your token is valid in blockchain.</h4>
            <div className="d-flex justify-content-center">
                <InnerTable data={[
                    ['Container hash', tokenData.metadata.hash],
                    ['Token public key', tokenData.tokenPublicKey],
                    ['Wallet public key', tokenData.walletPublicKey],
                    ['Token name', tokenData.metadata.tokenName],
                    ['Token author', tokenData.metadata.author],
                    ['Token description', tokenData.metadata.description],
                    ['Token can be burned', tokenData.metadata.canBeBurned ? 'Yes' : 'No'],
                    ['Token on sale', tokenData.sale.priceSevens ? (tokenData.sale.priceSevens + ' $SEV') : 'No'],
                ]} />
            </div>
        </div>
    )
}

export const HistoryTable = ({tokenPublicKey, showChart}) => {
    const [history, setHistory] = useState([])
    const [errorMessage, setErrorMessage] = useState(null)

    useEffect(() => {
        setHistory([])
        if (tokenPublicKey) {
            materialSaleApi.getHistory(tokenPublicKey).then(setHistory).catch(setErrorMessage)
        }
    }, [tokenPublicKey]);

    const Info = (row, key) => row.price ?
        <span className="fw-bold">{row.price} <span className="fw-normal fst-italic mx-2">$SEV</span></span> :
        <span>{key && history[key - 1]?.wallet !== row.wallet ? <span className="text-danger fw-bold">SOLD</span> : 'Canceled'}</span>

    if (!tokenPublicKey || !history.length) {
        return
    }

    return (
        <div className="mt-4">
            <h4 className="text-center mb-4">Sales history</h4>
            {showChart && (
                <PriceHistoryChart history={history} />
            )}
            <table className="table mb-4">
                <tbody>
                {history.map((row, key) => (
                    <tr key={key}>
                        <td>{row.wallet}</td>
                        <td>{getDateTimeFromDate(row.date)}</td>
                        <td className="text-end">{Info(row, key)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            <ErrorMessageBlock message={errorMessage} />
        </div>
    )
}
