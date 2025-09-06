import React, { useRef, useState, useMemo, useEffect } from 'react'
import { sevensIdl } from '@js/blockchain/sevens-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { SevensWalletAdapter } from '@react/components/wallet/WalletAdapter'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { MessagesBlock } from '@react/components/form-elements/Messages'
import { CreateContainer } from './components/CreateContainer'
import { removeContainer } from './components/create-container/utils'
import { FormTitle, SelectedPublicKey, SetTokenType } from './components/create-container/Components'
import { TokenNameAuthorDescription } from './components/FormElements'

const CreateMaterialInner = () => {
    const targetRef = useRef(null)
    const [publicMaterial, setPublicMaterial] = useState(false)
    const [tokenFiles, setTokenFiles] = useState([])
    const [container, setContainer] = useState(null) // { name, where: 'savePicker'|'downloads' }
    const [isCompressing, setIsCompressing] = useState(false)
    const [tokenName, setTokenName] = useState('')
    const [tokenAuthor, setTokenAuthor] = useState('')
    const [tokenDescription, setTokenDescription] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)

    const {
        publicKey,
        wallet,
        select,
        connected,
        connecting,
        connect,
        disconnect,
        signTransaction,
        signAllTransactions,
        wallets
    } = useWallet()


    // TODO - To REMOVE !!!!!!!!!!!!!!!!!!!!!!!!!!!
    useEffect(() => {
        console.log('Wallet status:', { connected, publicKey: publicKey?.toString(), wallet: wallet?.adapter?.name })
    }, [connected, publicKey, wallet])


    // TODO - take values from sevens IDL
    console.log({sevensIdl})
    const tokenNameMaxLength = 32
    const tokenAuthorMaxLength = 32
    const tokenDescriptionMaxLength = 128

    const handlerChangeFiles = () => {
        removeContainer(container, targetRef, setTokenFiles, setContainer).catch(e => setErrorMessage(e.message))
    }

    const handlerClear = () => {
        handlerChangeFiles()
        setTokenFiles([])
        setTokenName('')
        setTokenAuthor('')
        setTokenDescription('')
    }

    const handlerCreateToken = async () => {
        try {
            if (!connected || !publicKey) {
                await connect()
                if (!publicKey) {
                    setErrorMessage('Failed to connect wallet')
                    return
                }
            }

            console.log('Wallet:', wallet?.adapter?.name)
            console.log('Wallet connected:', publicKey.toString())
            console.log('Container:', container)
            console.log('Token data:', { tokenName, tokenAuthor, tokenDescription })

            // Use standard wallet interface - works with any wallet adapter
            if (signTransaction && signAllTransactions) {
                console.log('Wallet ready for transactions')
            }

            // TODO: Create and sign transaction here

        } catch (error) {
            console.error('Error creating token:', error)
            setErrorMessage(error.message || 'Failed to create token')
        }
    }

    const handleSignMessage = () => {
        console.log('Call sign message')
        // signWithPhantom().then(console.log).catch(console.error)
    }

    return (
        <div className="row justify-content-center mb-3">
            <div className="col-12 col-lg-6">
                <FormTitle publicMaterial={publicMaterial} />
                <SetTokenType publicMaterial={publicMaterial} setPublicMaterial={setPublicMaterial} />
                <CreateContainer
                    items={tokenFiles}
                    setItems={setTokenFiles}
                    container={container}
                    setContainer={setContainer}
                    targetRef={targetRef}
                    isCompressing={isCompressing}
                    setIsCompressing={setIsCompressing}
                />
                {!!container && !isCompressing && (
                    <>
                        <TokenNameAuthorDescription
                            tokenName={tokenName}
                            setTokenName={setTokenName}
                            tokenNameMaxLength={tokenNameMaxLength}
                            tokenAuthor={tokenAuthor}
                            setTokenAuthor={setTokenAuthor}
                            tokenAuthorMaxLength={tokenAuthorMaxLength}
                            tokenDescription={tokenDescription}
                            setTokenDescription={setTokenDescription}
                            tokenDescriptionMaxLength={tokenDescriptionMaxLength}
                            setErrorMessage={setErrorMessage}
                        />
                        <SelectedPublicKey publicKey={publicKey} />
                        <MessagesBlock error={errorMessage}/>
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-outline-primary" onClick={handlerChangeFiles}>Change files</button>
                            <button className="btn btn-outline-primary" onClick={handlerClear}>Clear</button>
                            <button className="btn btn-success" onClick={handlerCreateToken}>Create Token</button>


                            <div>
                                {!connected ? (
                                    <span>
                                        <WalletMultiButton className="btn btn-primary"/>
                                        <button  className="btn btn-primary" disabled={connecting} onClick={async () => {
                                            await select('Phantom');
                                            await connect();
                                        }}>
                                            Connect Phantom
                                        </button>
                                    </span>
                                ) : (
                                    <span>
                                        <button  className="btn btn-primary" disabled={connecting} onClick={async () => {
                                            await disconnect()
                                        }}>
                                            Disconnect Phantom
                                        </button>
                                        <button className="btn btn-primary" onClick={() => handleSignMessage()} >Sign Message</button>
                                    </span>
                                )}
                            </div>


                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

const CreateMaterial = () => {
    const endpoint = process.env.ANCHOR_PROVIDER_URL
    const wallets = useMemo(() => [
        new SevensWalletAdapter(),
        new PhantomWalletAdapter()
    ], [])

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect={false}>
                <WalletModalProvider>
                    <CreateMaterialInner />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}

export default CreateMaterial
