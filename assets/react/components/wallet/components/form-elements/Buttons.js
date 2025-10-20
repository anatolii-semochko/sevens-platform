import React from 'react'
import clsx from 'clsx'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { closeWallet } from '@js/wallet'
import {
    House, AlignJustify, Plus, Clipboard, ArrowLeft, Lock, Signature,
    Sparkles, RotateCcw, KeyRound, CircleDollarSign, Send, FlameKindling,
    NotebookPen, Save, Repeat, Handshake, Trash2, CornerRightDown,
    FolderPen, Eye, Settings, EyeOff, RefreshCw, Wallet, GlobeLock,
} from 'lucide-react'

export const iconSize = 16

export const ButtonWalletClose = () => {

    // TODO - close wallet connection

    return (
        <button className="btn-close ms-auto" aria-label="Close" onClick={() => closeWallet()} />
    )
}

export const ButtonWalletUnLock = ({label, icon, disabled, className}) => (
    <WalletButton
        label={label}
        className={clsx('btn-primary w-100', className)}
        disabled={disabled}
        icon={icon}
    />
)

export const ButtonWalletLock = ({onClick, className}) => (
    <WalletButton
        label={t('lockWallet')}
        onClick={onClick}
        className={clsx('btn-warning flex-grow-1 d-flex align-items-center justify-content-center gap-2', className)}
        icon={<Lock size={iconSize} />}
    />
)

export const ButtonBack = ({label, onClick, className}) => {
    const { setShowComponent } = useWalletContext()
    return (
        <WalletButton
            key={label}
            label={label || t('back')}
            onClick={onClick || (() => setShowComponent(null))}
            className={clsx('btn-warning w-100', className)}
            icon={<ArrowLeft size={iconSize} />}
        />
    )
}

export const ButtonWalletSelect = ({className}) => {
    const { walletsList, setShowComponent } = useWalletContext()
    return (
        <WalletButton
            label={`${t('selectWallet')} (${walletsList.length} ${t('available')})`}
            onClick={() => setShowComponent({component: 'WalletsList'})}
            className={clsx('btn btn-white w-100 gap-3', className)}
            icon={<AlignJustify size={iconSize} />}
        />
    )
}

export const ButtonListActions = ({onClick, className}) => (
    <WalletButton
        onClick={onClick}
        className={clsx('btn-white', className)}
        icon={<Settings size={20}/>}
    />
)

export const ButtonSave = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label ? label : t('save')}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<Save size={iconSize} />}
    />
)

export const ButtonSaved = ({label, onClick, className}) => (
    <WalletButton
        label={label}
        onClick={onClick}
        className={clsx('btn-outline-success w-100', className)}
        icon={<NotebookPen size={iconSize} />}
    />
)

export const ButtonConfirm = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label ? label : t('confirm')}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<Handshake size={iconSize} />}
    />
)

export const ButtonRepeat = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label || t('repeat')}
        onClick={onClick}
        className={clsx('btn-outline-info w-100', className)}
        icon={<Repeat size={iconSize} />}
    />
)

export const ButtonCopy = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label || t('copyAddress')}
        onClick={onClick}
        className={clsx('btn-outline-secondary w-100', className)}
        icon={<Clipboard size={iconSize} />}
    />
)

export const ButtonReloadWallet = ({className}) => {
    const {walletReload} = useWalletContext()
    return (
        <WalletButton
            label={t('reloadAll')}
            onClick={walletReload}
            className={clsx('btn-secondary w-100', className)}
            icon={<RefreshCw size={iconSize} />}
        />
    )
}

export const ButtonSendCoins = ({onClick, className}) => (
    <WalletButton
        label={<>{t('send')} <span className="fst-italic">$SEV</span></>}
        onClick={onClick}
        className={clsx('btn-primary w-100', className)}
        icon={<Send size={iconSize} />}
    />
)

export const ButtonBuyCoins = ({onClick, className}) => (
    <WalletButton
        label={t('buySevens')}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<CircleDollarSign size={iconSize} />}
    />
)

export const ButtonSellCoins = ({onClick, className}) => (
    <WalletButton
        label={t('sellSevens')}
        onClick={onClick}
        className={clsx('btn-primary w-100', className)}
        icon={<CircleDollarSign size={iconSize} />}
    />
)

export const ButtonReceiveCrypto = ({className}) => {
    const { setShowComponent } = useWalletContext()
    return (
        <WalletButton
            label={t('receiveCryptoAction')}
            onClick={() => setShowComponent({component: 'AddressCopy'})}
            className={clsx('btn-success w-100', className)}
            icon={<Wallet size={iconSize} />}
        />
    )
}

export const ButtonSign = ({label, onClick, disabled, className}) => (
    <WalletButton
        label={label}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        disabled={disabled}
        icon={<Signature size={iconSize} />}
    />
)

export const ButtonCancelSign = ({label, onClick, className}) => (
    <WalletButton
        label={label || t('cancel')}
        onClick={onClick}
        className={clsx('btn-outline-secondary', className)}
    />
)

export const ButtonWalletAdd = ({onClick, className}) => (
    <WalletButton
        label={t('addWallet')}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<Plus className="me-2 align-middle" />}
    />
)

export const ButtonShowPrivateKey = ({onClick, className}) => (
    <WalletButton
        label={t('showPrivateKey')}
        onClick={onClick}
        className={clsx('btn-outline-primary w-100', className)}
        icon={<Eye size={iconSize} />}
    />
)

export const ButtonWalletRename = ({onClick, className}) => (
    <WalletButton
        label={t('renameWallet')}
        onClick={onClick}
        className={clsx('btn-primary w-100', className)}
        icon={<FolderPen size={iconSize} />}
    />
)

export const ButtonWalletRemove = ({onClick, className}) => (
    <WalletButton
        label={t('removeWallet')}
        onClick={onClick}
        className={clsx('btn-danger w-100', className)}
        icon={<Trash2 size={iconSize} />}
    />
)

export const ButtonContinue = ({onClick, className}) => (
    <WalletButton
        label={t('continue')}
        onClick={onClick}
        className={clsx('btn-info w-100', className)}
        icon={<CornerRightDown className="me-2 align-middle" />}
    />
)

export const ButtonGenerateNewWallet = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label || t('generateNewWallet')}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<Sparkles className="me-2 align-middle" />}
    />
)

export const ButtonRestoreWalletFromSeed = ({onClick, className}) => (
    <WalletButton
        label={t('restoreWalletFromSeedPhrase')}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<RotateCcw className="me-2 align-middle" />}
    />
)

export const ButtonTokenTransfer = ({onClick, className}) => (
    <WalletButton
        label={t('transferTokenToAnotherWallet')}
        onClick={onClick}
        className={clsx('btn-primary w-100', className)}
        icon={<Send size={iconSize} />}
    />
)

export const ButtonTokenBurn = ({label, onClick, className}) => (
    <WalletButton
        label={label || t('burnToken')}
        onClick={onClick}
        className={clsx('btn-danger w-100', className)}
        icon={<FlameKindling size={iconSize} />}
    />
)

export const ButtonHome = ({className}) => {
    const {setShowComponent} = useWalletContext()
    return (
        <WalletButton
            title={'Home'}
            onClick={() => setShowComponent(null)}
            className={clsx('btn-warning d-flex align-items-center justify-content-center gap-2', className)}
            icon={<House  size={iconSize} />}
        />
    )
}

export const ButtonSettings = ({className}) => {
    const {setShowComponent} = useWalletContext()
    return (
        <WalletButton
            title={'Settings'}
            onClick={() => setShowComponent({component: 'Settings'})}
            className={clsx('btn-warning d-flex align-items-center justify-content-center gap-2', className)}
            icon={<Settings  size={iconSize} />}
        />
    )
}

export const ButtonBalancesVisibility = ({className}) => {
    const {hideBalances, setHideBalances} = useWalletContext()
    return (
        <WalletButton
            label={hideBalances ? t('showBalances') : t('hideBalances')}
            onClick={() => setHideBalances(!hideBalances)}
            className={clsx('w-100', hideBalances ? 'btn-outline-success' : 'btn-success', className)}
            icon={hideBalances ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
        />
    )
}

export const ButtonChangeConnection = ({className}) => {
    const {setShowComponent} = useWalletContext()
    return (
        <WalletButton
            label={t('changeNetwork')}
            onClick={() => setShowComponent({component: 'SettingsConnection'})}
            className={clsx('btn-primary w-100', className)}
            icon={<GlobeLock size={iconSize}/>}
        />
    )
}

export const ButtonChangePassword = ({onClick, className}) => {
    const {setShowComponent} = useWalletContext()
    return (
        <WalletButton
            label={t('changePassword')}
            onClick={onClick || (() => setShowComponent({component: 'ChangePassword'}))}
            className={clsx('btn-primary w-100', className)}
            icon={<KeyRound size={iconSize}/>}
        />
    )
}

export const ButtonClearWallet = ({onClick, className}) => {
    const {setShowComponent} = useWalletContext()
    return (
        <WalletButton
            label={t('clearWallet')}
            onClick={onClick || (() => setShowComponent({component: 'WalletClear'}))}
            className={clsx('btn-danger w-100', className)}
            icon={<Trash2 size={iconSize} />}
        />
    )
}

const WalletButton = ({label, title, disabled, onClick, className, icon }) => (
    <button
        className={clsx(className, 'btn cursor-pointer d-flex align-items-center justify-content-center gap-2')}
        title={title}
        disabled={disabled}
        onClick={onClick}
    >
        {icon} {label}
    </button>
)
