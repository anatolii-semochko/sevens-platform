import React, { useRef, useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { MessagesBlock } from '@react/components/form-elements/Messages'
import { removeExtractedFilesFolder} from './components/create-container/utils'
import { MaterialForm } from './components/MaterialForm'
import { DecompressContainer } from './components/DecompressContainer'
import {CheckTokenValidity, ContainerPublicKey} from './components/create-container/Components'

export const CreateMaterialFromToken = () => {
    const wallet = useWallet()
    const targetRef = useRef(null)
    const [tokenFiles, setTokenFiles] = useState([])
    const [container, setContainer] = useState(null)
    const [tokenPublicKey, setTokenPublicKey] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [tokenVerified, setTokenVerified] = useState(false)
    const [materialData, setMaterialData] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    const handlerClear = async () => {
        await removeExtractedFilesFolder(container, tokenFiles)
        setContainer(null)
        setTokenFiles([])
        setTokenData(null)
        setTokenPublicKey(null)
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

    // Cleanup extracted files on component unmount
    useEffect(() => {
        return () => {
            if (container?.folderHandle) {
                removeExtractedFilesFolder().catch(console.warn)
            }
        }
    }, [container?.folderHandle])

    return (
        <div>
            <DecompressContainer {...{tokenFiles, setTokenFiles, container, setContainer}} />
            <ContainerPublicKey key={container?.file?.name} {...{container, setContainer, tokenPublicKey, setTokenPublicKey}} />
            <CheckTokenValidity {...{container, tokenPublicKey, tokenData, setTokenData, tokenVerified, setTokenVerified}} />
            {container && !container.isDecompressing && !tokenVerified && (
                <>
                    <MessagesBlock error={errorMessage} />
                    <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-outline-primary" onClick={handlerClear}>Clear and pick different container file</button>
                        <WalletMultiButton />
                    </div>
                </>
            )}
        </div>
    )
}
