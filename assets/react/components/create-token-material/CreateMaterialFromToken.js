import React, { useState, useEffect } from 'react'
import { deriveTokenData } from './utils/blockchain'
import { createMaterial } from '@react/api/materialApi'
import { calculateContainerHash, removeExtractedFilesFolder } from './utils/files'
import { MessagesBlock } from '@react/components/form-elements/Messages'
import { MaterialForm } from './components/material/MaterialForm'
import { ShowTokenValidity } from './components/token/Components'
import { WalletCheckForm } from './components/Wallet/Components'
import { HashingStatus, SelectContainerFile } from './components/container/Components'
import {
    ButtonClearPickContainer,
    ButtonSelectDecompressionFolder,
    Decompressing,
} from './components/container/DecompressContainer'

export const CreateMaterialFromToken = () => {
    const [container, setContainer] = useState(null)
    const [overallHashing, setOverallHashing] = useState(0)
    const [tokenFiles, setTokenFiles] = useState([])
    const [tokenData, setTokenData] = useState(null)
    const [walletSignature, setWalletSignature] = useState(null)
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

    const showMaterialForm = () => tokenData && !tokenData.error && !!tokenFiles.length

    const handlerPublish = async () => {
        setErrorMessage(null)
        try {
            const response = await createMaterial(
                materialData.title,
                materialData.shortDescription,
                materialData.description,
                container.file.name,
                container.hash,
                tokenData.tokenPublicKey,
                walletSignature,
            )
            console.log({response})
            if (response.link) {
                window.location.href = response.link
            }
            if (response.redirect) {
                window.location.href = response.redirect
            }
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    if (!container?.file) return (
        <SelectContainerFile container={container} onSelectContainer={onSelectContainer} needsExtraction={false} />
    )

    return (
        <div>
            <HashingStatus {...{container, overallHashing}} />
            <ShowTokenValidity {...{container, tokenData}} />
            <ButtonSelectDecompressionFolder {...{tokenData, container, handleStartDecompression}} />
            <Decompressing {...{tokenFiles, setTokenFiles, container, setContainer, onStartDecompression, tokenData}} />
            {showMaterialForm() && <>
                <WalletCheckForm {...{tokenData, walletSignature, setWalletSignature}} />
                <MaterialForm {...{materialData, setMaterialData, tokenFiles, setTokenFiles, handlerPublish, setErrorMessage}} />
            </>}
            <MessagesBlock error={errorMessage} />
            <ButtonClearPickContainer {...{container, tokenFiles, tokenData, handlerClear}} />
        </div>
    )
}
