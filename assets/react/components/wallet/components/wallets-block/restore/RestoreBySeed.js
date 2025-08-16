import React, { useEffect, useState } from 'react'
import { getKeyFromSeed } from '@react/components/wallet/scripts/crypto'
import { capitalizeFirstLetter } from '@react/components/wallet/scripts/utils'
import { ButtonContinue } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'

const RestoreBySeed = ({setKp}) => {
    const [seed, setSeed] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)
    useEffect(() => {
        setKp(null)
    }, [])

    const checkWallet = async () => {
        setErrorMessage(null)
        try {
            const kp = getKeyFromSeed(seed)
            setKp(kp)
        } catch (error) {
            setErrorMessage(capitalizeFirstLetter(error.message))
        }
    }
    
    return (
        <>
            <textarea
                className="form-control mb-1"
                placeholder="Base58 seed (32 bytes)"
                rows={2}
                value={seed}
                onChange={(e) => {
                    setSeed(e.target.value.trim())
                    setErrorMessage(null)
                }}
            />
            <ErrorMessageBlock message={errorMessage} className={'mb-1'} />
            {seed && <ButtonContinue onClick={() => checkWallet()} />}
        </>
    )
}

export default RestoreBySeed
