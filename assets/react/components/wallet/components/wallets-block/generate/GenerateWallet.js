import React, {useState} from 'react'
import { getGeneratedMnemonic, BIP_DEFAULT } from '@react/components/wallet/scripts/crypto'
import { ButtonBack, ButtonGenerateNewWallet } from '@react/components/wallet/components/form-elements/Buttons'
import { MessagesBlock, SuccessMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { SelectPhraseLength } from '@react/components/wallet/components/wallets-block/components/AddWalletComponents'
import SaveSeedPhrase from '@react/components/wallet/components/wallets-block/generate/SaveSeedPhrase'
import ConfirmWallet from '@react/components/wallet/components/wallets-block/generate/ConfirmWallet'

const GenerateWallet = ({ setMnemonic, setShowBlockGenerateWallet }) => {
    const [errorMessage, setErrorMessage] = useState(null)
    const [informGenerateMessage, setInformGenerateMessage] = useState(null)
    const [seedLength, setSeedLength] = useState(BIP_DEFAULT)
    const [mnemonic, setInputMnemonic] = useState(null)
    const [mnemonicSaved, setMnemonicSaved] = useState(null)

    const handlerGenerateWallet = () => {
        try {
            setErrorMessage(null)
            if (!informGenerateMessage) {
                return setInformGenerateMessage('Private Information !!! XXXXX !!!')
            }
            setInformGenerateMessage(false)
            setInputMnemonic(getGeneratedMnemonic(seedLength).split(' '))
        } catch (error) {
            setErrorMessage(error)
        }
    }

    const handleMnemonicConfirmed = () => {
        setMnemonic(mnemonic)
        setShowBlockGenerateWallet(false)
    }

    if (mnemonicSaved) return <ConfirmWallet
        mnemonic={mnemonic}
        setMnemonicSaved={setMnemonicSaved}
        handleMnemonicConfirmed={handleMnemonicConfirmed}
    />

    if (mnemonic) return <SaveSeedPhrase
        mnemonic={mnemonic}
        setShowBlockGenerateWallet={setShowBlockGenerateWallet}
        setMnemonicSaved={setMnemonicSaved}
    />

    return (
        <div className="d-grid gap-3 pt-1">
            <h6 className="d-flex justify-content-center mb-0">Generate New Wallet</h6>
            <SelectPhraseLength value={seedLength} onChange={(value) => setSeedLength(value)} />
            <SuccessMessageBlock message={informGenerateMessage} className={'text-danger mb-0'} />
            <MessagesBlock error={errorMessage} className={'mb-0'}/>
            <ButtonGenerateNewWallet
                label={informGenerateMessage ? 'Continue' : 'Generate'}
                onClick={() => handlerGenerateWallet()}
            />
            <ButtonBack label={'Cancel'} onClick={() => setShowBlockGenerateWallet(false)} />
        </div>
    )
}

export default GenerateWallet
