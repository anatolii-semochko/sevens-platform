import React, {useState} from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { ButtonBack, ButtonTokenTransfer} from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock, InfoMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { reloadAllWallets, transferToken, getWallet } from '@react/components/wallet/scripts/apiAction'
import { isValidWalletAddress } from '@react/components/wallet/scripts/utils'

const TokenTransfer = ({ token, setBlockTransfer, setTokenAvailable, setSuccessMessage }) => {
    const [errorMessage, setErrorMessage] = useState(null)
    const [confirmMessage, setConfirmMessage] = useState(null)
    const [transferDestinationAddress, setTransferDestinationAddress] = useState('')
    const { setWalletsList, walletData, password } = useWalletContext()

    const handlerTransferToken = async () => {
        setErrorMessage(null)
        if (!transferDestinationAddress) {
            return setErrorMessage('No destination address')
        }
        if (!isValidWalletAddress(transferDestinationAddress)) {
            return setErrorMessage('Invalid destination address')
        }
        if (!confirmMessage) {
            return setConfirmMessage(
                `The token will be transferred to wallet ${transferDestinationAddress} ` +
                `and will no longer be available in your current wallet.\nContinue?`
            )
        }
        setConfirmMessage(false)
        try {
            const wallet = getWallet(walletData, password)
            const transaction = await transferToken(token.mint, transferDestinationAddress, wallet)
            const updated = await reloadAllWallets()
            setTokenAvailable(false)
            setBlockTransfer(false)
            setWalletsList(updated)
            setSuccessMessage(
                `Token successfully transferred to ${transferDestinationAddress}.\n Transaction ${transaction}.`
            )
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <>
            <label className="text-center">Transfer token to another wallet:</label>
            <input
                className="form-control"
                placeholder="New wallet address"
                value={transferDestinationAddress}
                onChange={(e) => {
                    setTransferDestinationAddress(e.target.value)
                    setErrorMessage(null)
                }}
            />
            <ErrorMessageBlock message={errorMessage} />
            <InfoMessageBlock message={confirmMessage} />
            <ButtonTokenTransfer onClick={handlerTransferToken} />
            <ButtonBack label={'Cancel Token Transfer'} onClick={() => setBlockTransfer(false)} />
        </>
    )
}

export default TokenTransfer
