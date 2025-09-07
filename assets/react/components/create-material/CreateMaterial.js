import React, { useRef, useState, useMemo, useEffect } from 'react'
import { connection } from '@js/blockchain/sevens'
import { mint, sevensIdl } from '@js/blockchain/sevens-token'
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

            console.log('Creating token:', { tokenName, tokenAuthor, tokenDescription })

            // Ensure wallet is ready for transactions
            if (!signTransaction || !signAllTransactions) {
                throw new Error('Wallet does not support transaction signing')
            }

            const { tx, mint: mintKeypair, publicKey: mintPubkey } = await mint({
                tokenName: tokenName,
                hash: container.hash,
                author: tokenAuthor,
                description: tokenDescription,
                canBeBurned: true, // TODO !!!!!!!!!!!!
                walletPublicKey: publicKey.toString(), // Add wallet public key
            })

            // Sign transaction through wallet UI
            const signedByWallet = await signTransaction(tx)

            // Add mint keypair signature if needed (it should already be there from partialSign)
            if (signedByWallet.signatures.some(s => !s.signature && s.publicKey.equals(mintKeypair.publicKey))) {
                signedByWallet.partialSign(mintKeypair)
            }

            // 3) Відправка
            const sig = await connection.sendRawTransaction(signedByWallet.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            })

            // 4) Підтвердження
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
            await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')

            console.log({
                signature: sig,
                mint: mintPubkey,
            })

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



                            <div>
                                {connected ? (
                                    <span>
                                        <button  className="btn btn-primary" disabled={connecting} onClick={async () => await disconnect()}>
                                            Disconnect Phantom
                                        </button>
                                        <button className="btn btn-success" onClick={handlerCreateToken}>Create Token</button>
                                        <button className="btn btn-primary" onClick={() => handleSignMessage()} >Sign Message</button>
                                    </span>
                                ) : (
                                    <span>
                                        <WalletMultiButton className="btn btn-primary"/>
                                        <button  className="btn btn-primary" disabled={connecting} onClick={async () => {
                                            await select('Phantom');
                                            await connect();
                                        }}>
                                            Connect Phantom
                                        </button>
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
