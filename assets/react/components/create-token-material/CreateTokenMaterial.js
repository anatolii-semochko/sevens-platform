import React, { useEffect, useRef, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { removeReferenceFile } from './utils/files'
import { MessagesBlock } from '@react/components/form-elements/Messages'
import { CreateContainer } from './components/container/CreateContainer'
import { ContainerFileInfo } from './components/container/Components'
import { MintedInfo, TryMoreOptions } from './components/token/Components'
import { WalletMintForm } from './components/Wallet/Components'
import { ButtonCreateToken } from '@react/components/create-token-material/components/token/ButtonCreateToken'
import { TokenForm } from '@react/components/create-token-material/components/token/TokenForm'
import { PublishButton } from '@react/components/create-token-material/components/material/MaterialForm'


export const CreateTokenMaterial = ({doMaterial}) => {
    const wallet = useWallet()
    const targetRef = useRef(null)
    const [tokenFiles, setTokenFiles] = useState([])
    const [allowMaterial, setAllowMaterial] = useState(doMaterial)
    const [container, setContainer] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [minted, setMinted] = useState(null)
    const [errorContainer, setErrorContainer] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    useEffect(() => setErrorMessage(null), [wallet.publicKey, container, tokenData, tokenFiles])

    const handlerChangeFiles = () => {
        setContainer(null)
        setErrorContainer(null)
        setErrorMessage(null)
        setAllowMaterial(doMaterial)
        setTokenFiles(prev => prev.map(item => ({
            ...item,
            status: 'queued',
            progress: 0,
            error: null,
        })))
        if (!minted) {
            removeReferenceFile(targetRef).catch(e => setErrorMessage(e.message))
        }
    }

    const handlerClear = () => {
        handlerChangeFiles()
        setErrorContainer(null)
        setErrorMessage(null)
        setTokenFiles([])
        setTokenData(null)
        setMinted(null)
        setAllowMaterial(doMaterial)
    }

    const showCreateContainer = () => !allowMaterial || !minted
    const showCreateToken = () => container && !container.isCompressing && !minted
    const showTokenForm = () => showCreateToken() && !errorContainer
    const showActions = () => showCreateToken()
    const showCreateMaterial = () => minted && allowMaterial

    return (
        <div>
            {showCreateContainer() && (
                <CreateContainer {...{tokenFiles, setTokenFiles, container, setContainer, targetRef}} />
            )}
            <ContainerFileInfo {...{container, setErrorContainer}} />
            <MessagesBlock error={errorContainer} />
            {showTokenForm() && <WalletMintForm />}
            {showTokenForm() && <TokenForm {...{tokenData, setTokenData, setErrorMessage}} />}
            {showActions() && <MessagesBlock error={errorMessage} />}
            {showActions() && (
                <div className="d-flex justify-content-end gap-2 mb-2">
                    <button className="btn btn-outline-primary px-5 py-2" onClick={handlerChangeFiles}>Change files</button>
                    <button className="btn btn-outline-primary px-5 py-2" onClick={handlerClear}>Clear</button>
                    {!errorContainer && (
                        <ButtonCreateToken {...{tokenData, container, wallet, setMinted, setErrorMessage, targetRef, setContainer}} />
                    )}
                </div>
            )}
            <MintedInfo minted={minted} />
            <TryMoreOptions {...{minted, allowMaterial, setAllowMaterial, handlerClear}} />
            {showCreateMaterial() && (
                <PublishButton {...{container, tokenData: {tokenPublicKey: minted.mint}, walletSignature: minted}} />
            )}
        </div>
    )
}
