import React, { useEffect, useMemo, useState } from 'react'
import MaterialSaleApi from '@react/api/materialSaleApi'
import { setSale } from '@js/blockchain/sevens-token'
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SevensWalletAdapter } from '@react/components/wallet/WalletAdapter'
import { Number } from '@react/components/form-elements/Inputs'
import { ButtonWithProcessing } from '@react/components/form-elements/Buttons'
import { WalletForm } from '@react/components/form-elements/WalletForm'
import { MessagesBlock } from '@react/components/info-componnents/Messages'
import { HistoryTable } from '@react/components/info-componnents/token/TokenInfo'

const materialSaleApi = new MaterialSaleApi()

const MaterialSaleInner = ({tokenData, handlerSave, setMaterialForm}) => {
    const wallet = useWallet()
    const [price, setPrice] = useState(tokenData.sale.priceSevens || '')
    const [type, setType] = useState(null)
    const [waitingSignature, setWaitingSignature] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState(false)

    const isWalletExpected = () => wallet?.publicKey?.toString() === tokenData?.walletPublicKey
    const busy = () => waitingSignature || processing
    const processingLabel = () => waitingSignature ? 'Waiting signature...' : 'Processing...'

    const getTransaction = async () => {
        try {
            if (!isWalletExpected() || !type || waitingSignature || processing) {
                return
            }
            setError(null)
            setWaitingSignature(true)
            await setSale ({
                tokenPublicKey: tokenData.tokenPublicKey,
                price: type === 'sale' ? price : 0,
                wallet,
            })
            setWaitingSignature(false)
            setProcessing(true)
            await materialSaleApi.refresh(tokenData.tokenPublicKey)
            handlerSave()
        } catch (error) {
            setError(error.message)
        } finally {
            setType(false)
            setWaitingSignature(false)
            setProcessing(false)
        }
    }

    useEffect(() => {
        if (isWalletExpected()) {
            getTransaction().catch()
        }
        if (!wallet?.publicKey?.toString()) {
            setWaitingSignature(null)
        }
    }, [wallet?.publicKey?.toString(), type])

    const handleCancel = () => {
        setType(null)
        setError(null)
    }

    return (
        <div className="mb-3">
            <h4 className="text-center mb-4">Sale Management</h4>
            <div className="d-flex align-items-end gap-2 mb-4">
                <label htmlFor="material-price" className="mb-2 me-1">
                    Price $SEV:
                </label>
                <div className="flex-grow-1">
                    <Number
                        id="material-price"
                        type={'number'}
                        placeholder="Enter price in SOL (e.g., 1.5)"
                        value={price}
                        min={0}
                        max={1000000000}
                        maxDecimals={9}
                        disabled={waitingSignature || processing}
                        onChange={setPrice}
                        setErrorMessage={setError}
                    />
                </div>
                <ButtonWithProcessing
                    className={'btn-success'}
                    label={'Set for sale'}
                    processingLabel={processingLabel()}
                    processing={type === 'sale' && busy()}
                    disabled={price === tokenData.sale.priceSevens || price <= 0 || busy()}
                    onClick={() => setType('sale')}
                /><>
                {!!tokenData.sale.price && (
                    <ButtonWithProcessing
                        className={'btn-primary'}
                        label={'Cancel Sale'}
                        processingLabel={processingLabel()}
                        processing={type === 'cancel' && busy()}
                        disabled={busy()}
                        onClick={() => {
                            setType('cancel')
                            setError(null)
                        }}
                    />
                )}</>
            </div>
            {!!type && (
                <div>
                    <h4 className="text-center mb-4">
                        {type === 'sale' ? `Put the token up for sale at ${price} $SEV` : 'Remove a token from sale'}
                    </h4>
                    <WalletForm operation={'sale'} expectedPublicKey={tokenData.walletPublicKey} waitingSignature={waitingSignature} />
                </div>
            )}
            {type && !busy() && (
                <button className="btn btn-danger w-100 p-2 mb-3" onClick={handleCancel}>
                    Cancel
                </button>
            )}
            <MessagesBlock error={error} />
            <HistoryTable tokenPublicKey={tokenData.tokenPublicKey} showChart={true} />
            <button className="btn btn-secondary w-100 px-5" onClick={() => setMaterialForm(null)} disabled={busy()}>
                Back
            </button>
        </div>
    )
}

export const MaterialSale = (props) => {
    const endpoint = process.env.ANCHOR_PROVIDER_URL
    const wallets = useMemo(() => [
        new SevensWalletAdapter(),
        new PhantomWalletAdapter()
    ], [])

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect={true}>
                <WalletModalProvider>
                    <MaterialSaleInner {...props} />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}
