import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonWalletAdd, ButtonListActions, ButtonBack } from '@react/components/wallet/components/form-elements/Buttons'
import AddWallet from '@react/components/wallet/components/wallet-add/AddWallet'
import WalletActions from '@react/components/wallet/components/wallets-list/wallet-actions/WalletActions'

const WalletsList = () => {
    const {walletsList, walletPublicKey, setWalletByPublicKey, hideBalances, setShowComponent} = useWalletContext()
    const [showWalletAdd, setShowWalletAdd] = useState(false)
    const [showWalletActions, setShowWalletActions] = useState(false)

    useEffect(() => {
        if (!walletsList.length) {
            setShowComponent(null)
        }
    }, [walletsList])

    const balanceText = (walletData) => (hideBalances || walletData?.balance === undefined) ?
        '...' : (walletData.balance / LAMPORTS_PER_SOL).toFixed(2)

    const tokensText = (walletData) => !hideBalances && walletData.tokens !== undefined ?
        walletData.tokens.length : '...'

    if (showWalletAdd) {
        return <AddWallet backClick={() => setShowWalletAdd(false)} />
    }
    if (!!showWalletActions) {
        return <WalletActions walletData={showWalletActions} setShowWalletActions={setShowWalletActions} />
    }

    const handleSetWallet = async (walletData) => {
        await setWalletByPublicKey(walletData.publicKey)
        setShowComponent(null)
    }

    return (
        <div>
            <BlockTitle title={t('availableWalletsList')}/>
            <div className="table-responsive mb-3">
                <table className="table table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>{t('wallet')}</th>
                            <th className="text-end"><span className="fst-italic mx-1">$SEV</span></th>
                            <th className="text-end"><span className="mx-1">{t('tokens')}</span></th>
                            <th style={{width: 1}}> </th>
                        </tr>
                    </thead>
                    <tbody>
                    {[...walletsList].sort((a, b) => a.name.localeCompare(b.name)).map((walletData, i) => {
                        const isActive = walletData.publicKey === walletPublicKey;
                        return (
                            <tr
                                key={i}
                                className={clsx(isActive ? 'table-primary' : '', 'cursor-pointer')}
                                style={{ cursor: 'pointer' }}
                            >
                                <td className={'ps-4'} onClick={() => handleSetWallet(walletData)}>
                                    {walletData.name}
                                </td>
                                <td onClick={() => handleSetWallet(walletData)} className="text-end">
                                    {balanceText(walletData)}
                                </td>
                                <td onClick={() => handleSetWallet(walletData)} className="text-center">
                                    {tokensText(walletData)}
                                </td>
                                <td className="text-end">
                                    <ButtonListActions onClick={() => setShowWalletActions(walletData)} />
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
            <ButtonWalletAdd onClick={() => setShowWalletAdd(true)} className={'mb-3'} />
            <ButtonBack />
        </div>
    )
}

export default WalletsList
