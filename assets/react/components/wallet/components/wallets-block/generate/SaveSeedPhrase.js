import React from 'react'
import { ButtonBack, ButtonCopy, ButtonSaved } from '@react/components/wallet/components/form-elements/Buttons'
import { SuccessMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { copyToClipboard } from '@react/components/wallet/scripts/utils'

const SaveSeedPhrase = ({ mnemonic, setShowBlockGenerateWallet, setMnemonicSaved }) => {
    return (
        <div className="d-grid gap-3 pt-1">
            <h6 className="d-flex justify-content-center mb-0">Save Your New Wallet Seed Phrase</h6>
            <SuccessMessageBlock message={'Private Information !!! XXXXX !!!'} className={'text-danger mb-0'} />
            <div className="d-grid gap-2">
                <div className="row g-2">
                    {mnemonic.map((word, i) => (
                        <div className="col-4" key={`choice-${i}`}>
                            <button className="btn w-100">{word}</button>
                        </div>
                    ))}
                </div>
            </div>
            <ButtonCopy label={'Copy'} onClick={() => copyToClipboard(mnemonic.join(' '))} />
            <ButtonSaved label={'I saved seed phrase words'} onClick={() => setMnemonicSaved(true)} />
            <ButtonBack label={'Cancel'} onClick={() => setShowBlockGenerateWallet(false)} />
        </div>
    )
}

export default SaveSeedPhrase
