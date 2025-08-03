import React from 'react'
import store from '@react/store'
import { useSelector } from 'react-redux'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { Eye, EyeOff, Trash2, Lock } from 'lucide-react'
import MenuDropdown from '@react/components/wallet/components/form-elements/MenuDropdown'


const MainMenu = ({style}) => {
    const {
        hideBalances,
        setHideBalances,
    } = useWalletContext()

    const handleClearWallet = () => {
        console.log('TODO: Remove all addresses')
    }

    const handleLock = () => {
        console.log('TODO: Lock wallet')
    }

    const elements = [{
        title: hideBalances ? 'Show balances' : 'Hide balances',
        icon: hideBalances ? <Eye size={16} /> : <EyeOff size={16} />,
        action: () => setHideBalances(!hideBalances),
    }, {
        title: 'Clear wallet',
        icon: <Trash2 size={16} />,
        action: () => handleClearWallet(),
    }, {
        title: 'Lock Wallet',
        icon: <Lock size={16} />,
        action: () => handleLock(),
    }]

    return <MenuDropdown elements={elements} style={{minWidth: '180px'}}/>
}

export default MainMenu
