import React, { useRef, useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { MessagesBlock } from '@react/components/form-elements/Messages'
import { CreateContainer } from './components/container/CreateContainer'
import { removeContainer } from './components/create-container/utils'
import { SelectedPublicKey, MintedInfo, TryMoreOptions } from './components/create-container/Components'
import { ButtonCreateToken } from './components/create-token/ButtonCreateToken'
import { TokenForm } from './components/create-token/TokenForm'
import { MaterialForm } from './components/MaterialForm'

export const CreateTokenMaterial = ({doMaterial}) => {
    const wallet = useWallet()
    const targetRef = useRef(null)
    const [tokenFiles, setTokenFiles] = useState([])
    const [container, setContainer] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [minted, setMinted] = useState(null)
    const [materialData, setMaterialData] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    const handlerChangeFiles = () => {
        if (!minted) {
            removeContainer(container, targetRef, setTokenFiles, setContainer).catch(e => setErrorMessage(e.message))
        }
    }

    const handlerClear = () => {
        handlerChangeFiles()
        setTokenFiles([])
        setTokenData(null)
        setMinted(null)
    }


    // TODO - Check if it is needed
    // Force connection check for Sevens Wallet
    useEffect(() => {
        if (wallet.wallet?.adapter?.name === 'Sevens Wallet' && !wallet.connected && !wallet.connecting) {
            const adapter = wallet.wallet.adapter
            console.log('🔍 [CreateMaterial] Sevens Wallet selected but not connected, forcing connection check')

            // Check if adapter has a wallet but React hasn't updated
            if (adapter._wallet && adapter._publicKey) {
                console.log('🔄 [CreateMaterial] Adapter has wallet, forcing connect call')
                setTimeout(() => {
                    wallet.connect().catch(console.error)
                }, 100)
            }
        }
    }, [wallet.wallet, wallet.connected, wallet.connecting, wallet.connect])


    return (
        <div>
            {(!doMaterial || !minted) && (
                <CreateContainer {...{tokenFiles, setTokenFiles, container, setContainer, targetRef}} />
            )}
            {container && !container.isCompressing && !minted && (
                <>
                    <TokenForm {...{tokenData, setTokenData, setErrorMessage}} />
                    <SelectedPublicKey wallet={wallet} />
                    <MessagesBlock error={errorMessage} />
                    <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-outline-primary" onClick={handlerChangeFiles}>Change files</button>
                        <button className="btn btn-outline-primary" onClick={handlerClear}>Clear</button>
                        <WalletMultiButton />
                        <ButtonCreateToken {...{tokenData, container, wallet, setMinted, setErrorMessage, targetRef, setContainer}} />
                    </div>
                </>
            )}
            <MintedInfo minted={minted} />
            <TryMoreOptions {...{minted, doMaterial, handlerClear}} />
            {minted && doMaterial && (
                <MaterialForm {...{materialData, setMaterialData, setErrorMessage, tokenFiles, setTokenFiles}} />
            )}
        </div>
    )
}
