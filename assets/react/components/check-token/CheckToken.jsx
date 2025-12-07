import React, { useState, useEffect } from 'react'
import TokenApi from '@react/api/tokenApi'
import { calculateContainerHash } from '@react/components/create-token-material/utils/files'
import { RepeatableQuery } from '@react/api/RepeatableQuery'
import { MessagesBlock } from '@react/components/info-componnents/Messages'
import { ActionButtons, ContainerCheckMessage } from '@react/components/check-token/components/Components'
import { MaterialInfo } from '@react/components/info-componnents/material/MaterialInfo'
import { HistoryTable } from '@react/components/info-componnents/token/TokenInfo'
import {
    HashingStatus,
    SelectContainerFile,
    ContainerFileInfo,
} from '@react/components/create-token-material/components/container/Components'

const tokenApi = new TokenApi()

export const CheckToken = () =>  {
    const [container, setContainer] = useState(null)
    const [overallHashing, setOverallHashing] = useState(0)
    const [loadingToken, setLoadingToken] = useState(false)
    const [tokenData, setTokenData] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    const onSelectContainer = async (file) => {
        setContainer({file, isHashing: true})
    }

    const handlerClear = () => {
        setContainer(false)
        setOverallHashing(0)
        setLoadingToken(false)
        setTokenData(null)
        setErrorMessage(null)
    }

    useEffect(() => {
        if (container && !container.hash) {
            calculateContainerHash(container, setContainer, setOverallHashing, setErrorMessage).catch()
        }
    }, [container])

    useEffect(() => {
        if (container?.hash && !tokenData) {
            setLoadingToken(true)
        }
    }, [container?.hash])

    if (!container?.file) return (
        <SelectContainerFile container={container} onSelectContainer={onSelectContainer} needsExtraction={false} />
    )

    if (container?.file && !container?.hash) return (
        <HashingStatus {...{container, overallHashing}} />
    )

    return container && !container.isHashing && (
        <div>
            <ContainerFileInfo {...{container}} />
            <RepeatableQuery
                apiEndpoint={(hash) => tokenApi.getTokenDataByHash(hash)}
                params={container?.hash}
                onSuccess={setTokenData}
                onError={(error) => setTokenData({ error: error.toString() })}
                processing={loadingToken}
                setProcessing={setLoadingToken}
                loadingMessage={'Checking container in blockchain...'}
                onCancel={handlerClear}
            />
            <MessagesBlock error={errorMessage} />
            {tokenData && !loadingToken && (
                <div>
                    <ContainerCheckMessage {...{tokenData}} />
                    <MaterialInfo tokenPublicKey={tokenData?.tokenPublicKey} />
                    <HistoryTable tokenPublicKey={tokenData?.tokenPublicKey?.toString()} showChart={true} showTable={true} />
                    <ActionButtons {...{handlerClear}}/>
                </div>
            )}
        </div>
    )
}

export default CheckToken
