import React from 'react'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import MenuDropdown from '@react/components/wallet/components/form-elements/MenuDropdown'
import { Eye, Trash2, FolderPen } from 'lucide-react'

const WalletMenu = ({walletData}) => {
    const { setShowComponent } = useWalletContext()

    const elements = [{
        title: 'Rename',
        icon: <FolderPen size={16} />,
        action: () => setShowComponent({
            component: 'RenameWallet',
            props: {
                componentLabel: `Rename Wallet ${walletData.name}`,
                walletData,
            },
        }),
    }, {
        title: 'Show private key',
        icon: <Eye size={16} />,
        action: () => setShowComponent({
            component: 'ShowPrivateKey',
            props: {
                componentLabel: `Show ${walletData.name}\nPrivate Key & Recovery Phrase`,
                walletData,
            }
        }),
    }, {
        title: 'Remove',
        icon: <Trash2 size={16} />,
        action: () => setShowComponent({
            component: 'RemoveWallet',
            props: {
                componentLabel: `Remove Wallet ${walletData.name}`,
                walletData,
            },
        }),
    }]

    return <MenuDropdown elements={elements} style={{width: '180px', right: 0}}/>
}

export default WalletMenu
