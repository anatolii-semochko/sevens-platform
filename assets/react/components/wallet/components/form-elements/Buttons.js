import React from 'react'
import clsx from 'clsx'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { t } from '@react/components/wallet/translations/translations'
import { closeWallet } from '@js/wallet'
import {
    AlignJustify, Plus, Clipboard, ArrowLeft, Lock,
    Sparkles, RotateCcw, KeyRound, CircleDollarSign, Send, FlameKindling,
    NotebookPen, Save, Repeat, Handshake, Trash2, CornerRightDown,
    FolderPen, Eye, Settings, EyeOff, RefreshCw, Wallet, GlobeLock,
} from 'lucide-react'

const iconSize = 16

const ButtonWalletClose = () => (
    <button className="btn-close ms-auto" aria-label="Close" onClick={() => closeWallet()} />
)

const ButtonWalletUnLock = ({label, icon, disabled, className}) => (
    <WalletButton
        label={label}
        className={clsx('btn-primary w-100', className)}
        disabled={disabled}
        icon={icon}
    />
)

const ButtonWalletLock = ({onClick, className}) => (
    <WalletButton
        label={t('lockWallet')}
        onClick={onClick}
        className={clsx('btn-warning w-100', className)}
        icon={<Lock size={iconSize} />}
    />
)

const ButtonBack = ({label, onClick, className}) => {
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

const ButtonWalletSelect = ({className}) => {
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

const ButtonListActions = ({onClick, className}) => (
    <WalletButton
        onClick={onClick}
        className={clsx('btn-white', className)}
        icon={<Settings size={20}/>}
    />
)

const ButtonSave = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label ? label : t('save')}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<Save size={iconSize} />}
    />
)

const ButtonSaved = ({label, onClick, className}) => (
    <WalletButton
        label={label}
        onClick={onClick}
        className={clsx('btn-outline-success w-100', className)}
        icon={<NotebookPen size={iconSize} />}
    />
)

const ButtonConfirm = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label ? label : t('confirm')}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<Handshake size={iconSize} />}
    />
)

const ButtonRemove = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label ? label : t('remove')}
        onClick={onClick}
        className={clsx('btn-danger w-100', className)}
        icon={<Trash2 size={iconSize} />}
    />
)

const ButtonRepeat = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label || t('repeat')}
        onClick={onClick}
        className={clsx('btn-outline-info w-100', className)}
        icon={<Repeat size={iconSize} />}
    />
)

const ButtonCopy = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label || t('copyAddress')}
        onClick={onClick}
        className={clsx('btn-outline-secondary w-100', className)}
        icon={<Clipboard size={iconSize} />}
    />
)

const ButtonReloadWallet = ({className}) => {
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

const ButtonSendCoins = ({onClick, className}) => (
    <WalletButton
        label={<>{t('send')} <span className="fst-italic">$SEV</span></>}
        onClick={onClick}
        className={clsx('btn-primary w-100', className)}
        icon={<Send size={iconSize} />}
    />
)

const ButtonBuyCoins = ({onClick, className}) => (
    <WalletButton
        label={t('buySevens')}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<CircleDollarSign size={iconSize} />}
    />
)

const ButtonSellCoins = ({onClick, className}) => (
    <WalletButton
        label={t('sellSevens')}
        onClick={onClick}
        className={clsx('btn-primary w-100', className)}
        icon={<CircleDollarSign size={iconSize} />}
    />
)

const ButtonReceiveCrypto = ({className}) => {
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

const ButtonWalletAdd = ({onClick, className}) => (
    <WalletButton
        label={t('addWallet')}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<Plus className="me-2 align-middle" />}
    />
)

const ButtonShowPrivateKey = ({onClick, className}) => (
    <WalletButton
        label={t('showPrivateKey')}
        onClick={onClick}
        className={clsx('btn-outline-primary w-100', className)}
        icon={<Eye size={iconSize} />}
    />
)

const ButtonWalletRename = ({onClick, className}) => (
    <WalletButton
        label={t('renameWallet')}
        onClick={onClick}
        className={clsx('btn-primary w-100', className)}
        icon={<FolderPen size={iconSize} />}
    />
)

const ButtonWalletRemove = ({onClick, className}) => (
    <WalletButton
        label={t('removeWallet')}
        onClick={onClick}
        className={clsx('btn-danger w-100', className)}
        icon={<Trash2 size={iconSize} />}
    />
)

const ButtonContinue = ({onClick, className}) => (
    <WalletButton
        label={t('continue')}
        onClick={onClick}
        className={clsx('btn-info w-100', className)}
        icon={<CornerRightDown className="me-2 align-middle" />}
    />
)

const ButtonGenerateNewWallet = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label || t('generateNewWallet')}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<Sparkles className="me-2 align-middle" />}
    />
)

const ButtonRestoreWalletFromSeed = ({onClick, className}) => (
    <WalletButton
        label={t('restoreWalletFromSeedPhrase')}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<RotateCcw className="me-2 align-middle" />}
    />
)

const ButtonTokenTransfer = ({onClick, className}) => (
    <WalletButton
        label={t('transferTokenToAnotherWallet')}
        onClick={onClick}
        className={clsx('btn-primary w-100', className)}
        icon={<Send size={iconSize} />}
    />
)

const ButtonTokenBurn = ({label, onClick, className}) => (
    <WalletButton
        label={label || t('burnToken')}
        onClick={onClick}
        className={clsx('btn-danger w-100', className)}
        icon={<FlameKindling size={iconSize} />}
    />
)

const ButtonSettings = ({onClick,className}) => (
    <WalletButton
        label={t('settings')}
        onClick={onClick}
        className={clsx('btn-warning', className)}
        icon={<Settings  size={iconSize} />}
    />
)

const ButtonBalancesVisibility = ({className}) => {
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

const ButtonChangeConnection = ({className}) => {
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

const ButtonChangePassword = ({onClick, className}) => (
    <WalletButton
        label={t('changePassword')}
        onClick={onClick}
        className={clsx('btn-primary w-100', className)}
        icon={<KeyRound size={iconSize}/>}
    />
)

const ButtonClearWallet = ({onClick, className}) => (
    <WalletButton
        label={t('clearWallet')}
        onClick={onClick}
        className={clsx('btn-danger w-100', className)}
        icon={<Trash2 size={iconSize} />}
    />
)

const WalletButton = ({label, disabled, onClick, className, icon }) => (
    <button
        className={clsx(className, 'btn cursor-pointer d-flex align-items-center justify-content-center gap-2')}
        disabled={disabled}
        onClick={onClick}
    >
        {icon} {label}
    </button>
)

export {
    iconSize,
    ButtonWalletUnLock, ButtonWalletLock, ButtonWalletClose, ButtonBack, ButtonListActions,
    ButtonWalletSelect, ButtonGenerateNewWallet, ButtonRestoreWalletFromSeed,
    ButtonWalletAdd, ButtonShowPrivateKey, ButtonWalletRename, ButtonWalletRemove,
    ButtonSave, ButtonSaved, ButtonConfirm, ButtonContinue, ButtonRepeat, ButtonCopy, ButtonRemove,
    ButtonSendCoins, ButtonBuyCoins, ButtonSellCoins,  ButtonReceiveCrypto,
    ButtonReloadWallet, ButtonTokenTransfer, ButtonTokenBurn,
    ButtonSettings, ButtonBalancesVisibility, ButtonChangePassword, ButtonClearWallet,
    ButtonChangeConnection,
}
