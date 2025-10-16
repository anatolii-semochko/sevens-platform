import React, { useState, useEffect } from 'react'
import store from '@react/store'
import { deriveTokenData } from './utils/blockchain'
import { calculateContainerHash, removeExtractedFilesFolder } from './utils/files'
import { UserAuthorization } from '@react/components/form-elements/UserAuthorization'
import { MessagesBlock } from '@react/components/info-componnents/Messages'
import { TokenInfo } from '@react/components/info-componnents/token/TokenInfo'
import { HashingStatus, SelectContainerFile } from './components/container/Components'
import { PublishMaterial } from '@react/components/create-token-material/components/material/PublishMaterial'
import { ButtonClearPickContainer, ShowContainerFiles } from './components/container/DecompressContainer'

export const CreateMaterialFromToken = () => {
    const [container, setContainer] = useState(null)
    const [overallHashing, setOverallHashing] = useState(0)
    const [tokenFiles, setTokenFiles] = useState([])
    const [tokenData, setTokenData] = useState(null)
    const [decompressionFunction, setDecompressionFunction] = useState(null)
    const [publishing, setPublishing] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    const onSelectContainer = async (file, providedDownloadsHandle = null) => {
        setContainer({
            file,
            name: file.name,
            size: file.size,
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
            <TokenInfo {...{container, tokenData}} />
            <MessagesBlock error={errorMessage} />
            {tokenData && !tokenData.error && !errorMessage && (
                <PublishMaterial {...{container, tokenData, setPublishing}} />
            )}
            <ButtonClearPickContainer {...{container, tokenFiles, tokenData, handlerClear, hidden: publishing}} />
        </div>
    )
}
