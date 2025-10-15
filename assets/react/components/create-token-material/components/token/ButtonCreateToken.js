import React, { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getData, mint } from '@js/blockchain/sevens-token'
import { ButtonWithProcessing } from '@react/components/form-elements/Buttons'

export const ButtonCreateToken = ({tokenData, container, setMinted, setErrorMessage}) => {
    const wallet = useWallet()
    const [minting, setMinting] = useState(false)

    const handlerCreateToken = async () => {
        try {
            setErrorMessage(null)
            if (!wallet.publicKey?.toString()) {
                throw new Error('Wallet is not activated')
            }
            setMinting(true)
            const {tokenPublicKey, signature} = await mint({
                tokenName: tokenData.name,
                hash: container.hash,
                author: tokenData.author,
                description: tokenData.description,
                canBeBurned: tokenData.burnable,
                wallet,
            })
            const minted = await getData(tokenPublicKey)
            setMinted({...minted, signature})
        } catch (error) {
            setErrorMessage(error.message)
        } finally {
            setMinting(false)
        }
    }

    useEffect(() => {
        setMinting(false)
        setErrorMessage(false)
    }, [wallet.publicKey?.toString()])

    return (
        <ButtonWithProcessing
            className={'btn-success px-5 py-2'}
            label={'Create Token'}
            disabled={minting}
            onClick={handlerCreateToken}
            processingLabel={'Waiting wallet signature...'}
            processing={minting}
        />
    )
}
