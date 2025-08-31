import React, {useEffect, useState} from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { checkConnection } from '@react/components/wallet/scripts/apiActions'
import {
    copyToClipboard, currentConnectionKey, getBlurredAddress, limitNumberString,
} from '@react/components/wallet/scripts/utils'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { ButtonCopy, ButtonWalletClose } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock, InfoMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import clsx from 'clsx'

const WalletHeader = () => (
    <div className="panel-header w-100 p-2">
        <h5 className="text-center mb-0 ms-3 w-100">{t('sevensWallet')}</h5>
        <ButtonWalletClose />
    </div>
)

const WalletLoading = () => (
    <div>
        <WalletHeader />
        <div className="p-3 text-center">
            <div className="spinner-border" role="status">
                <span className="visually-hidden">{t('loading')}</span>
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

const ConnectionInfo = () => {
    const {walletConnection} = useWalletContext()
    const [isConnected, setIsConnected] = useState(true)
    const connectionKey = currentConnectionKey(walletConnection)

    const run = async () => {
        const ok = await checkConnection()
        setIsConnected(ok)
    }

    const connectionInfo = () => connectionKey === 'main' ? '' :
        t('walletUsesConnection').replace('{net}', connectionKey.toUpperCase())

    const connectionState = () => isConnected ? '' :
        t('walletNoConnection').replace('{net}', walletConnection)

    run().catch()

    return (
        <div>
            <InfoMessageBlock message={connectionInfo()} className={'text-danger text-center'} />
            <ErrorMessageBlock message={connectionState()} className={'text-center'} />
        </div>
    )
}

const WalletDetails = ({walletData}) => {
    const {rateUsd, hideBalances} = useWalletContext()
    const balance = walletData?.balance ? walletData?.balance / LAMPORTS_PER_SOL : 0
    const balanceUsd = balance ? walletData?.balance / LAMPORTS_PER_SOL * rateUsd : 0

    return (
        <>
            <label className={'text-center fw-bold w-100 fs-3'}>{walletData.name}</label>
            <div className="card fs-2 mb-1">
                <h5 className="card-header text-center fs-6">{getBlurredAddress(walletData.publicKey)}</h5>
                <div className="d-grid my-1 px-2" style={{ gridTemplateColumns: "1fr auto" }}>
                    <div className="text-end text-success fw-bold">
                        {hideBalances ? '...' : limitNumberString(balance)}
                    </div>
                    <div className="text-start"><span className="fst-italic mx-2 fs-5">$SEV</span></div>
                    <div className="text-end text-success fw-bold">
                        {hideBalances ? '...' : balanceUsd.toFixed(2)}
                    </div>
                    <div className="text-start"><span className="fst-italic mx-2 fs-5">$USD</span></div>
                </div>
            </div>
        </>
    )
}

const WalletInfo = ({accountInfo}) => (
    <div className="card mb-2">
        <h5 className="card-header">{t('blockchainAccountInfo')}</h5>
        <div className="card-body">
            <table className="table table-borderless mb-0 w-75 mx-auto">
                <tbody>
                <tr>
                    <td>{t('account')}:</td>
                    <td><b>{accountInfo.found ? t('found') : t('notFound')}</b></td>
                </tr>
                <tr>
                    <td>{t('balance')}:</td>
                    <td><b>{accountInfo.balance ? accountInfo.balance / LAMPORTS_PER_SOL : 0}</b></td>
                </tr>
                <tr>
                    <td>{t('tokens')}:</td>
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
            <div className="card mb-3">
                <h6 className="card-header">{t('recoveryPhrase')}</h6>
                <div className="card-body text-center p-2">
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
                        label={t('copyRecoveryPhrase')}
                        onClick={() => copyToClipboard(secrets.mnemonic)}
                        className={'d-inline-flex w-auto mt-2 mb-3'}
                    />
                </div>
            </div>
        )}
        <div className="card mb-3">
            <h6 className="card-header">{t('privateKey64')}</h6>
            <div className="card-body text-center p-2">
                <div className="text-break p-2">{secrets.secretKey.base58}</div>
                <ButtonCopy
                    label={t('copyPrivateKey')}
                    onClick={() => copyToClipboard(secrets.secretKey.base58)}
                    className={'d-inline-flex w-auto mt-2 mb-3'}
                />
            </div>
        </div>
        <div className="card mb-0">
            <h6 className="card-header">{t('seed32')}</h6>
            <div className="card-body text-center p-2">
                <div className="text-break p-2">{secrets.seed.base58}</div>
                <ButtonCopy
                    label={t('copyPrivateKey')}
                    onClick={() => copyToClipboard(secrets.seed.base58)}
                    className={'d-inline-flex w-auto mt-2 mb-3'}
                />
            </div>
        </div>
    </div>
)

export {
    WalletHeader, WalletLoading, ConnectionInfo, BlockTitle,
    WalletDetails, WalletInfo, SecretsView,
}
