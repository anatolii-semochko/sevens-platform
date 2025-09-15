import React, { useState, useEffect } from 'react'
import {
    ContainerPublicKey, HashingStatus, SelectContainerFile,
} from '@react/components/create-token-material/components/create-container/Components'
import {
    getAndCheckTokenData, getFileHash, getPublicKeyFromContainerName,
} from '@react/components/create-token-material/components/create-container/utils'
import { MessagesBlock } from '@react/components/form-elements/Messages'
import {
    ActionButtons,
    ContainerCheckMessage,
    ContainerFileInfo
} from '@react/components/check-token/components/Components'
import { getAnchorErrorText } from '@js/blockchain/sevens'

export const CheckToken = () =>  {
    const [container, setContainer] = useState(null)
    const [overallHashing, setOverallHashing] = useState(0)
    const [tokenPublicKey, setTokenPublicKey] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    const onSelectContainer = async (file) => {
        const publicKey = getPublicKeyFromContainerName(file.name)
        setTokenPublicKey(publicKey)
        setContainer({file, publicKey, isHashing: true})
    }

    const calculateHash = async () => {
        setErrorMessage(null)
        const hash = await getFileHash(container.file, setOverallHashing)
        setContainer(prev => ({...prev, hash, isHashing: false}))
    }

    const getTokenData = async () => {
        setErrorMessage(null)
        try {
            const token = await getAndCheckTokenData(tokenPublicKey, container.hash)
            setTokenData(token)
        } catch (error) {
            setTokenData({error: getAnchorErrorText(error)})
        }
    }

    const handlerClear = () => {
        setContainer(false)
        setOverallHashing(0)
        setTokenPublicKey(null)
        setTokenData(null)
        setErrorMessage(null)
    }

    useEffect(() => {
        if (container && !container.hash) {
            calculateHash().catch(error => setErrorMessage(error.message))
        }
        if (tokenPublicKey && container && container.hash && !tokenData) {
            getTokenData(tokenPublicKey, container.hash).catch(error => setErrorMessage(getAnchorErrorText(error)))
        }
    }, [container])

    useEffect(() => {
        setTokenData(null)
        setErrorMessage(null)
        if (tokenPublicKey && container && container.hash) {
            getTokenData(tokenPublicKey, container.hash).catch(error => setErrorMessage(getAnchorErrorText(error)))
        }
    }, [tokenPublicKey])

    if (!container?.file) return (
        <SelectContainerFile {...{container, onSelectContainer}} />
    )

    if (container?.file && !container?.hash) return (
        <HashingStatus {...{container, overallHashing}} />
    )

    return container && !container.isHashing && (
        <div>
            <ContainerFileInfo {...{container}} />
            <ContainerPublicKey {...{container, setContainer, tokenPublicKey, setTokenPublicKey}} />
            <ContainerCheckMessage {...{tokenData}} />
            <MessagesBlock error={errorMessage} />
            <ActionButtons {...{handlerClear}}/>
        </div>
    )
}

export default CheckToken
