import React, {useState} from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { ButtonBack, ButtonTokenBurn, ButtonTokenTransfer } from '@react/components/wallet/components/form-elements/Buttons'
import { SuccessMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import TokenDetails from '@react/components/wallet/components/tokens-list/components/TokenDetails'
import TokenTransfer from '@react/components/wallet/components/tokens-list/components/TokenTransfer'
import TokenBurn from '@react/components/wallet/components/tokens-list/components/TokenBurn'

const Token = ({token}) => {
    const {setShowComponent} = useWalletContext()
    const [tokenAvailable, setTokenAvailable] = useState(true)
    const [blockTransfer, setBlockTransfer] = useState(false)
    const [blockBurn, setBlockBurn] = useState(false)
    const [successMessage, setSuccessMessage] = useState(null)
    const subBlockIsActive = () =>  blockTransfer || blockBurn

    return (
        <div className={'d-grid gap-3'}>
            <TokenDetails token={token} />
            {blockTransfer && <TokenTransfer
                token={token}
                setBlockTransfer={setBlockTransfer}
                setSuccessMessage={setSuccessMessage}
                setTokenAvailable={setTokenAvailable}/>
            }
            {blockBurn && <TokenBurn
                token={token}
                setBlockBurn={setBlockBurn}
                setSuccessMessage={setSuccessMessage}
                setTokenAvailable={setTokenAvailable}/>
            }
            {!subBlockIsActive() && tokenAvailable && <>
                <ButtonTokenTransfer onClick={() => setBlockTransfer(true)} className={'mt-1'} />
                {token?.data?.metadata?.canBeBurned &&
                    <ButtonTokenBurn token={token} onClick={() => setBlockBurn(true)} />
                }
            </>}
            <SuccessMessageBlock message={successMessage} className={'mb-0'}/>
            {!blockTransfer && !blockBurn && (
                <ButtonBack label={t('backToWallet')} onClick={() => setShowComponent(null)} />
            )}
        </div>
    )
}

export default Token
