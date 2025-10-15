import React, { useEffect, useMemo, useState } from 'react'
import MaterialSaleApi from '@react/api/materialSaleApi'
import { setSale } from '@js/blockchain/sevens-token'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SevensWalletAdapter } from '@react/components/wallet/WalletAdapter'
import { Number } from '@react/components/form-elements/Inputs'
import { ButtonWithProcessing } from '@react/components/form-elements/Buttons'
import {WalletForm, WalletSaleToken} from '@react/components/form-elements/WalletForms'
import { MessagesBlock } from '@react/components/info-componnents/Messages'
import { HistoryTable } from '@react/components/info-componnents/token/TokenInfo'

const materialSaleApi = new MaterialSaleApi()

const MaterialSaleInner = ({material, tokenData, handlerSave, setMaterialForm, errorMessage, setErrorMessage}) => {
    const wallet = useWallet()
    const [price, setPrice] = useState(material.price || '') // TODO - take price from tokenData !!!!!!!!!!!!!
    const [type, setType] = useState(null)
    const [isWaiting, setIsWaiting] = useState(false)

    const isWalletExpected = () => wallet?.publicKey?.toString() === tokenData?.walletPublicKey

    const getTransaction = async () => {
        try {
            if (!isWalletExpected() || !type || isWaiting) {
                return
            }
            setIsWaiting(true)
            await setSale ({
                tokenPublicKey: tokenData.tokenPublicKey,
                price: type === 'sale' ? price : 0,
                wallet,
            })
            await materialSaleApi.refresh(tokenData.tokenPublicKey)
            handlerSave()
        } catch (error) {
            setErrorMessage(error.message)
        } finally {
            setType(false)
            setIsWaiting(false)
        }
    }

    useEffect(() => {
        if (isWalletExpected()) {
            getTransaction().catch()
        }
    }, [wallet?.publicKey, type])

    const handleCancel = () => {
        setType(null)
        setIsWaiting(false)
        setErrorMessage(null)
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
                        disabled={isWaiting}
                        onChange={setPrice}
                        setErrorMessage={setErrorMessage}
                    />
                </div>
                <ButtonWithProcessing
                    className={'btn-success'}
                    label={'Set for sale'}
                    processing={type === 'sale' && isWaiting}
                    disabled={price === tokenData.sale.price || price <= 0 || isWaiting}
                    onClick={() => setType('sale')}
                /><>
                {!!tokenData.sale.price && (
                    <ButtonWithProcessing
                        className={'btn-primary'}
                        label={'Cancel Sale'}
                        processing={type === 'cancel' && isWaiting}
                        disabled={isWaiting}
                        onClick={() => {
                            setType('cancel')
                            setIsWaiting(false)
                        }}
                    />
                )}</>
            </div>
            {type && (
                <WalletForm operation={'sale'} expectedPublicKey={tokenData.walletPublicKey} waitingSignature={isWaiting} />
            )}
            {type && (
                <button className="btn btn-danger w-100 p-2 mb-3" onClick={handleCancel}>
                    Cancel
                </button>
            )}
            <MessagesBlock error={errorMessage} />
            <HistoryTable tokenPublicKey={tokenData.tokenPublicKey} showChart={true} />
            <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-secondary px-5" onClick={() => setMaterialForm(null)} disabled={isWaiting}>
                    Back
                </button>
            </div>
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
