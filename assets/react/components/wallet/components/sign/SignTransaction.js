import React, { useState, useEffect } from 'react'
import clsx from 'clsx'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { connection, getWallet } from '@react/components/wallet/scripts/apiActions'
import { simulateAndSummarize } from '@react/components/wallet/scripts/simulate'
import { BlockTitle, AmountInfo } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonCancelSign, ButtonSign } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'

const SignTransaction = ({ transaction, onSign, onCancel }) => {
    const {walletData, password, setShowComponent} = useWalletContext()
    const [simulationData, setSimulationData] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (transaction) {
            simulateTransaction().catch(setError)
        }
    }, [transaction])

    const simulateTransaction = async () => {
        try {
            setError(null)
            const result = await simulateAndSummarize(connection(), transaction)
            setSimulationData(result)
            if (!result.ok) {
                setError(result.error)
            }
        } catch (error) {
            setError(error)
        }
    }

    const handleSignTransaction = async () => {
        try {
            setError(null)
            const wallet = getWallet(walletData, password)
            const signedTransaction = await wallet.signTransaction(transaction)
            onSign(signedTransaction)
        } catch (error) {
            setError(error)
        } finally {
            setShowComponent(null)
        }
    }

    const handleCancel = () => {
        onCancel()
        setShowComponent(null)
    }

    if (!transaction) {
        return <NoTransaction />
    }

    return (
        <div>
            <BlockTitle title={t('signTransaction')} className={'mb-4'} />
            <SimulatingTransaction simulationData={simulationData} />
            {simulationData && (
                <div className={'d-grid gap-3'}>
                    <TransactionSummary simulationData={simulationData} />
                    <CoinsTransfer simulationData={simulationData} />
                    <TokenOperations simulationData={simulationData} />
                    <AmountInfo
                        label={'Total to spend'}
                        amount={simulationData.pay?.totalCost}
                        isSpending={true}
                        hide={!!error}
                    />
                    <ErrorMessageBlock message={error} className={'mb-0'} />
                    <div className="d-flex gap-2">
                        <ButtonCancelSign onClick={handleCancel} />
                        <ButtonSign
                            label={t('signTransaction')}
                            onClick={handleSignTransaction}
                            disabled={!simulationData.ok || error}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

const NoTransaction = () => (
    <div>
        <BlockTitle title={t('signTransaction')} className={'mb-4'} />
        <div className="alert alert-warning">No transaction provided</div>
    </div>
)

const SimulatingTransaction = ({simulationData}) => !simulationData && (
    <div className="alert alert-info">
        <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            Simulating transaction...
        </div>
    </div>
)

const TransactionSummary = ({simulationData}) => (
    <div className="card">
        <div className="card-header text-center">Transaction Summary</div>
        <div className={clsx('card-body', simulationData.ok ? 'bg-success-subtle' : 'bg-danger-subtle')}>
            <div className="row mb-3">
                <div className="col-sm-4"><strong>Payer:</strong></div>
                <div className="col-sm-8 small text-primary">{simulationData.payer}</div>
            </div>
            <div className="row mb-2">
                <div className="col-sm-4"><strong>Expense:</strong></div>
                <div className="col-sm-8">
                    <div>
                        <span className="text-primary fw-bold">
                            {formatLamports(simulationData.pay?.expense)}
                        </span>
                        <span className="fst-italic ps-1">$SEV</span>
                    </div>
                    <small className="text-muted">
                        ({simulationData.pay?.expense || 0} lamports)
                    </small>
                </div>
            </div>
            <div className="row">
                <div className="col-sm-4"><strong>Fee:</strong></div>
                <div className="col-sm-8">
                    <div>
                        <span className="text-primary fw-bold">
                            {formatLamports(simulationData.pay?.fee)}
                        </span>
                        <span className="fst-italic ps-1">$SEV</span>
                    </div>
                    <small className="text-muted">
                        ({simulationData.pay?.fee || 0} lamports)
                    </small>
                </div>
            </div>
        </div>
    </div>
)

const CoinsTransfer = ({simulationData}) => simulationData.summaries?.solTransfers?.length > 0 && (
    <div className="card">
        <div className="card-header text-center">$SEV Transfers</div>
        <div className="card-body">
            {simulationData.summaries.solTransfers.map((transfer, index) => (
                <div key={index} className="mb-2">
                    <div><strong>From:</strong> <code className="small">{transfer.from}</code></div>
                    <div><strong>To:</strong> <code className="small">{transfer.to}</code></div>
                    <div><strong>Amount:</strong> {formatLamports(transfer.lamports)} $SEV</div>
                    {index < simulationData.summaries.solTransfers.length - 1 && <hr/>}
                </div>
            ))}
        </div>
    </div>
)

const TokenOperations = ({simulationData}) => (
    simulationData.summaries?.mints?.length > 0 || simulationData.summaries?.splTransfers?.length > 0
) && (
    <div className="card">
        <div className="card-header text-center">Token Operations</div>
        <div className="card-body">
            {simulationData.summaries.mints?.map((mint, index) => (
                <div key={`mint-${index}`} className="mb-2">
                    <div className="badge bg-primary me-2">MINT</div>
                    <div><strong>Mint:</strong> <code className="small">{mint.mint}</code></div>
                    <div><strong>To:</strong> <code className="small">{mint.destination}</code></div>
                    <div><strong>Amount:</strong> {mint.amount}</div>
                </div>
            ))}
            {simulationData.summaries.splTransfers?.map((transfer, index) => (
                <div key={`transfer-${index}`} className="mb-2">
                    <div className="badge bg-info me-2">TRANSFER</div>
                    <div><strong>From:</strong> <code className="small">{transfer.source}</code></div>
                    <div><strong>To:</strong> <code className="small">{transfer.destination}</code></div>
                    <div><strong>Amount:</strong> {transfer.amount}</div>
                </div>
            ))}
        </div>
    </div>
)

const formatLamports = (lamports) => {
    if (!lamports) return '0'
    return (lamports / 1e9).toFixed(9).replace(/\.?0+$/, '')
}

export default SignTransaction
