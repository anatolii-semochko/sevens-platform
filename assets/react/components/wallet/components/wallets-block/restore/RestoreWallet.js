import React, { useEffect, useState } from 'react'
import { addWalletByKey, checkWalletByKey, reloadAllWallets } from '@react/components/wallet/scripts/apiAction'
import { getNextWalletName, checkWalletName } from '@react/components/wallet/scripts/utils'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import RestoreBySeed from '@react/components/wallet/components/wallets-block/restore/RestoreBySeed'
import RestoreByPrivateKey from '@react/components/wallet/components/wallets-block/restore/RestoreByPrivateKey'
import RestoreByMnemonic from '@react/components/wallet/components/wallets-block/restore/RestoreByMnemonic'
import { ButtonAddWallet, ButtonBack } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import {
    WalletInfo, InputNewWalletName, SelectRecoveryType, 
} from '@react/components/wallet/components/wallets-block/components/AddWalletComponents'

const TYPE_PHRASE = 'phrase'
const TYPE_PRIVATE_KEY = 'privateKey'
const TYPE_SEED = 'seed'

const RestoreWallet = ({ setShowBlockRestoreWallet }) => {
    const { walletsList, setWalletsList, setWalletIndex, password, setShowComponent } = useWalletContext()
    const [type, setType] = useState(TYPE_PHRASE)
    const [walletName, setWalletName] = useState('')
    const [accountInfo, setAccountInfo] = useState(null)
    const [kp, setKp] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    useEffect(() => {
        setWalletName(getNextWalletName(walletsList))
    }, [walletsList])

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
        } catch (error) {
            setErrorMessage(error.message)
        }
    }  

    const handlerAddWallet = () => {
        try {
            checkWalletName(walletsList, walletName, kp.publicKey.toString())
            addWalletByKey(walletName, kp, password)
                .then(() => reloadAllWallets()
                    .then(setWalletsList).catch(error => setErrorMessage(error.message))
                    .then(() => setWalletIndex(walletsList.length)).catch(error => setErrorMessage(error.message))
                ).catch(error => setErrorMessage(error.message))
            setShowComponent(null)
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    let restoreBlock = null
    if (type === TYPE_PHRASE) restoreBlock = <RestoreByMnemonic setKp={setKp} />
    if (type === TYPE_PRIVATE_KEY) restoreBlock = <RestoreByPrivateKey setKp={setKp} />
    if (type === TYPE_SEED) restoreBlock = <RestoreBySeed setKp={setKp} />

    return (
        <>
            <h6 className="d-flex justify-content-center">Restore Wallet</h6>
            {accountInfo ? <>
                <WalletInfo accountInfo={accountInfo} />
                <InputNewWalletName
                    walletName={walletName}
                    setWalletName={setWalletName}
                    setErrorMessage={setErrorMessage}
                />
                <ErrorMessageBlock message={errorMessage} className={'mt-1 mb-0'} />
                <ButtonAddWallet onClick={() => handlerAddWallet()} className={'mt-1'} />
            </> : <>
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
            </>}
            <div className="d-flex gap-2 mt-1">
                <ButtonBack label="Back" onClick={() => setShowBlockRestoreWallet(false)} />
            </div>
        </>
    )
}

export default RestoreWallet
