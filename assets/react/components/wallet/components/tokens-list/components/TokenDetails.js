import React from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { getBlurredAddress, getDateTimeFromDate } from '@react/components/wallet/scripts/utils'

const TokenDetails = ({token}) => {
    const { hideBalances } = useWalletContext()

    return (
        <div className="card mt-2 mb-0">
            <h5 className="card-header">
                Token:
                <span className="mx-1">{token.data?.metadata?.tokenName}</span>
            </h5>
            <div className="card-body">
                <div className="mb-2 mt-2 text-center">
                    Token Address:
                </div>
                <div className="text-center mb-2 mt-2 px-3">
                    <b>{hideBalances ? getBlurredAddress(token.mint) : token.mint}</b>
                </div>
                <table className="table table-borderless mb-3 w-75 mx-auto">
                    <tbody>
                        <tr>
                            <td>Author:</td>
                            <td className="px-2">{token.data?.metadata?.author || '-'}</td>
                        </tr>
                        <tr>
                            <td>Minted:</td>
                            <td className="px-2">{getDateTimeFromDate(token.data?.mintingTime)}</td>
                        </tr>
                    </tbody>
                </table>
                {token.data?.metadata?.description && <>
                    <div className="mb-2 mt-2 text-center">Description:</div>
                    <div className="text-center mb-2 mt-2 px-3">{token.data.metadata.description}</div>
                </>}
            </div>
        </div>
    )
}

export default TokenDetails
