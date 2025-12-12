import React, { useEffect, useState } from 'react'
import TokenApi from '@react/api/tokenApi'
import { getDeserializedTransaction, getSerializedTransaction } from '@js/utils/blockchain'
import { useWallet } from '@solana/wallet-adapter-react'
import { RepeatableQuery } from '@react/api/RepeatableQuery'
import { WalletForm, WalletWrapper } from '@react/components/form-elements/WalletForm'
import { MessagesBlock } from '@react/components/info-componnents/Messages'
import { HistoryTable } from '@react/components/info-componnents/token/TokenInfo'
import { SaleActions, SaleForm, SaleMessage, SignActions, ButtonBack} from './components/SaleComponents'

const tokenApi = new TokenApi()

const MaterialSaleInner = ({tokenData, handlerSave, setMaterialForm}) => {
    const wallet = useWallet()
    const [loadingTariffs, setLoadingTariffs] = useState(true)
    const [loadingManageToken, setLoadingManageToken] = useState(false)
    const [price, setPrice] = useState(tokenData.sale.price > 0 ? tokenData.sale.price : '')
    const [currentPrice, setCurrentPrice] = useState(price)
    const [retailPrice, setRetailPrice] = useState('')
    const [currentRetailPrice, setCurrentRetailPrice] = useState('')
    const [tariffBuy, setTariffBuy] = useState(0)
    const [type, setType] = useState(null)
    const [waitingSignature, setWaitingSignature] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState(false)

    const round = (value) => Math.round(value * 1e9) / 1e9

    const handleTariffsSuccess = (tariffs) => {
        setTariffBuy(tariffs.buy)
        setLoadingManageToken(true)
    }

    const handleManageTokenSuccess = (tokenManage) => {
        const manageRetailPrice = tokenManage.retailPrice || ''
        setRetailPrice(manageRetailPrice)
        setCurrentRetailPrice(manageRetailPrice)
    }

    const handleManageTokenError = () => {
        const currentPrice = tokenData.sale.price > 0 ? tokenData.sale.price : ''
        if (currentPrice && currentPrice > 0) {
            const tokenRetailPrice = round(currentPrice * (1 + tariffBuy / 100))
            setRetailPrice(tokenRetailPrice)
            setCurrentRetailPrice(tokenRetailPrice)
        }
    }

    const handleSetSale = async () => {
        try {
            if (!wallet.publicKey?.toString()) {
                setError('Wallet is not activated')
                return
            }
            if (!isWalletExpected() || !type || waitingSignature || processing) {
                return
            }
            setError(null)

            setProcessing(true)
            const transactionData = await tokenApi.getSaleTransaction(
                tokenData.tokenPublicKey,
                type === 'sale' ? price : 0,
            )
            setProcessing(false)

            setWaitingSignature(true)
            const txSignature = await wallet.signTransaction(getDeserializedTransaction(transactionData.transaction))
            setWaitingSignature(false)

            setProcessing(true)
            await tokenApi.postSaleTransaction(
                tokenData.tokenPublicKey,
                transactionData.transactionId,
                getSerializedTransaction(txSignature),
            )

            handlerSave()
        } catch (error) {
            setError(error.message)
            setProcessing(false)
            setWaitingSignature(false)
        }
    }

    const handleCancel = () => {
        setType(null)
        setError(null)
    }

    const isWalletExpected = () => wallet?.publicKey?.toString() === tokenData?.walletPublicKey
    const busy = () => waitingSignature || processing
    const loading = loadingTariffs || loadingManageToken

    useEffect(() => {
        setError(null)
    }, [wallet.publicKey?.toString()])

    if (loading) return (
        <div>
            <RepeatableQuery
                apiEndpoint={() => tokenApi.getTariffs()}
                params={null}
                onSuccess={handleTariffsSuccess}
                onError={(error) => setError(error)}
                processing={loadingTariffs}
                setProcessing={setLoadingTariffs}
                loadingMessage={'Loading data...'}
                cancelButton={false}
                className={'mb-4'}
            />
            <RepeatableQuery
                apiEndpoint={(publicKey) => tokenApi.getManageToken(publicKey)}
                params={tokenData.tokenPublicKey}
                onSuccess={handleManageTokenSuccess}
                onError={handleManageTokenError}
                processing={loadingManageToken}
                setProcessing={setLoadingManageToken}
                loadingMessage={'Loading token data...'}
                cancelButton={false}
                className={'mb-4'}
            />
            <ButtonBack {...{setMaterialForm, busy}} />
        </div>
    )

    return (
        <div className="mb-3">
            <h4 className="text-center mb-4">Sale Management</h4>
            <SaleForm {...{
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
            }} />
            {!!type && (
                <div>
                    <SaleMessage {...{type, price, retailPrice}} />
                    <WalletForm {...{operation: 'sale', expectedPublicKey: tokenData.walletPublicKey, waitingSignature}} />
                </div>
            )}
            <MessagesBlock error={error} />
            {type ? (
                <SignActions {...{type, waitingSignature, busy, handleCancel, handleSetSale}} />
            ) : (
                <SaleActions {...{tokenData, setType, price, currentPrice, setError}} />
            )}
            <HistoryTable tokenPublicKey={tokenData.tokenPublicKey} showChart={true} showTable={true} showWallet={true} />
            <ButtonBack {...{setMaterialForm, busy}} />
        </div>
    )
}

export const MaterialSale = (props) => (
    <WalletWrapper>
        <MaterialSaleInner {...props} />
    </WalletWrapper>
)
