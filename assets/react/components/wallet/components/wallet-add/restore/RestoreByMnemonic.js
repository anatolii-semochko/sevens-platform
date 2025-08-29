import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as bip39 from 'bip39'
import { t } from '@react/components/wallet/translations/translations'
import {
    getKeyFromMnemonic, ENGLISH_WORD_LIST, WORDS_TO_BITS, BIP_LENGTHS, BIP_DEFAULT,
} from '@react/components/wallet/scripts/crypto'
import { capitalizeFirstLetter } from '@react/components/wallet/scripts/utils'
import { ButtonContinue } from '@react/components/wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { SelectPhraseLength } from '@react/components/wallet/components/form-elements/Inputs'

const RestoreByMnemonic = ({setKp, setMnemonic}) => {
    const [mnemonic, setMnemonicPhrase] = useState([])
    const [mnemonicBits, setMnemonicBits] = useState(BIP_DEFAULT)
    const [words, setWords] = useState(Array(BIP_LENGTHS[BIP_DEFAULT]).fill(''))
    const [touched, setTouched] = useState(Array(BIP_LENGTHS[BIP_DEFAULT]).fill(false))
    const [errorMessage, setErrorMessage] = useState(null)
    const inputsRef = useRef([])
    const pendingFocusIndex = useRef(null)

    useEffect(() => {
        setKp(null)
        setMnemonic(null)
        setMnemonicPhrase(null)
    }, [])

    const cleanWord = (w) => w.toLowerCase().replace(/[^a-z]/g, '')

    const isValidWord = (w) => {
        const c = cleanWord(w)
        return !!c && ENGLISH_WORD_LIST.includes(c)
    }

    const mnemonicPhrase = useMemo(
        () => words.map(w => cleanWord(w)).filter(Boolean).join(' '),
        [words]
    )

    const invalidMask = useMemo(
        () => words.map(w => (w ? !isValidWord(w) : false)),
        [words]
    )
    const expected = useMemo(() => BIP_LENGTHS[mnemonicBits], [mnemonicBits])
    const filledCount = useMemo(() => words.filter(Boolean).length, [words])
    const invalidCount = useMemo(() => invalidMask.filter(Boolean).length, [invalidMask])

    const checksumOk = useMemo(() => {
        if (filledCount !== expected || invalidCount > 0 || !mnemonicPhrase) return false
        return ENGLISH_WORD_LIST
            ? bip39.validateMnemonic(mnemonicPhrase, ENGLISH_WORD_LIST)
            : bip39.validateMnemonic(mnemonicPhrase)
    }, [filledCount, expected, invalidCount, mnemonicPhrase, ENGLISH_WORD_LIST])

    const handleWordBlur = (idx) => {
        setTouched(prev => {
            const next = [...prev]
            next[idx] = true
            return next
        })
    }

    useEffect(() => {
        setMnemonicPhrase(mnemonicPhrase)
    }, [mnemonicPhrase])

    useEffect(() => {
        const n = BIP_LENGTHS[mnemonicBits]
        setWords(prev => {
            const next = Array(n).fill('')
            for (let i = 0; i < Math.min(prev.length, n); i++) next[i] = prev[i]
            return next
        })
        setTouched(Array(n).fill(false))
    }, [mnemonicBits])

    const handleWordChange = (idx, val) => {
        const v = cleanWord(val)
        setWords(prev => {
            const next = [...prev]
            next[idx] = v
            return next
        })
        setTouched(prev => {
            if (!prev[idx]) return prev // уже скинуте
            const next = [...prev]
            next[idx] = false
            return next
        })
    }

    const handlePastePhrase = (e) => {
        const text = e.clipboardData?.getData('text') || ''
        if (!text) return
        const cleaned = text.toLowerCase().replace(/[^\sa-z]/g, ' ').trim()
        const parts = cleaned.split(/\s+/).filter(Boolean)
        if (parts.length <= 1) return

        e.preventDefault()

        const maybeBits = WORDS_TO_BITS[parts.length]
        if (maybeBits) setMnemonicBits(maybeBits)

        setWords(() => {
            const n = maybeBits ? BIP_LENGTHS[maybeBits] : BIP_LENGTHS[mnemonicBits]
            const next = Array(n).fill('')
            const limit = Math.min(n, parts.length)
            for (let i = 0; i < limit; i++) next[i] = parts[i]
            pendingFocusIndex.current = next.findIndex(w => !w)
            return next
        })
        setTouched(() => Array(BIP_LENGTHS[maybeBits ?? mnemonicBits]).fill(false))
    }

    useEffect(() => {
        if (pendingFocusIndex.current != null && pendingFocusIndex.current >= 0) {
            const idx = pendingFocusIndex.current
            pendingFocusIndex.current = null
            inputsRef.current[idx]?.focus()
        }
    }, [words])

    const handleWordKeyDown = (idx, e) => {
        if ((e.key === ' ' || e.key === 'Enter') && idx < words.length - 1) {
            e.preventDefault()
            inputsRef.current[idx + 1]?.focus()
        }
    }

    const handleWordFocus = (idx) => {
        setTouched(prev => {
            const next = [...prev]
            next[idx] = false
            return next
        })
    }

    const handlePhraseLengthChange = (bits) => {
        setMnemonicBits(bits)
        setWords([])
    }

    const handleCheckWallet = async () => {
        setErrorMessage(null)
        try {
            const kp = await getKeyFromMnemonic(mnemonic)
            setKp(kp)
            setMnemonic(mnemonic)
        } catch (error) {
            setErrorMessage(capitalizeFirstLetter(error.message))
        }
    }

    const isComplete = filledCount === expected && invalidCount === 0 && checksumOk
    const isIncorrect = filledCount === expected && invalidCount === 0 && !checksumOk

    return (
        <>
            <div className="row g-2 mb-1">
                <SelectPhraseLength value={mnemonicBits} onChange={handlePhraseLengthChange} className={'mb-2'}/>
                {words.map((w, i) => (
                    <div className="col-4" key={`word-${i}`}>
                        <input
                            ref={el => (inputsRef.current[i] = el)}
                            className={`form-control ${touched[i] && words[i] && !isValidWord(words[i]) ? 'is-invalid' : ''}`}
                            value={words[i]}
                            onChange={(e) => handleWordChange(i, e.target.value)}
                            onKeyDown={(e) => handleWordKeyDown(i, e)}
                            onPaste={handlePastePhrase}
                            onFocus={() => handleWordFocus(i)}
                            onBlur={() => handleWordBlur(i)}
                            autoComplete="off"
                            inputMode="latin"
                            spellCheck={false}
                        />
                    </div>
                ))}
            </div>
            {isIncorrect && <ErrorMessageBlock message={t('mnemonicPhraseIncorrect')} className={'mb-0'}/>}
            <ErrorMessageBlock message={errorMessage} className={'mb-0'} />
            {isComplete && <ButtonContinue onClick={() => handleCheckWallet()} />}
        </>
    )
}

export default RestoreByMnemonic
