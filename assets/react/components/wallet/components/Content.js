import React from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'
import useWalletContext from '../hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { BlockTitle, ConnectionInfo } from '@react/components/wallet/components/form-elements/Blocks'
import { ButtonSettings, ButtonWalletAdd, ButtonWalletSelect } from '@react/components/wallet/components/form-elements/Buttons'
import Main from '@react/components/wallet/components/wallet-block/Main'
import TokensList from '@react/components/wallet/components/tokens-list/TokensList'
import ShowComponent from '@react/components/wallet/components/components-map/ShowComponent'

const Content = () => {
    const {walletData, walletsList, showComponent, setShowComponent} = useWalletContext()

    if (walletsList === null) return (
        <div className="d-flex justify-content-center mt-3">
            <div className="spinner-border" role="status">
                <span className="visually-hidden">{t('loading')}</span>
            </div>
        </div>
    )

    if (showComponent) return (
        <div>
            <ConnectionInfo />
            <ShowComponent />
        </div>
    )

    if (walletsList.length === 0) return (
        <div>
            <BlockTitle title={t('noWallets')} className={'mb-0'}/>
            <div className={'d-grid gap-3'}>
                <ButtonWalletAdd onClick={() => setShowComponent({component: 'AddWallet'})} className={'mt-1'} />
                <ButtonSettings onClick={() => setShowComponent({component: 'Settings'})} className={'w-100'}/>
            </div>
        </div>
    )

    return (
        <div>
            <ConnectionInfo />
            <ButtonWalletSelect />
            <Main walletData={walletData}/>
            <TokensList tokens={walletData?.tokens} />
        </div>
    )
}

export default Content
