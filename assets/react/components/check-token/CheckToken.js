import React, { useState, useEffect } from 'react'
import { getFileHash } from '@react/components/create-token-material/components/create-container/utils'
import { MessagesBlock } from '@react/components/form-elements/Messages'
import {
    HashingStatus, SelectContainerFileForCheck,
} from '@react/components/create-token-material/components/create-container/Components'
import {
    ActionButtons, ContainerCheckMessage, ContainerFileInfo,
} from '@react/components/check-token/components/Components'
import {getTokenByHash} from "@js/blockchain/sevens-token";

export const CheckToken = () =>  {
    const [container, setContainer] = useState(null)
    const [overallHashing, setOverallHashing] = useState(0)
    const [tokenData, setTokenData] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    const onSelectContainer = async (file) => {
        setContainer({file, isHashing: true})
    }

    const calculateHash = async () => {
        setErrorMessage(null)
        const hash = await getFileHash(container.file, setOverallHashing)
        setContainer(prev => ({...prev, hash, isHashing: false}))
    }

    const derivePublicKey = async () => getTokenByHash(container.hash)
        .then(setTokenData)
        .catch(() => setTokenData({error: 'Token not found'}))

    const handlerClear = () => {
        setContainer(false)
        setOverallHashing(0)
        setTokenData(null)
        setErrorMessage(null)
    }

    useEffect(() => {
        if (container && !container.hash) {
            calculateHash().catch(error => setErrorMessage(error.message))
        }
        if (container?.hash) {
            derivePublicKey().catch(error => setErrorMessage(error.message))
        }
    }, [container])

    if (!container?.file) return (
        <SelectContainerFileForCheck {...{container, onSelectContainer}} />
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
