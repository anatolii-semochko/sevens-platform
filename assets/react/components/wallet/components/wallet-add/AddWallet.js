import React, { useState, useEffect } from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { addWalletByKey } from '@react/components/wallet/scripts/apiActions'
import {
    ButtonGenerateNewWallet,
    ButtonRestoreWalletFromSeed,
    ButtonWalletAdd, ButtonBack,
} from '@react/components/wallet/components/form-elements/Buttons'
import RestoreWallet from '@react/components/wallet/components/wallet-add/restore/RestoreWallet'
import GenerateWallet from '@react/components/wallet/components/wallet-add/generate/GenerateWallet'
import { getNextWalletName, checkWalletName } from '@react/components/wallet/scripts/utils'
import { BlockTitle, WalletInfo } from '@react/components/wallet/components/form-elements/Blocks'
import { MessagesBlock } from '@react/components/wallet/components/form-elements/Messages'
import { InputNewWalletName } from '@react/components/wallet/components/form-elements/Inputs'

const AddWallet = ({backClick}) => {
    const {walletsList, password, setWalletByPublicKey, setShowComponent, walletReload} = useWalletContext()
    const [showBlockGenerateWallet, setShowBlockGenerateWallet] = useState(false)
    const [showBlockRestoreWallet, setShowBlockRestoreWallet] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [walletName, setWalletName] = useState('')
    const [kp, setKp] = useState(null)
    const [mnemonic, setMnemonic] = useState(null)
    const [accountInfo, setAccountInfo] = useState(null)

    useEffect(() => {
        setWalletName(getNextWalletName(walletsList))
    }, [walletsList])

    const handlerAddWallet = async () => {
        try {
            checkWalletName(walletsList, walletName, kp.publicKey.toString())
            addWalletByKey(walletName, kp, password, mnemonic)
                .then(async () => {
                    await walletReload()
                    setWalletByPublicKey(kp.publicKey.toString())
                })
                .catch(error => setErrorMessage(error.message))
            setShowComponent(null)
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    if (showBlockGenerateWallet) return <GenerateWallet
        setKp={setKp}
        setMnemonic={setMnemonic}
        setShowBlockGenerateWallet={setShowBlockGenerateWallet}
    />
    if (showBlockRestoreWallet) return <RestoreWallet
        kp={kp}
        setKp={setKp}
        setMnemonic={setMnemonic}
        setAccountInfo={setAccountInfo}
        setShowBlockRestoreWallet={setShowBlockRestoreWallet}
    />

    return (
        <div>
            <BlockTitle title={t('addNewWallet')} />
            <div className="d-grid gap-3 pt-1">
                <MessagesBlock error={errorMessage} className={'mb-0'}/>
                {kp ? <>
                    {!!accountInfo && <WalletInfo accountInfo={accountInfo} />}
                    <InputNewWalletName
                        walletName={walletName}
                        setWalletName={setWalletName}
                        setErrorMessage={setErrorMessage}
                    />
                    <ButtonWalletAdd onClick={() => handlerAddWallet()} className={'mt-1'}/>
                </> : <>
                    <ButtonGenerateNewWallet onClick={() => setShowBlockGenerateWallet(true)} setKp={setKp}/>
                    <ButtonRestoreWalletFromSeed onClick={() => setShowBlockRestoreWallet(true)} />
                </>}
                <ButtonBack onClick={backClick} />
            </div>
        </div>
    )
}

export default AddWallet
