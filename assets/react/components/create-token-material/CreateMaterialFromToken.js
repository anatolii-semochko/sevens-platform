import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { deriveTokenData } from './utils/blockchain'
import { calculateContainerHash, removeExtractedFilesFolder } from './utils/files'
import { MessagesBlock } from '@react/components/form-elements/Messages'
import { MaterialForm } from './components/material/MaterialForm'
import { ShowTokenValidity } from './components/token/Components'
import { HashingStatus, SelectContainerFile } from './components/container/Components'
import {
    ButtonClearPickContainer,
    ButtonSelectDecompressionFolder,
    Decompressing,
} from './components/container/DecompressContainer'

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
