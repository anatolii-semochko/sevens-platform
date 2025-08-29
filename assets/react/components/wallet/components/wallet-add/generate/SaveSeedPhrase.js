import React from 'react'
import { t } from '@react/components/wallet/translations/translations'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonCopy, ButtonSaved } from '@react/components/wallet/components/form-elements/Buttons'
import { SuccessMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { copyToClipboard } from '@react/components/wallet/scripts/utils'

const SaveSeedPhrase = ({ mnemonic, setShowBlockGenerateWallet, setMnemonicSaved }) => {
    return (
        <div>
            <BlockTitle title={t('saveSeedPhrase')} />
            <div className="d-grid gap-3 pt-1">
                <SuccessMessageBlock message={t('privateInfoWarning')} className={'text-danger mb-0'} />
                <div className="d-grid gap-2">
                    <div className="row g-2">
                        {mnemonic.split(' ').map((word, i) => (
                            <div className="col-4" key={`choice-${i}`}>
                                <button className="btn w-100">{word}</button>
                            </div>
                        ))}
                    </div>
                </div>
                <ButtonCopy label={t('copy')} onClick={() => copyToClipboard(mnemonic)} />
                <ButtonSaved label={t('iSavedSeedPhraseWords')} onClick={() => setMnemonicSaved(true)} />
                <ButtonBack label={t('cancel')} onClick={() => setShowBlockGenerateWallet(false)} />
            </div>
        </div>
    )
}

export default SaveSeedPhrase
