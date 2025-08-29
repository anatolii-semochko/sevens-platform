import React, { useEffect, useState } from 'react'
import { t } from '@react/components/wallet/translations/translations'
import { checkWalletByKey } from '@react/components/wallet/scripts/apiActions'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { SelectRecoveryType } from '@react/components/wallet/components/form-elements/Inputs'
import { ButtonBack } from '@react/components/wallet/components/form-elements/Buttons'
import RestoreBySeed from '@react/components/wallet/components/wallet-add/restore/RestoreBySeed'
import RestoreByPrivateKey from '@react/components/wallet/components/wallet-add/restore/RestoreByPrivateKey'
import RestoreByMnemonic from '@react/components/wallet/components/wallet-add/restore/RestoreByMnemonic'

const TYPE_PHRASE = 'phrase'
const TYPE_PRIVATE_KEY = 'privateKey'
const TYPE_SEED = 'seed'

const RestoreWallet = ({ kp, setKp, setMnemonic, setAccountInfo, setShowBlockRestoreWallet }) => {
    const [type, setType] = useState(TYPE_PHRASE)
    const [errorMessage, setErrorMessage] = useState(null)

    useEffect(() => {
        setKp(null)
    }, [type])

    useEffect(() => {
        getAccountInfo().catch(error => setErrorMessage(error.message))
    }, [kp])

    const getAccountInfo = async () => {
        try {
            if (!kp) return
            const info = await checkWalletByKey(kp)
            setAccountInfo(info)
            setShowBlockRestoreWallet(false)
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    let restoreBlock = null
    if (type === TYPE_PHRASE) restoreBlock = <RestoreByMnemonic setKp={setKp} setMnemonic={setMnemonic}/>
    if (type === TYPE_PRIVATE_KEY) restoreBlock = <RestoreByPrivateKey setKp={setKp} />
    if (type === TYPE_SEED) restoreBlock = <RestoreBySeed setKp={setKp} />

    return (
        <div>
            <BlockTitle title={t('restoreWallet')} className={'mb-4'}/>
            <div className="d-grid gap-3">
                <SelectRecoveryType
                    type={type}
                    setType={setType}
                    setErrorMessage={setErrorMessage}
                    TYPE_PHRASE={TYPE_PHRASE}
                    TYPE_PRIVATE_KEY={TYPE_PRIVATE_KEY}
                    TYPE_SEED={TYPE_SEED}
                />
                {restoreBlock}
                <ErrorMessageBlock message={errorMessage} className={'mt-2'} />
                <ButtonBack onClick={() => setShowBlockRestoreWallet(false)} />
            </div>
        </div>
    )
}

export default RestoreWallet
