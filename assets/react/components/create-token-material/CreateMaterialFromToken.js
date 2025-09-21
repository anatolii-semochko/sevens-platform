import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getTokenByHash } from '@js/blockchain/sevens-token'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { removeExtractedFilesFolder } from './utils/files'
import { getFileHash } from './utils/files'
import { MessagesBlock } from '@react/components/form-elements/Messages'
import { MaterialForm } from './components/MaterialForm'
import {
    ButtonClearPickContainer,
    ButtonSelectDecompressionFolder,
    Decompressing,
} from './components/container/DecompressContainer'
import {
    DecompressingStatus,
    HashingStatus,
    SelectContainerFile,
    ShowTokenValidity
} from './components/create-container/Components'

export const CreateMaterialFromToken = () => {
    const wallet = useWallet()
    const [container, setContainer] = useState(null)
    const [overallHashing, setOverallHashing] = useState(0)
    const [tokenFiles, setTokenFiles] = useState([])
    const [tokenData, setTokenData] = useState(null)
    const [materialData, setMaterialData] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)
    const [decompressionFunction, setDecompressionFunction] = useState(null)

    const onSelectContainer = async (file, providedDownloadsHandle = null) => {
        setContainer({
            file,
            name: file.name,
            downloadsHandle: providedDownloadsHandle,
            isHashing: true
        })
        setTokenFiles([])
        setTokenData(null)
        setErrorMessage(null)
    }

    const handlerClear = async () => {
        await removeExtractedFilesFolder(container, tokenFiles)
        setTokenFiles([])
        setContainer(null)
        setOverallHashing(0)
        setTokenData(null)
        setMaterialData(null)
        setDecompressionFunction(null)
    }

    const handleStartDecompression = () => {
        if (decompressionFunction) {
            decompressionFunction()
        }
    }

    const onStartDecompression = (startDecompressionFn) => setDecompressionFunction(() => startDecompressionFn)


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

    // // Cleanup extracted files on component unmount
    // useEffect(() => {
    //     return () => {
    //         if (container?.folderHandle) {
    //             removeExtractedFilesFolder().catch(console.warn)
    //         }
    //     }
    // }, [container?.folderHandle])

    const calculateHash = async () => { // TODO - Duplicate - MOVE TO UTILS !!!
        setErrorMessage(null)
        const hash = await getFileHash(container.file, setOverallHashing)
        setContainer(prev => ({...prev, hash, isHashing: false}))
    }

    const deriveTokenData = async () => getTokenByHash(container.hash)  // TODO - Duplicate - MOVE TO UTILS !!!
        .then(setTokenData)
        .catch(() => setTokenData({error: 'Token not found'}))


    useEffect(() => {
        if (container && !container.hash) {
            calculateHash().catch(error => setErrorMessage(error.message))
        }
    }, [container?.file])

    useEffect(() => {
        if (container?.hash) {
            deriveTokenData().catch(error => setErrorMessage(error.message))
        }
    }, [container?.hash])

    if (!container?.file) return (
        <SelectContainerFile container={container} onSelectContainer={onSelectContainer} needsExtraction={false} />
    )

    return (
        <div>
            <HashingStatus {...{container, overallHashing}} />
            <ShowTokenValidity {...{container, tokenData}} />
            <ButtonSelectDecompressionFolder {...{tokenData, container, handleStartDecompression}} />
            <Decompressing {...{tokenFiles, setTokenFiles, container, setContainer, onStartDecompression, tokenData}} />
            {tokenData && !tokenData.error && !!tokenFiles.length && (
                <MaterialForm {...{materialData, setMaterialData, setErrorMessage, tokenFiles, setTokenFiles}}/>
            )}
            <MessagesBlock error={errorMessage} />
            <ButtonClearPickContainer {...{container, tokenFiles, tokenData, handlerClear}} />
        </div>
    )
}
