import React, { useState, useEffect } from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { connection } from '@js/blockchain/sevens' // TODO - Use Wallet Current Connection (apiActions.js)
import { getWallet } from '@react/components/wallet/scripts/apiActions'
import { simulateAndSummarize } from '@react/components/wallet/scripts/simulate'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonSignTransaction } from '@react/components/wallet/components/form-elements/Buttons'

const SignTransaction = ({ transaction, onSign, onCancel }) => {
    const [simulationData, setSimulationData] = useState(null)
    const [isSimulating, setIsSimulating] = useState(true)
    const [simulationError, setSimulationError] = useState(null)
    const [isSigning, setIsSigning] = useState(false)

    const { walletData, password } = useWalletContext()

    useEffect(() => {
        if (transaction) {
            simulateTransaction().catch(error => setSimulationError(error.message))
        }
    }, [transaction])

    const simulateTransaction = async () => {
        try {
            setIsSimulating(true)
            setSimulationError(null)

            console.log('Transaction to simulate:', transaction)
            console.log('Transaction type:', transaction.constructor.name)
            console.log('Has feePayer:', !!transaction.feePayer)
            console.log('Has recentBlockHash:', !!transaction.recentBlockhash)
            console.log('Instructions count:', transaction.instructions?.length)

            const result = await simulateAndSummarize(connection, transaction)
            setSimulationData(result)

            if (!result.ok) {
                setSimulationError(result.error)
            }
        } catch (error) {
            console.error('Simulation failed:', error)
            setSimulationError(error.message)
        } finally {
            setIsSimulating(false)
        }
    }

    const handleSignTransaction = async () => {
        try {
            setIsSigning(true)

            // Get wallet instance and sign transaction
            const wallet = getWallet(walletData, password)
            const signedTransaction = await wallet.signTransaction(transaction)

            // Call the callback with signed transaction
            if (onSign) {
                onSign(signedTransaction)
            }
        } catch (error) {
            console.error('Signing failed:', error)
            setSimulationError(`Signing failed: ${error.message}`)
        } finally {
            setIsSigning(false)
        }
    }

    const handleCancel = () => {
        if (onCancel) {
            onCancel()
        }
    }

    const formatLamports = (lamports) => {
        if (!lamports) return '0'
        return (lamports / 1e9).toFixed(9).replace(/\.?0+$/, '')
    }

    if (!transaction) {
        return (
            <div>
                <BlockTitle title={t('signTransaction')} className={'mb-4'}/>
                <div className="alert alert-warning">
                    No transaction provided
                </div>
            </div>
        )
    }

    return (
        <div>
            <BlockTitle title={t('signTransaction')} className={'mb-4'}/>

            {isSimulating && (
                <div className="alert alert-info">
                    <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        Simulating transaction...
                    </div>
                </div>
            )}

            {simulationError && (
                <div className="alert alert-danger">
                    <strong>Simulation Error:</strong> {simulationError}
                </div>
            )}

            {simulationData && (
                <div className={'d-grid gap-3'}>
                    {/* Transaction Summary */}
                    <div className="card">
                        <div className="card-header">
                            <div className="text-center">Transaction Summary</div>
                        </div>
                        <div className="card-body">
                            <div className="row mb-2">
                                <div className="col-sm-4"><strong>Status:</strong></div>
                                <div className="col-sm-8">
                                    <span className={`badge ${simulationData.ok ? 'bg-success' : 'bg-danger'}`}>
                                        {simulationData.ok ? 'Will Succeed' : 'Will Fail'}
                                    </span>
                                </div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-sm-4"><strong>Fee:</strong></div>
                                <div className="col-sm-8">
                                    <div>
                                        {formatLamports(simulationData.fee?.estimatedTotalLamports)}
                                        <span className="fst-italic ps-1">$SEV</span>
                                    </div>
                                    <small className="text-muted">
                                        ({simulationData.fee?.estimatedTotalLamports || 0} lamports)
                                    </small>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4"><strong>Payer:</strong></div>
                                <div className="col-sm-8">
                                    <code className="small">{simulationData.payer}</code>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SOL Transfers */}
                    {simulationData.summaries?.solTransfers?.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <h6 className="mb-0">SOL Transfers</h6>
                            </div>
                            <div className="card-body">
                                {simulationData.summaries.solTransfers.map((transfer, index) => (
                                    <div key={index} className="mb-2">
                                        <div><strong>From:</strong> <code className="small">{transfer.from}</code></div>
                                        <div><strong>To:</strong> <code className="small">{transfer.to}</code></div>
                                        <div><strong>Amount:</strong> {formatLamports(transfer.lamports)} SOL</div>
                                        {index < simulationData.summaries.solTransfers.length - 1 && <hr/>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Token Operations */}
                    {(simulationData.summaries?.mints?.length > 0 || simulationData.summaries?.splTransfers?.length > 0) && (
                        <div className="card">
                            <div className="card-header">
                                <h6 className="mb-0">Token Operations</h6>
                            </div>
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
                    )}

                    {/* Action Buttons */}
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={handleCancel}
                            disabled={isSigning}
                        >
                            Cancel
                        </button>
                        <ButtonSignTransaction
                            onClick={handleSignTransaction}
                            disabled={!simulationData.ok || isSigning}
                            loading={isSigning}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default SignTransaction
