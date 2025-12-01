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
                <h4>Checking container error - {tokenData.error}</h4>
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

    const tokenInfo = [
        ['Wallet public key', tokenData.walletPublicKey],
        ['Token public key', tokenData.tokenPublicKey],
        ['Token name', tokenData.metadata.tokenName],
        ['Token author', tokenData.metadata.author],
        ['Token description', tokenData.metadata.description],
        ['Token hash', tokenData.metadata.hash],
        ['Token can be burned', tokenData.metadata.canBeBurned ? 'Yes' : 'No'],
        ['Token on sale', tokenData.sale.price ? 'Yes' : 'No'],
        ['Token minting time', getDateTimeFromDate(tokenData.mintingTime)],
    ]

    return (
        <div className="alert-success alert text-center text-break p-4">
            <h3 className="mb-3">{label || 'Your token is valid in the blockchain.'}</h3>
            {!!text && (
                <p className="text-center">{text}</p>
            )}
            <div className="d-flex justify-content-center">
                <InnerTable data={[...containerInfo, ...tokenInfo]} />
            </div>
        </div>
    )
}

export const HistoryTable = ({tokenPublicKey, showChart, showTable, showWallet}) => {
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

    const event = (row, key) => {
        const previousRow = key > 0 ? history[key - 1] : null
        if (!row.price) {
            if (previousRow && previousRow.wallet !== row.wallet) {
                return 'Purchase'
            }
            return 'Sale canceled'
        }
        if (!previousRow || previousRow.wallet !== row.wallet) {
            return 'Listed for sale'
        }
        if (previousRow.price) {
            if (row.price > previousRow.price) {
                return 'Price increased'
            } else if (row.price < previousRow.price) {
                return 'Price decreased'
            } else {
                return 'Price updated'
            }
        }
        return 'Listed for sale'
    }

    return (
        <div className="mt-4">
            <h4 className="text-center mb-4">Sales history</h4>
            {showChart && (
                <PriceHistoryChart history={history} />
            )}
            {showTable && (
                <table className="table mb-4">
                    <thead>
                    <tr>
                        <th>Date</th>
                        {showWallet && (
                            <th>Wallet</th>
                        )}
                        <th>Operation</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {history.map((row, key) => (
                        <tr key={key}>
                            <td>{getDateTimeFromDate(row.date)}</td>
                            {showWallet && (
                                <td className="text-break">{row.wallet}</td>
                            )}
                            <td>{event(row, key)}</td>
                            <td className="text-end">{Info(row, key)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
            <ErrorMessageBlock message={errorMessage} />
        </div>
    )
}
