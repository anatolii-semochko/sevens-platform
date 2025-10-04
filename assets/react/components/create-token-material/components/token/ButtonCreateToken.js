import React, { useState } from 'react'
import { mint } from '@js/blockchain/sevens-token'
import { connection, getAnchorErrorText } from '@js/blockchain/sevens'
import { SendTransactionError } from '@solana/web3.js'

export const ButtonCreateToken = ({tokenData, container, wallet, setMinted, setErrorMessage}) => {
    const [minting, setMinting] = useState(false)





    // TODO - FIX THIS METHOD LATER !
    const checkCreateToken = () => {
        // if (!connected || !publicKey) {
        //     await connect()
        //     if (!publicKey) {
        //         setErrorMessage('Failed to connect wallet')
        //         return
        //     }
        // }

        if (!wallet.connected) {
            throw new Error('Wallet is not connected')
        }
        if (!wallet.publicKey?.toString()) {
            throw new Error('Public key is not set')
        }
        if (!wallet.signTransaction || !wallet.signAllTransactions) {
            throw new Error('Wallet does not support transaction signing')
        }
        // if (!tokenData.tokenName) {
        //     throw new Error("Token name can't be empty")
        // }
    }




    const handlerCreateToken = async () => {
        setErrorMessage(null)
        setMinting(true)
        try {
            checkCreateToken()

            const { tx, mint: mintKeypair, publicKey: mintPubkey } = await mint({
                tokenName: tokenData.name,
                hash: container.hash,
                author: tokenData.author,
                description: tokenData.description,
                canBeBurned: tokenData.burnable,
                walletPublicKey: wallet.publicKey.toString(),
            })

            let signedByWallet
            try {
                signedByWallet = await wallet.signTransaction(tx)
            } catch (signError) {
                throw new Error(getAnchorErrorText(signError))
            }

            // Add mint keypair signature if needed (it should already be there from partialSign)
            if (signedByWallet.signatures.some(s => !s.signature && s.publicKey.equals(mintKeypair.publicKey))) {
                signedByWallet.partialSign(mintKeypair)
            }

            let sig
            try {
                sig = await connection.sendRawTransaction(signedByWallet.serialize(), {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                })
            } catch (sendError) {
                // Handle SendTransactionError and extract logs
                if (sendError instanceof SendTransactionError) {
                    const logs = sendError.getLogs()
                    console.error('Transaction logs:', logs)

                    // Create error object with logs for getAnchorErrorText to process
                    const errorWithLogs = {
                        ...sendError,
                        logs: logs,
                        message: sendError.message
                    }

                    throw new Error(getAnchorErrorText(errorWithLogs))
                }
                console.error('Send transaction error:', sendError)
                throw new Error(getAnchorErrorText(sendError))
            }

            // Confirm
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
            await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')

            setMinted({
                signature: sig,
                mint: mintPubkey,
                walletPublicKey: wallet.publicKey.toString(),
            })
        } catch (error) {
            console.error('Create token error:', error)
            setErrorMessage(getAnchorErrorText(error))
        }
        setMinting(false)
    }

    return (
        <button
            className="btn btn-success px-5 py-2"
            disabled={!wallet.publicKey || minting}
            onClick={handlerCreateToken}
        >
            {minting ? (
                <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Waiting...
                </>
            ) : (
                'Create Token'
            )}
        </button>
    )
}
