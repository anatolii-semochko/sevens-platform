import React from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { getBlurredAddress, getDateTimeFromDate } from '@react/components/wallet/scripts/utils'

const TokenDetails = ({token}) => {
    const { hideBalances } = useWalletContext()

    return (
        <div className="card mt-2 mb-0">
            <h5 className="card-header">
                <div className={'text-center'}>
                    Token: <span className="mx-1">{token.data?.metadata?.tokenName}</span>
                </div>
            </h5>
            <div className="card-body">
                <table className="table table-borderless mb-1 mx-auto">
                    <tbody>
                        <tr>
                            <td>Address:</td>
                            <td className="px-2 fw-bold text-break">
                                {hideBalances ? getBlurredAddress(token.mint) : token.mint}
                            </td>
                        </tr>
                        <tr>
                            <td>Author:</td>
                            <td className="px-2 fw-bold">{token.data?.metadata?.author || '-'}</td>
                        </tr>
                        <tr>
                            <td>Minted:</td>
                            <td className="px-2 fw-bold">{getDateTimeFromDate(token.data?.mintingTime)}</td>
                        </tr>
                        {token.data?.metadata?.description && <>
                            <tr>
                                <td>Description:</td>
                                <td className="px-2 fw-bold">{token.data.metadata.description}</td>
                            </tr>
                        </>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default TokenDetails
