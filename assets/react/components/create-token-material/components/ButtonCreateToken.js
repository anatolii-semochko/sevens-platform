import React, { useState } from 'react'
import { mint } from '@js/blockchain/sevens-token'
import { connection } from '@js/blockchain/sevens'

export const ButtonCreateToken = ({tokenData, container, wallet, setMinted, setErrorMessage}) => {
    const [minting, setMinting] = useState(false)

    const handlerCreateToken = async () => {
        setErrorMessage(null)
        setMinting(true)
        try {

            // if (!connected || !publicKey) {
            //     await connect()
            //     if (!publicKey) {
            //         setErrorMessage('Failed to connect wallet')
            //         return
            //     }
            // }

            if (!wallet.connected) {
                new Error('Wallet is not connected')
            }
            if (!wallet.publicKey?.toString()) {
                new Error('Public key is not set')
            }
            if (!wallet.signTransaction || !wallet.signAllTransactions) {
                new Error('Wallet does not support transaction signing')
            }

            const { tx, mint: mintKeypair, publicKey: mintPubkey } = await mint({
                tokenName: tokenData.name,
                hash: container.hash,
                author: tokenData.author,
                description: tokenData.description,
                canBeBurned: tokenData.burnable,
                walletPublicKey: wallet.publicKey.toString(),
            })

            const signedByWallet = await wallet.signTransaction(tx)

            // Add mint keypair signature if needed (it should already be there from partialSign)
            if (signedByWallet.signatures.some(s => !s.signature && s.publicKey.equals(mintKeypair.publicKey))) {
                signedByWallet.partialSign(mintKeypair)
            }

            const sig = await connection.sendRawTransaction(signedByWallet.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            })

            // 4) Підтвердження
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
            await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')

            setMinted({
                signature: sig,
                mint: mintPubkey,
            })
        } catch (error) {
            setErrorMessage(error.message || 'Failed to create token')
        }
        setMinting(false)
    }

    return (
        <button className="btn btn-success" disabled={minting} onClick={handlerCreateToken}>
            Create Token
        </button>
    )
}
