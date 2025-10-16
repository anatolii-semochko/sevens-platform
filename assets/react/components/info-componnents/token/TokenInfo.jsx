import React, { useEffect, useState } from 'react'
import MaterialSaleApi from '@react/api/materialSaleApi'
import { getDateTimeFromDate } from '@js/utils/time'
import { InnerTable } from '@react/components/info-componnents/TableComponents'
import { ErrorMessageBlock } from '@react/components/info-componnents/Messages'
import { PriceHistoryChart } from '@react/components/info-componnents/token/PriceHistoryChart'
import { prettyBytes } from '@js/utils/file'

const materialSaleApi = new MaterialSaleApi()

export const TokenInfo = ({container, tokenData, label, text}) => {
    if (!tokenData) return

    if (tokenData.error && container) {
        const data = []
        if (container.file?.name) data.push(['File', container.file.name])
        if (container.file?.size) data.push(['Size', prettyBytes(container.file.size)])
        if (container.hash) data.push(['Hash', container.hash])

        return (
            <div className="alert-danger alert text-center text-break p-4">
                <h4>Token not found for this files container: {tokenData.error}</h4>
                <InnerTable data={data} />
            </div>
        )
    }

    if (tokenData.error) return (
        <div className="alert-danger alert text-center text-break p-4">
            <h4 className="mb-0">Error: {tokenData.error}.</h4>
        </div>
    )

    const containerInfo = []
    if (container?.file?.name) containerInfo.push(['Container name', container.file.name])
    if (container?.file?.size) containerInfo.push(['Container size', prettyBytes(container.file.size)])
    if (container?.hash) containerInfo.push(['Container hash', container.hash])
    if (tokenData?.signature) containerInfo.push(['Transaction signature', tokenData.signature])

    const tokenInfo = [
        ['Wallet public key', tokenData.walletPublicKey],
        ['Token public key', tokenData.tokenPublicKey],
        ['Token name', tokenData.metadata.tokenName],
        ['Token author', tokenData.metadata.author],
        ['Token description', tokenData.metadata.description],
        ['Token hash', tokenData.metadata.hash],
        ['Token can be burned', tokenData.metadata.canBeBurned ? 'Yes' : 'No'],
        ['Token on sale', tokenData.sale.priceSevens ? (tokenData.sale.priceSevens + ' $SEV') : 'No'],
        ['Token minting time', getDateTimeFromDate(tokenData.mintingTime)],
    ]

    return (
        <div className="alert-success alert text-center text-break p-4">
            <h3 className="mb-3">{label || 'Your token is valid in blockchain.'}</h3>
            {!!text && (
                <p className="text-center">{text}</p>
            )}
            <div className="d-flex justify-content-center">
                <InnerTable data={[...containerInfo, ...tokenInfo]} />
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
