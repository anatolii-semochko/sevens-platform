import React from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { getBlurredAddress, getDateTimeFromDate } from '@react/components/wallet/scripts/utils'

const TokenDetails = ({token}) => {
    const { hideBalances } = useWalletContext()

    return (
        <div className="card mt-2 mb-0">
            <h5 className="card-header">
                <div className={'text-center'}>
                    {t('token')}: <span className="mx-1">{token.data?.metadata?.tokenName}</span>
                </div>
            </h5>
            <div className="card-body p-2">
                <table className="table table-borderless mb-0 mx-auto">
                    <tbody>
                        <tr>
                            <td>{t('address')}:</td>
                            <td className="px-2 text-break">
                                {hideBalances ? getBlurredAddress(token.mint) : token.mint}
                            </td>
                        </tr>
                        <tr>
                            <td>{t('author')}:</td>
                            <td className="px-2">{token.data?.metadata?.author || '-'}</td>
                        </tr>
                        <tr>
                            <td>{t('minted')}:</td>
                            <td className="px-2">{getDateTimeFromDate(token.data?.mintingTime)}</td>
                        </tr>
                        {token.data?.metadata?.description && <>
                            <tr>
                                <td>{t('description')}:</td>
                                <td className="px-2">{token.data.metadata.description}</td>
                            </tr>
                        </>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default TokenDetails
