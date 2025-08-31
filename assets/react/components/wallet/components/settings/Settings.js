import React from 'react'
import { t } from '@react/components/wallet/translations/translations'
import { BlockTitle } from '@react/components/wallet/components/form-elements/Blocks'
import {
    ButtonBack, ButtonBalancesVisibility, ButtonChangeConnection, ButtonChangePassword, ButtonClearWallet,
} from '@react/components/wallet/components/form-elements/Buttons'
import CurrentLanguage from '@react/components/wallet/components/settings/components/CurrentLanguage'

const Settings = () => (
    <div>
        <BlockTitle title={t('walletSettings')} className={'mb-4'}/>
        <div className={'d-grid gap-3'}>
            <CurrentLanguage />
            <ButtonChangeConnection />
            <ButtonBalancesVisibility />
            <ButtonChangePassword />
            <ButtonClearWallet />
            <ButtonBack />
        </div>
    </div>
)

export default Settings
