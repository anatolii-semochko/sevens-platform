import React, { useState, useEffect } from 'react'
import TokenApi from '@react/api/tokenApi'
import { calculateContainerHash } from '../create-token-material/utils/files'
import { MessagesBlock } from '@react/components/info-componnents/Messages'
import { ActionButtons, ContainerCheckMessage } from '../check-token/components/Components'
import { MaterialInfo } from '@react/components/info-componnents/material/MaterialInfo'
import { HistoryTable } from '@react/components/info-componnents/token/TokenInfo'
import {
    HashingStatus,
    SelectContainerFile,
    ContainerFileInfo,
} from '../create-token-material/components/container/Components'

const tokenApi = new TokenApi()

export const CheckToken = () =>  {
    const [container, setContainer] = useState(null)
    const [overallHashing, setOverallHashing] = useState(0)
    const [tokenData, setTokenData] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    const onSelectContainer = async (file) => {
        setContainer({file, isHashing: true})
    }

    const handlerClear = () => {
        setContainer(false)
        setOverallHashing(0)
        setTokenData(null)
        setErrorMessage(null)
    }

    useEffect(() => {
        if (container && !container.hash) {
            calculateContainerHash(container, setContainer, setOverallHashing, setErrorMessage).catch()
        }
        if (container?.hash) {
            tokenApi.getTokenDataByHash(container.hash).then(setTokenData).catch(() => setTokenData({
                error: 'Token not found in blockchain',
            }))
        }
    }, [container])

    if (!container?.file) return (
        <SelectContainerFile container={container} onSelectContainer={onSelectContainer} needsExtraction={false} />
    )

    if (container?.file && !container?.hash) return (
        <HashingStatus {...{container, overallHashing}} />
    )

    return container && !container.isHashing && (
        <div>
            <ContainerFileInfo {...{container}} />
            <ContainerCheckMessage {...{tokenData}} />
            <MaterialInfo tokenPublicKey={tokenData?.tokenPublicKey} />
            <HistoryTable tokenPublicKey={tokenData?.tokenPublicKey?.toString()} showChart={true} showTable={true} />
            <MessagesBlock error={errorMessage} />
            <ActionButtons {...{handlerClear}}/>
        </div>
    )
}

export default CheckToken
