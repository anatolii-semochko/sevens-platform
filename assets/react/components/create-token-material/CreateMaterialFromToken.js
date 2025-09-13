import React, { useRef, useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { MessagesBlock } from '@react/components/form-elements/Messages'
import { removeContainer } from './components/create-container/utils'
import { MaterialForm } from './components/MaterialForm'
import {DecompressContainer} from "@react/components/create-token-material/components/DecompressContainer";

export const CreateMaterialFromToken = () => {
    const wallet = useWallet()
    const targetRef = useRef(null)
    const [tokenFiles, setTokenFiles] = useState([])
    const [container, setContainer] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [minted, setMinted] = useState(null)
    const [materialData, setMaterialData] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    const handlerClear = () => {
        setContainer(null)
        setTokenFiles([])
        setTokenData(null)
    }


    // TODO - Check if it is needed (not now, it is for me)
    // Force connection check for Sevens Wallet
    useEffect(() => {
        if (wallet.wallet?.adapter?.name === 'Sevens Wallet' && !wallet.connected && !wallet.connecting) {
            const adapter = wallet.wallet.adapter
            console.log('🔍 [CreateMaterial] Sevens Wallet selected but not connected, forcing connection check')

            // Check if adapter has a wallet but React hasn't updated
            if (adapter._wallet && adapter._publicKey) {
                console.log('🔄 [CreateMaterial] Adapter has wallet, forcing connect call')
                setTimeout(() => {
                    wallet.connect().catch(console.error)
                }, 100)
            }
        }
    }, [wallet.wallet, wallet.connected, wallet.connecting, wallet.connect])


    return (
        <div>
            <DecompressContainer {...{tokenFiles, setTokenFiles, container, setContainer, targetRef}} />
            {container && !container.isCompressing && !minted && (
                <>
                    <MessagesBlock error={errorMessage} />
                    <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-outline-primary" onClick={handlerClear}>Clear</button>
                        <WalletMultiButton />
                    </div>
                </>
            )}
        </div>
    )
}
