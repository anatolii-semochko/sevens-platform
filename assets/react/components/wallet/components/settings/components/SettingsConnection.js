import React, { useState } from 'react'
import config from '@react/components/wallet/config.json'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { currentConnectionKey } from '@react/components/wallet/scripts/utils'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonSave } from '@react/components/wallet/components/form-elements/Buttons'
import { InputConnection, SelectConnection } from '@react/components/wallet/components/form-elements/Inputs'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'

const SettingsConnection = () => {
    const {walletConnection, setConnection, walletsList, setWalletsList, setShowComponent} = useWalletContext()
    const [connectionName, setConnectionName] = useState(currentConnectionKey(walletConnection))
    const [connectionValue, setConnectionValue] = useState(walletConnection)
    const [errorMessage, setErrorMessage] = useState(null)

    const handlerChangeConnectionType = (value) => {
        setConnectionName(value)
        setConnectionValue(value !== 'custom' ? config.CONNECTION_ENDPOINTS[value] : '')
    }

    const handlerSaveConnection = () => {
        setErrorMessage(null)
        if (!connectionValue.startsWith('http://') && !connectionValue.startsWith('https://')) {
            return setErrorMessage(t('urlConnectionError'))
        }
        setConnection(connectionValue)
        walletsList.map(w => {
            w.balance = 0
            w.tokens = []
        })
        setWalletsList(walletsList)
        setShowComponent({component: 'Settings'})
    }

    return (
        <div>
            <BlockTitle title={t('walletBlockchainConnection')} className={'mb-4'}/>
            <div className={'d-grid gap-3'}>
                <SelectConnection
                    value={connectionName}
                    onChange={value => {
                        handlerChangeConnectionType(value)
                        setErrorMessage(null)
                    }}
                />
                <InputConnection
                    value={connectionValue}
                    disabled={connectionName !== 'custom'}
                    onChange={value => {
                        setConnectionValue(value)
                        setErrorMessage(null)
                    }}
                />
                <ErrorMessageBlock message={errorMessage} className={'mb-0'} />
                <ButtonSave onClick={() => handlerSaveConnection()} />
                <ButtonBack onClick={() => setShowComponent({component: 'Settings'})}/>
            </div>
        </div>
    )
}

export default SettingsConnection
