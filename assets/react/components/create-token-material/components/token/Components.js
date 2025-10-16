import React, {useEffect, useState} from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getData, mint } from '@js/blockchain/sevens-token'
import { ButtonWithProcessing } from '@react/components/form-elements/Buttons'

export const TryMoreOptions = ({minted, doMaterial, handlerClear}) => !doMaterial && minted && (
    <div className="d-flex flex-column align-items-center gap-2 text-center mb-3">
        <h6>You can try:</h6>
        <div className="d-flex flex-wrap justify-content-center gap-2">
            <a href={Routing.generate('check_token')} className="btn btn-primary">Check your token container</a>
            <button className="btn btn-primary" onClick={handlerClear}>Mint a new token</button>
            <a href={Routing.generate('create_material_from_token')} className="btn btn-primary">
                Publish material on site
            </a>
        </div>
    </div>
)

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
