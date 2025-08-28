import React from 'react'
import clsx from 'clsx'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { reloadAllWallets } from '@react/components/wallet/scripts/apiActions'
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
        label={'Lock wallet'}
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
            label={label || 'Back'}
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
            label={`Select wallet (${walletsList.length} available)`}
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
        label={label ? label : 'Save'}
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
        label={label ? label : 'Confirm'}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<Handshake size={iconSize} />}
    />
)

const ButtonRemove = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label ? label : 'Remove'}
        onClick={onClick}
        className={clsx('btn-danger w-100', className)}
        icon={<Trash2 size={iconSize} />}
    />
)

const ButtonRepeat = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label || 'Repeat'}
        onClick={onClick}
        className={clsx('btn-outline-info w-100', className)}
        icon={<Repeat size={iconSize} />}
    />
)

const ButtonCopy = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label || 'Copy address'}
        onClick={onClick}
        className={clsx('btn-outline-secondary w-100', className)}
        icon={<Clipboard size={iconSize} />}
    />
)

const ButtonReloadWallet = ({className}) => {
    const { setWalletsList, password } = useWalletContext()
    const handleReload = async () => {
        if (password) {
            const updated = await reloadAllWallets(password)
            setWalletsList(updated)
        }
    }
    return (
        <WalletButton
            label={'Reload all'}
            onClick={handleReload}
            className={clsx('btn-secondary w-50', className)}
            icon={<RefreshCw size={iconSize} />}
        />
    )
}

const ButtonSendCoins = ({onClick, className}) => (
    <WalletButton
        label={<>Send <span className="fst-italic">$SEV</span></>}
        onClick={onClick}
        className={clsx('btn-primary w-100', className)}
        icon={<Send size={iconSize} />}
    />
)

const ButtonBuyCoins = ({onClick, className}) => (
    <WalletButton
        label={'Buy Sevens'}
        onClick={onClick}
        className={clsx('btn-success w-50', className)}
        icon={<CircleDollarSign size={iconSize} />}
    />
)

const ButtonSellCoins = ({onClick, className}) => (
    <WalletButton
        label={'Sell Sevens'}
        onClick={onClick}
        className={clsx('btn-primary w-50', className)}
        icon={<CircleDollarSign size={iconSize} />}
    />
)

const ButtonReceiveCrypto = ({className}) => {
    const { setShowComponent } = useWalletContext()
    return (
        <WalletButton
            label={'Receive crypto'}
            onClick={() => setShowComponent({component: 'AddressCopy'})}
            className={clsx('btn-success w-100', className)}
            icon={<Wallet size={iconSize} />}
        />
    )
}

const ButtonWalletAdd = ({onClick, className}) => (
    <WalletButton
        label={'Add wallet'}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<Plus className="me-2 align-middle" />}
    />
)

const ButtonShowPrivateKey = ({onClick, className}) => (
    <WalletButton
        label={'Show private key'}
        onClick={onClick}
        className={clsx('btn-outline-primary w-100', className)}
        icon={<Eye size={iconSize} />}
    />
)

const ButtonWalletRename = ({onClick, className}) => (
    <WalletButton
        label={'Rename wallet'}
        onClick={onClick}
        className={clsx('btn-primary w-100', className)}
        icon={<FolderPen size={iconSize} />}
    />
)

const ButtonWalletRemove = ({onClick, className}) => (
    <WalletButton
        label={'Remove wallet'}
        onClick={onClick}
        className={clsx('btn-danger w-100', className)}
        icon={<Trash2 size={iconSize} />}
    />
)

const ButtonContinue = ({onClick, className}) => (
    <WalletButton
        label={'Continue'}
        onClick={onClick}
        className={clsx('btn-info w-100', className)}
        icon={<CornerRightDown className="me-2 align-middle" />}
    />
)

const ButtonGenerateNewWallet = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label || 'Generate New Wallet'}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<Sparkles className="me-2 align-middle" />}
    />
)

const ButtonRestoreWalletFromSeed = ({onClick, className}) => (
    <WalletButton
        label={'Restore Wallet From Seed Phrase'}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<RotateCcw className="me-2 align-middle" />}
    />
)

const ButtonTokenTransfer = ({onClick, className}) => (
    <WalletButton
        label={'Transfer Token To Another Wallet'}
        onClick={onClick}
        className={clsx('btn-primary w-100', className)}
        icon={<Send size={iconSize} />}
    />
)

const ButtonTokenBurn = ({label, onClick, className}) => (
    <WalletButton
        label={label || 'Burn Token'}
        onClick={onClick}
        className={clsx('btn-danger w-100', className)}
        icon={<FlameKindling size={iconSize} />}
    />
)

const ButtonSettings = ({onClick,className}) => (
    <WalletButton
        label={'Settings'}
        onClick={onClick}
        className={clsx('btn-warning', className)}
        icon={<Settings  size={iconSize} />}
    />
)

const ButtonBalancesVisibility = ({className}) => {
    const {hideBalances, setHideBalances} = useWalletContext()
    return (
        <WalletButton
            label={hideBalances ? 'Hide balances' : 'Show Balances'}
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
            label={'Connection to blockchain net'}
            onClick={() => setShowComponent({component: 'SettingsConnection'})}
            className={clsx('btn-primary w-100', className)}
            icon={<GlobeLock size={iconSize}/>}
        />
    )
}

const ButtonChangePassword = ({onClick, className}) => (
    <WalletButton
        label={'Change password'}
        onClick={onClick}
        className={clsx('btn-primary w-100', className)}
        icon={<KeyRound size={iconSize}/>}
    />
)

const ButtonClearWallet = ({onClick, className}) => (
    <WalletButton
        label={'Clear wallet'}
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
