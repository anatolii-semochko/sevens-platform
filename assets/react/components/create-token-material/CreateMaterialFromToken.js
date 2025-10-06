import React, { useState, useEffect } from 'react'
import store from '@react/store'
import { deriveTokenData } from './utils/blockchain'
import { calculateContainerHash, removeExtractedFilesFolder } from './utils/files'
import { UserAuthorization } from '@react/components/form-elements/UserAuthorization'
import { MessagesBlock } from '@react/components/form-elements/Messages'
import { ShowTokenValidity } from './components/token/Components'
import { WalletCheckForm } from './components/Wallet/Components'
import { HashingStatus, SelectContainerFile } from './components/container/Components'
import { PublishButton } from '@react/components/create-token-material/components/material/MaterialForm'
import { ButtonClearPickContainer, ShowContainerFiles } from './components/container/DecompressContainer'

export const CreateMaterialFromToken = () => {
    const [container, setContainer] = useState(null)
    const [overallHashing, setOverallHashing] = useState(0)
    const [tokenFiles, setTokenFiles] = useState([])
    const [tokenData, setTokenData] = useState(null)
    const [walletSignature, setWalletSignature] = useState(null)
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
        setWalletSignature(null)
        setErrorMessage(null)
    }

    const handlerClear = async () => {
        await removeExtractedFilesFolder(container, tokenFiles)
        setTokenFiles([])
        setContainer(null)
        setOverallHashing(0)
        setTokenData(null)
        setWalletSignature(null)
        setDecompressionFunction(null)
    }

    const handleStartDecompression = () => {
        if (decompressionFunction) {
            decompressionFunction()
        }
    }

    const onStartDecompression = (startDecompressionFn) => setDecompressionFunction(() => startDecompressionFn)

    useEffect(() => {
        if (container && !container.hash) {
            calculateContainerHash(container, setContainer, setOverallHashing, setErrorMessage).catch()
        }
    }, [container?.file])

    useEffect(() => {
        if (container?.hash) {
            deriveTokenData(container.hash, setTokenData).catch(error => setErrorMessage(error.message))
        }
    }, [container?.hash])

    if (!store.getState().user) return (
        <UserAuthorization message={'To publish material you need to log in.'}/>
    )

    if (!container?.file) return (
        <SelectContainerFile container={container} onSelectContainer={onSelectContainer} needsExtraction={false} />
    )

    return (
        <div>
            <HashingStatus {...{container, overallHashing}} />
            <ShowContainerFiles {...{
                container,
                setContainer,
                tokenData,
                tokenFiles,
                setTokenFiles,
                onStartDecompression,
                handleStartDecompression,
            }}/>
            <ShowTokenValidity {...{container, tokenData}} />
            {tokenData && !tokenData.error && (
                <WalletCheckForm {...{tokenData, walletSignature, setWalletSignature}} />
            )}
            <MessagesBlock error={errorMessage} />
            {!!walletSignature && (
                <PublishButton {...{container, tokenData, walletSignature}} />
            )}
            <ButtonClearPickContainer {...{container, tokenFiles, tokenData, handlerClear}} />
        </div>
    )
}
