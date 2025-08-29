import React from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { getBlurredAddress } from '@react/components/wallet/scripts/utils'

const TokensList = ({ tokens }) => {
    if (!tokens?.length) {
        return null
    }

    const { setShowComponent } = useWalletContext()

    return (
        <div className="table-responsive mb-4">
            <table className="table table-hover align-middle mb-0">
                <thead>
                    <tr>
                        <th colSpan={3} className={'text-center'}>{t('myTokens')}</th>
                    </tr>
                </thead>
                <tbody>
                {tokens.map((token, i) => {
                    return (
                        <tr
                            key={i}
                            className="'cursor-pointer'"
                            onClick={() => setShowComponent({
                                component: 'Token',
                                props: {token},
                            })}
                            style={{ cursor: 'pointer' }}
                        >
                            <td>{token.data?.metadata?.tokenName}</td>
                            <td className="text-end">{getBlurredAddress(token.mint)}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    )
}

export default TokensList
