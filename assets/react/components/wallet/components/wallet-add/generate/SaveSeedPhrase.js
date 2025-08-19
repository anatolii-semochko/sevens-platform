import React from 'react'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonCopy, ButtonSaved } from '@react/components/wallet/components/form-elements/Buttons'
import { SuccessMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { copyToClipboard } from '@react/components/wallet/scripts/utils'

const SaveSeedPhrase = ({ mnemonic, setShowBlockGenerateWallet, setMnemonicSaved }) => {
    return (
        <div>
            <BlockTitle title={'Save Your New Wallet Seed Phrase'} />
            <div className="d-grid gap-3 pt-1">
                <SuccessMessageBlock message={'Private Information !!! XXXXX !!!'} className={'text-danger mb-0'} />
                <div className="d-grid gap-2">
                    <div className="row g-2">
                        {mnemonic.split(' ').map((word, i) => (
                            <div className="col-4" key={`choice-${i}`}>
                                <button className="btn w-100">{word}</button>
                            </div>
                        ))}
                    </div>
                </div>
                <ButtonCopy label={'Copy'} onClick={() => copyToClipboard(mnemonic)} />
                <ButtonSaved label={'I saved seed phrase words'} onClick={() => setMnemonicSaved(true)} />
                <ButtonBack label={'Cancel'} onClick={() => setShowBlockGenerateWallet(false)} />
            </div>
        </div>
    )
}

export default SaveSeedPhrase
