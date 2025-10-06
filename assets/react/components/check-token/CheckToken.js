import React, { useState, useEffect } from 'react'
import { deriveTokenData } from '../create-token-material/utils/blockchain'
import { calculateContainerHash } from '../create-token-material/utils/files'
import { MessagesBlock } from '@react/components/info-componnents/Messages'
import { ActionButtons, ContainerCheckMessage } from '../check-token/components/Components'
import {
    HashingStatus,
    SelectContainerFile,
    ContainerFileInfo,
} from '../create-token-material/components/container/Components'

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
            deriveTokenData(container.hash, setTokenData).catch(error => setErrorMessage(error.message))
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
            <MessagesBlock error={errorMessage} />
            <ActionButtons {...{handlerClear}}/>
        </div>
    )
}

export default CheckToken
