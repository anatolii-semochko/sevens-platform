import React, {useState} from 'react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonSendCoins } from '@react/components/wallet/components/form-elements/Buttons'
import { MessagesBlock } from '@react/components/wallet/components/form-elements/Messages'
import {
    reloadAllWallets, getWallet, sendCoins, getEstimateCoinsTransferFee,
} from '@react/components/wallet/scripts/apiActions'
import { isValidWalletAddress } from '@react/components/wallet/scripts/utils'

const SendCoins = () => {
    const [errorMessage, setErrorMessage] = useState(null)
    const [confirmMessage, setConfirmMessage] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [destinationAddress, setDestinationAddress] = useState('')
    const [coinsToSend, setCoinsToSend] = useState(0)
    const [sent, setSent] = useState(false)
    const { setWalletsList, walletData, password } = useWalletContext()

    const handlerSendCoins = async () => {
        try {
            setErrorMessage(null)
            checkForm()
            const wallet = getWallet(walletData, password)
            await checkSendCoins(wallet)
            if (!confirmMessage) {
                return setConfirmMessage(
                    `The ${coinsToSend} coins will be sent to wallet ${destinationAddress}.\nContinue?`
                )
            }
            setConfirmMessage(false)
            const transaction = await sendCoins(destinationAddress, coinsToSend * LAMPORTS_PER_SOL, wallet)
            const updated = await reloadAllWallets(password)
            setSent(true)
            setWalletsList(updated)
            setSuccessMessage(
                `${coinsToSend} ${coinsToSend === 1 ? 'coin' : 'coins'} ` +
                 `successfully sent to ${destinationAddress}.\n Transaction ${transaction}.`
            )
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    const checkForm = () => {
        if (!destinationAddress) {
            throw new Error ('No destination address')
        }
        if (!isValidWalletAddress(destinationAddress)) {
            throw new Error ('Invalid destination address')
        }
        if (!coinsToSend) {
            throw new Error ('No sum filled')
        }
    }

    const checkSendCoins = async (wallet) => {
        const toSent =  coinsToSend * LAMPORTS_PER_SOL
        const available = walletData.balance
        if (available < toSent) {
            throw new Error('Insufficient balance')
        }
        const fee = await getEstimateCoinsTransferFee(destinationAddress, coinsToSend, wallet)
        if (available < (toSent + fee)) {
            throw new Error('Insufficient balance')
        }
    }

    return (
        <div>
            <BlockTitle title={'Send coins to another wallet'} className={'mb-4'}/>
            <div className="d-grid gap-3">
                <input
                    className="form-control"
                    placeholder="New wallet address"
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
                    placeholder="New wallet address"
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
                <ButtonBack label={!sent && 'Cancel'} />
            </div>
        </div>
    )
}

export default SendCoins
