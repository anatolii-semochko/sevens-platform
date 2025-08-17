import React from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { copyToClipboard, getBlurredAddress } from '@react/components/wallet/scripts/utils'
import { ButtonCopy, ButtonWalletClose } from '@react/components/wallet/components/form-elements/Buttons'
import clsx from 'clsx'

const WalletTitle = () => (
    <h5 className="text-center mb-0 w-100">Sevens Wallet</h5>
)

const WalletHeader = () => (
    <div className="panel-header p-3">
        <WalletTitle />
        <ButtonWalletClose />
    </div>
)

const WalletLoading = () => (
    <div>
        <WalletHeader />
        <div className="p-3 text-center">
            <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    </div>
)

const BlockTitle = ({title, className}) => {
    if (!title) return 
    return (
        <div className={clsx('mt-2 mb-3', className)}>
            {title?.split('\n').map((line, idx) => (
                <h6 className="text-center mb-0" key={`title-${idx}`}>{line}</h6>
            ))}
        </div>
    )
}

const WalletDetails = ({walletData, className}) => {
    const { hideBalances } = useWalletContext()
    const balance = hideBalances ? '...' : <>
        {walletData?.balance ? walletData?.balance / LAMPORTS_PER_SOL : 0}
        <span className="fst-italic mx-2">$SEV</span>
    </>
    const tokens = hideBalances ? '...' : (walletData?.tokens?.length || 0)

    return (
        <div className={clsx('card', className)}>
            <h5 className="card-header">Wallet: {walletData.name}</h5>
            <div className="card-body">
                <table className="table table-borderless mb-0 w-75 mx-auto">
                    <tbody>
                    <tr>
                        <td>Address:</td>
                        <td><b>{getBlurredAddress(walletData.publicKey)}</b></td>
                    </tr>
                    <tr>
                        <td>Balance:</td>
                        <td><b>{balance}</b></td>
                    </tr>
                    <tr>
                        <td>Tokens:</td>
                        <td><b>{tokens}</b></td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const WalletInfo = ({accountInfo}) => (
    <div className="card mb-2">
        <h5 className="card-header">Blockchain Account Info</h5>
        <div className="card-body">
            <table className="table table-borderless mb-0 w-75 mx-auto">
                <tbody>
                <tr>
                    <td>Account:</td>
                    <td><b>{accountInfo.found ? 'Found' : 'Not found'}</b></td>
                </tr>
                <tr>
                    <td>Balance:</td>
                    <td><b>{accountInfo.balance ? accountInfo.balance / LAMPORTS_PER_SOL : 0}</b></td>
                </tr>
                <tr>
                    <td>Tokens:</td>
                    <td><b>{accountInfo.tokens}</b></td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
)

const SecretsView = ({secrets}) => (
    <div>
        {!!secrets.mnemonic && (
            <div className="card mb-2">
                <h6 className="card-header">Recovery Phrase</h6>
                <div className="card-body text-center">
                    <div className="d-grid gap-2">
                        <div className="row g-2 mb-2">
                            {secrets.mnemonic?.split(' ').map((word, i) => (
                                <div className="col-4" key={`choice-${i}`}>
                                    <button className="btn w-100">{word}</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <ButtonCopy
                        label={'Copy Recovery Phrase'}
                        onClick={() => copyToClipboard(secrets.mnemonic)}
                        className={'d-inline-flex w-auto mt-2 mb-3'}
                    />
                </div>
            </div>  
        )}
        <div className="card mb-2">
            <h6 className="card-header">64-byte Private Key (base58)</h6>
            <div className="card-body text-center">
                <div className="text-break p-2">{secrets.secretKey.base58}</div>
                <ButtonCopy
                    label={'Copy Private Key'}
                    onClick={() => copyToClipboard(secrets.secretKey.base58)}
                    className={'d-inline-flex w-auto mt-2 mb-3'}
                />
            </div>
        </div>
        <div className="card mb-0">
            <h6 className="card-header">32-byte Seed (base58)</h6>
            <div className="card-body text-center">
                <div className="text-break p-2">{secrets.seed.base58}</div>
                <ButtonCopy
                    label={'Copy Private Key'}
                    onClick={() => copyToClipboard(secrets.seed.base58)}
                    className={'d-inline-flex w-auto mt-2 mb-3'}
                />
            </div>
        </div>
    </div>
)

export { WalletTitle, WalletHeader, WalletLoading, BlockTitle, WalletDetails, WalletInfo, SecretsView }
