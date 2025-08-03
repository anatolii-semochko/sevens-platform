import React from 'react'
import clsx from 'clsx'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import WalletTranslation from '@react/components/wallet/components/form-elements/WalletTranslation'
import { closeWallet } from '@js/wallet'
import {
    Plus, Clipboard, ArrowLeft, Unlock, Lock, Sparkles, RotateCcw,
    NotebookPen, Save, Repeat, Handshake, Trash2, CornerRightDown
} from 'lucide-react'
import { FaPaperPlane, FaRedo, FaWallet, FaBurn } from 'react-icons/fa'
import { reloadAllWallets } from '@react/components/wallet/scripts/apiAction'

const ButtonWalletClose = () => (
    <button className="btn-close ms-auto" aria-label="Close" onClick={() => closeWallet()} />
)

const ButtonWalletUnLock = ({className}) => (
    <WalletButton
        label={'Activate wallet'}
        className={clsx('btn-primary w-100', className)}
        icon={<Unlock size={16} />}
    />
)

const ButtonWalletLock = ({onClick, className}) => (
    <WalletButton
        label={'Lock wallet'}
        onClick={onClick}
        className={clsx('btn-warning w-100', className)}
        icon={<Lock size={16} />}
    />
)

const ButtonBack = ({label, onClick, className}) => {
    const { setShowComponent } = useWalletContext()
    return (
        <WalletButton
            key={label}
            label={label || 'Back to wallet'}
            onClick={onClick || (() => setShowComponent(null))}
            className={clsx('btn-warning w-100', className)}
            icon={<ArrowLeft size={16} />}
        />
    )
}

const ButtonSave = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label ? label : 'Save'}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<Save size={16} />}
    />
)

const ButtonSaved = ({label, onClick, className}) => (
    <WalletButton
        label={label}
        onClick={onClick}
        className={clsx('btn-outline-success w-100', className)}
        icon={<NotebookPen size={16} />}
    />
)

const ButtonConfirm = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label ? label : 'Confirm'}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<Handshake size={16} />}
    />
)

const ButtonRemove = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label ? label : 'Remove'}
        onClick={onClick}
        className={clsx('btn-danger w-100', className)}
        icon={<Trash2 size={16} />}
    />
)

const ButtonRepeat = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label || 'Repeat'}
        onClick={onClick}
        className={clsx('btn-outline-info w-100', className)}
        icon={<Repeat size={16} />}
    />
)

const ButtonCopy = ({label, onClick, className}) => (
    <WalletButton
        key={label}
        label={label || 'Copy address'}
        onClick={onClick}
        className={clsx('btn-outline-secondary w-100', className)}
        icon={<Clipboard size={16} />}
    />
)

const ButtonReloadWallet = ({className}) => {
    const { setWalletsList } = useWalletContext()
    const handleReload = async () => {
        const updated = await reloadAllWallets()
        setWalletsList(updated)
    }
    return (
        <WalletButton
            label={'Reload all'}
            onClick={handleReload}
            className={clsx('btn-secondary w-100', className)}
            icon={<FaRedo className="me-2 align-middle" />}
        />
    )
}

const ButtonSendCoins = ({onClick, className}) => {
    return (
        <WalletButton
            label={<><WalletTranslation text={'Send'} /> <span className="fst-italic">$SEV</span></>}
            onClick={onClick}
            className={clsx('btn-primary w-100', className)}
            icon={<FaPaperPlane className="me-2 align-middle" />}
        />
    )
}

const ButtonBuyCoins = ({onClick, className}) => (
    <WalletButton
        label={'Buy Sevens with cash'}
        onClick={onClick}
        className={clsx('btn-success w-100', className)}
        icon={<FaWallet className="me-2 align-middle" />}
    />
)

const ButtonReceiveCrypto = ({className}) => {
    const { setShowComponent } = useWalletContext()
    return (
        <WalletButton
            label={'Receive crypto'}
            onClick={() => setShowComponent({component: 'AddressCopy'})}
            className={clsx('btn-success w-100', className)}
            icon={<FaWallet className="me-2 align-middle" />}
        />
    )
}

const ButtonAddWallet = ({onClick, className}) => {
    return (
        <WalletButton
            label={'Add wallet'}
            onClick={onClick}
            className={clsx('btn-success w-100', className)}
            icon={<Plus className="me-2 align-middle" />}
        />
    )
}

const ButtonContinue = ({onClick, className}) => {
    return (
        <WalletButton
            label={'Continue'}
            onClick={onClick}
            className={clsx('btn-info w-100', className)}
            icon={<CornerRightDown className="me-2 align-middle" />}
        />
    )
}

const ButtonGenerateNewWallet = ({label, onClick, className}) => {
    return (
        <WalletButton
            key={label}
            label={label || 'Generate New Wallet'}
            onClick={onClick}
            className={clsx('btn-success w-100', className)}
            icon={<Sparkles className="me-2 align-middle" />}
        />
    )
}

const ButtonRestoreWalletFromSeed = ({onClick, className}) => {
    return (
        <WalletButton
            label={'Restore Wallet From Seed Phrase'}
            onClick={onClick}
            className={clsx('btn-success w-100', className)}
            icon={<RotateCcw className="me-2 align-middle" />}
        />
    )
}

const ButtonTokenTransfer = ({onClick, className}) => {
    return (
        <WalletButton
            label={'Transfer Token To Another Wallet'}
            onClick={onClick}
            className={clsx('btn-primary w-100', className)}
            icon={<FaPaperPlane className="me-2 align-middle" />}
        />
    )
}

const ButtonTokenBurn = ({onClick,className}) => {
    return (
        <WalletButton
            label={'Burn Token'}
            onClick={onClick}
            className={clsx('btn-danger w-100', className)}
            icon={<FaBurn className="me-2 align-middle" />}
        />
    )
}

const WalletButton = ({label, onClick, className, icon }) => (
    <button
        className={clsx(className, 'btn cursor-pointer d-flex align-items-center justify-content-center gap-2')}
        onClick={onClick}
    >
        {icon} <WalletTranslation text={label} />
    </button>
)

export {
    ButtonSave, ButtonSaved, ButtonConfirm, ButtonCopy, ButtonRepeat, ButtonRemove,
    ButtonWalletClose, ButtonWalletUnLock, ButtonWalletLock, ButtonBack, ButtonReloadWallet,
    ButtonSendCoins, ButtonBuyCoins, ButtonReceiveCrypto, ButtonTokenTransfer, ButtonTokenBurn,
    ButtonAddWallet, ButtonGenerateNewWallet, ButtonRestoreWalletFromSeed, ButtonContinue,
}
