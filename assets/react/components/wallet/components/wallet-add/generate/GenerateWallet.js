import React, {useState} from 'react'
import { getGeneratedMnemonic, getKeyFromMnemonic, BIP_DEFAULT } from '@react/components/wallet/scripts/crypto'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonGenerateNewWallet } from '@react/components/wallet/components/form-elements/Buttons'
import { MessagesBlock, SuccessMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { SelectPhraseLength } from '@react/components/wallet/components/form-elements/Inputs'
import SaveSeedPhrase from '@react/components/wallet/components/wallet-add/generate/SaveSeedPhrase'
import ConfirmWallet from '@react/components/wallet/components/wallet-add/generate/ConfirmWallet'

const GenerateWallet = ({ setKp, setMnemonic, setShowBlockGenerateWallet }) => {
    const [errorMessage, setErrorMessage] = useState(null)
    const [informGenerateMessage, setInformGenerateMessage] = useState(null)
    const [seedLength, setSeedLength] = useState(BIP_DEFAULT)
    const [mnemonic, setInputMnemonic] = useState(null)
    const [mnemonicSaved, setMnemonicSaved] = useState(null)

    const handlerGenerateWallet = () => {
        try {
            setErrorMessage(null)
            if (!informGenerateMessage) {
                return setInformGenerateMessage('Private Information !!! XXXXX !!!') // TODO
            }
            setInformGenerateMessage(false)
            setInputMnemonic(getGeneratedMnemonic(seedLength))
        } catch (error) {
            setErrorMessage(error)
        }
    }

    const handleMnemonicConfirmed = async () => {
        try {
            const kp = await getKeyFromMnemonic(mnemonic)
            setKp(kp)
            setMnemonic(mnemonic)
            setShowBlockGenerateWallet(false)
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    if (mnemonicSaved) return <ConfirmWallet
        mnemonic={mnemonic.split(' ')}
        setMnemonicSaved={setMnemonicSaved}
        handleMnemonicConfirmed={handleMnemonicConfirmed}
    />

    if (mnemonic) return <SaveSeedPhrase
        mnemonic={mnemonic}
        setShowBlockGenerateWallet={setShowBlockGenerateWallet}
        setMnemonicSaved={setMnemonicSaved}
    />

    return (
        <div>
            <BlockTitle title={'Generate New Wallet'} className={'mb-4'}/>
            <div className="d-grid gap-3">
                <SelectPhraseLength value={seedLength} onChange={(value) => setSeedLength(value)} />
                <SuccessMessageBlock message={informGenerateMessage} className={'text-danger mb-0'} />
                <MessagesBlock error={errorMessage} className={'mb-0'}/>
                <ButtonGenerateNewWallet
                    label={informGenerateMessage ? 'Continue' : 'Generate'}
                    onClick={() => handlerGenerateWallet()}
                />
                <ButtonBack label={'Cancel'} onClick={() => setShowBlockGenerateWallet(false)} />
            </div>
        </div>
    )
}

export default GenerateWallet
