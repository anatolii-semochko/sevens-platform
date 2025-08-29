import React, {useState} from 'react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonSendCoins } from '@react/components/wallet/components/form-elements/Buttons'
import { MessagesBlock } from '@react/components/wallet/components/form-elements/Messages'
import { getWallet, sendCoins, getEstimateCoinsTransferFee } from '@react/components/wallet/scripts/apiActions'
import { isValidWalletAddress } from '@react/components/wallet/scripts/utils'

const SendCoins = () => {
    const {walletData, walletReload, password} = useWalletContext()
    const [errorMessage, setErrorMessage] = useState(null)
    const [confirmMessage, setConfirmMessage] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [destinationAddress, setDestinationAddress] = useState('')
    const [coinsToSend, setCoinsToSend] = useState(0)
    const [sent, setSent] = useState(false)

    const handlerSendCoins = async () => {
        try {
            setErrorMessage(null)
            checkForm()
            const wallet = getWallet(walletData, password)
            await checkSendCoins(wallet)
            if (!confirmMessage) {
                return setConfirmMessage(
                    t('coinsTransferWarning')
                        .replace('{amount}', coinsToSend)
                        .replace('{address}', destinationAddress)
                )
            }
            setConfirmMessage(false)
            const transaction = await sendCoins(destinationAddress, coinsToSend * LAMPORTS_PER_SOL, wallet)
            setSent(true)
            await walletReload()
            setSuccessMessage(
                t('coinsTransferSuccess')
                    .replace('{amount}', coinsToSend)
                    .replace('{address}', destinationAddress)
                    .replace('{tx}', transaction)
            )
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    const checkForm = () => {
        if (!destinationAddress) {
            throw new Error (t('noDestinationAddress'))
        }
        if (!isValidWalletAddress(destinationAddress)) {
            throw new Error (t('invalidDestinationAddress'))
        }
        if (!coinsToSend) {
            throw new Error (t('noSumFilled'))
        }
    }

    const checkSendCoins = async (wallet) => {
        const toSent =  coinsToSend * LAMPORTS_PER_SOL
        const available = walletData.balance
        if (available < toSent) {
            throw new Error(t('insufficientBalance'))
        }
        const fee = await getEstimateCoinsTransferFee(destinationAddress, coinsToSend, wallet)
        if (available < (toSent + fee)) {
            throw new Error(t('insufficientBalance'))
        }
    }

    return (
        <div>
            <BlockTitle title={t('sendCoinsToAnotherWallet')} className={'mb-4'}/>
            <div className="d-grid gap-3">
                <input
                    className="form-control"
                    placeholder={t('newWalletAddress')}
                    value={destinationAddress}
                    disabled={sent}
                    onChange={(e) => {
                        setDestinationAddress(e.target.value)
                        setConfirmMessage(null)
                        setErrorMessage(null)
                    }}
                />
                <input
                    type="number"
                    className="form-control"
                    placeholder={t('coinsToSend')}
                    value={coinsToSend}
                    disabled={sent}
                    onChange={(e) => {
                        setCoinsToSend(e.target.value)
                        setConfirmMessage(null)
                        setErrorMessage(null)
                    }}
                />
                <MessagesBlock error={errorMessage} info={confirmMessage} success={successMessage} className="mb-0" />
                {!sent && <ButtonSendCoins onClick={() => handlerSendCoins()} />}
                <ButtonBack label={!sent && t('cancel')} />
            </div>
        </div>
    )
}

export default SendCoins
