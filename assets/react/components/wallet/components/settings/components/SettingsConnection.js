import React, { useState } from 'react'
import config from '@react/components/wallet/config.json'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { currentConnectionKey } from '@react/components/wallet/scripts/utils'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonSave } from '@react/components/wallet/components/form-elements/Buttons'
import { InputConnection, SelectConnection } from '@react/components/wallet/components/form-elements/Inputs'

const SettingsConnection = () => {
    const {walletConnection, setConnection, setShowComponent} = useWalletContext()
    const [connectionName, setConnectionName] = useState(currentConnectionKey(walletConnection))
    const [connectionValue, setConnectionValue] = useState(walletConnection)

    const handlerChangeConnectionType = (value) => {
        setConnectionName(value)
        setConnectionValue(value !== 'custom' ? config.CONNECTION_ENDPOINTS[value] : '')
    }
    
    const handlerSaveConnection = () => {
        setConnection(connectionValue)
        setShowComponent({component: 'Settings'})
    }

    return (
        <div>
            <BlockTitle title={'Wallet blockchain connection'} className={'mb-4'}/>
            <div className={'d-grid gap-3'}>
                <SelectConnection value={connectionName} onChange={value => handlerChangeConnectionType(value)}/>
                <InputConnection 
                    value={connectionValue}
                    disabled={connectionName !== 'custom'}
                    onChange={value => setConnectionValue(value)}
                />
                <ButtonSave onClick={() => handlerSaveConnection()} />
                <ButtonBack />
            </div>
        </div>
    )
}

export default SettingsConnection
