import React, { useEffect, useMemo, useState } from 'react'
import WalletTranslation from '@react/components/wallet/components/form-elements/WalletTranslation'
import { ButtonBack, ButtonRepeat } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'

const ConfirmWallet = ({ mnemonic, setMnemonicSaved, handleMnemonicConfirmed }) => {
    const words = useMemo(() => {
        if (Array.isArray(mnemonic)) return mnemonic
        if (!mnemonic) return []
        return String(mnemonic).trim().split(/\s+/)
    }, [mnemonic])

    const [shuffled, setShuffled] = useState([])
    const [picked, setPicked] = useState([])
    const [error, setError] = useState(null)

    const shuffle = (arr) => {
        const copy = [...arr]
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[copy[i], copy[j]] = [copy[j], copy[i]]
        }
        return copy
    }

    const reset = () => {
        const source = words.map((w, i) => ({ w, i }))
        setShuffled(shuffle(source))
        setPicked([])
        setError(null)
    }

    useEffect(() => {
        reset()
    }, [words.join(' ')])

    const handlePick = (i) => {
        setError(null)
        setShuffled((prev) => prev.filter((item) => item.i !== i))
        setPicked((prev) => [...prev, i])
    }

    useEffect(() => {
        if (picked.length === words.length && words.length > 0) {
            const isCorrect = picked.every((idx, pos) => idx === pos)
            if (isCorrect) {
                handleMnemonicConfirmed(true)
            } else {
                setError('Wallet seed confirm error')
            }
        }
    }, [picked, words, handleMnemonicConfirmed])

    return (
        <div className="d-grid gap-2 pt-1">
            <h6 className="d-flex justify-content-center mb-0">
                <WalletTranslation text="Confirm seed phrase" />
            </h6>
            <div className="d-grid gap-2">
                {picked.length === 0 ? (
                    <div className="text-center small d-md-block h6 my-2 mb-0">
                        <WalletTranslation text="Tap the words below in the correct order"/>
                        <hr className="my-2"/>
                    </div>
                ) : (
                    <div className="row g-2 mt-1">
                        {picked.map((idx) => (
                            <div className="col-4" key={`picked-${idx}`}>
                                <button className="btn w-100" disabled>{words[idx]}</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="d-grid gap-2">
                <div className="row g-2">
                    {shuffled.map(({ w, i }) => (
                        <div className="col-4" key={`choice-${i}`}>
                            <button className="btn w-100" onClick={() => handlePick(i)}>{w}</button>
                        </div>
                    ))}
                </div>
            </div>
            <ErrorMessageBlock message={error} className="mb-2"/>
            <div className="d-grid gap-3">
                <ButtonRepeat onClick={reset} />
                <ButtonBack label={'Back'} onClick={() => setMnemonicSaved(false)} />
            </div>
        </div>
    )
}

export default ConfirmWallet
