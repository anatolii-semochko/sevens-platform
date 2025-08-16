import React from 'react'
import clsx from 'clsx'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import WalletMenu from '@react/components/wallet/components/wallets-block/menu/WalletMenu'
import { ButtonAddWallet } from '@react/components/wallet/components/form-elements/Buttons'
import  { FaChevronDown, FaChevronUp } from 'react-icons/fa'

const WalletsList = () => {
    const {
        walletsList, walletIndex, setWalletIndex,
        hideBalances,
        showWalletsList, setShowWalletsList,
        setShowComponent,
    } = useWalletContext()

    const balanceText = (walletData) => (hideBalances || walletData?.balance === undefined) ?
        '...' : (walletData.balance / LAMPORTS_PER_SOL).toFixed(2)

    const tokensText = (walletData) => !hideBalances && walletData.tokens !== undefined ?
        walletData.tokens.length : '...'

    return (
        <div className="mb-4">
            <div className="d-flex justify-content-center mb-2">
                <button
                    className="btn fw-bold d-flex align-items-center"
                    onClick={() => setShowWalletsList(!showWalletsList)}
                    style={{ gap: '0.5rem', borderRadius: '0.375rem', cursor: 'pointer' }}
                >
                    Select wallet ({walletsList.length} available)
                    {showWalletsList ? <FaChevronUp /> : <FaChevronDown />}
                </button>
            </div>
            {showWalletsList && (
                <div className="table-responsive mb-1">
                    <table className="table table-hover wallet-table align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Wallet</th>
                                <th className="text-end"><span className="fst-italic mx-1">$SEV</span></th>
                                <th className="text-end">Tokens</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                        {walletsList.map((walletData, i) => {
                            const isActive = i === walletIndex;
                            return (
                                <tr
                                    key={i}
                                    className={clsx(
                                        isActive ? 'table-primary' : '',
                                        'cursor-pointer'
                                    )}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td onClick={() => setWalletIndex(i)}>
                                        {walletData.name}
                                    </td>
                                    <td onClick={() => setWalletIndex(i)} className="text-end">
                                        {balanceText(walletData)}
                                    </td>
                                    <td onClick={() => setWalletIndex(i)} className="text-end">
                                        {tokensText(walletData)}
                                    </td>
                                    <td className="text-end">
                                        <WalletMenu walletData={walletData}/>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
            <ButtonAddWallet onClick={() => setShowComponent({component: 'AddWallet'})} className={'mt-1'} />
        </div>
    )
}

export default WalletsList
