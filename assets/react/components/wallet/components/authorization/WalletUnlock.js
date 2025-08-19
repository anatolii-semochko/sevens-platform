import React, { useState, useEffect, useRef } from 'react'
import config from '@react/components/wallet/config.json'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import { readEncryptedWallets } from '@react/components/wallet/scripts/storageActions'
import { InputPassword } from '@react/components/wallet/components/form-elements/Inputs'
import { ErrorMessageBlock } from '@react/components/wallet/components/form-elements/Messages'
import { WalletHeader } from '@react/components/wallet/components/form-elements/Blocks'
import { iconSize, ButtonWalletUnLock } from '@react/components/wallet/components/form-elements/Buttons'
import { Unlock, Clock12, Clock3, Clock6, Clock9 } from 'lucide-react'

const WalletUnlock = ({ unlock }) => {
    const { setPassword, setWalletsList } = useWalletContext()
    const [password, setUnlockPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)
    const [isBlocked, setIsBlocked] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const [clockStep, setClockStep] = useState(0)
    const timerRef = useRef(null)

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }

    const startClock = (seconds) => {
        setIsBlocked(true)
        setCountdown(seconds)
        setClockStep(0)
        clearTimer()
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                const next = prev - 1
                setClockStep(s => (s + 1) % 4)
                if (next <= 0) {
                    clearTimer()
                    setIsBlocked(false)
                    return 0
                }
                return next
            })
        }, 1000)
    }

    const checkPassword = () => {
        if (!password) {
            throw new Error('Please enter your password')
        }
    }

    const handleAuthorize = async (e) => {
        e.preventDefault()
        if (isBlocked) return
        try {
            setErrorMessage(null)
            checkPassword()
            const wallets = await readEncryptedWallets(password)
            setPassword(password)
            setWalletsList(wallets)
            unlock()
        } catch (error) {
            setErrorMessage(error.message || 'Invalid password')
            if (!isBlocked) startClock(config.PASSWORD_REPEAT_DELAY_SECONDS)
        }
    }

    useEffect(() => clearTimer(), [])

    const buttonLabel = !isBlocked ? 'Unlock wallet' : `Retry in ${countdown}s`
    const ClockIcon = [Clock12, Clock3, Clock6, Clock9][clockStep % 4]
    const ButtonIcon = isBlocked ?
        <ClockIcon size={iconSize} aria-hidden="true" /> :
        <Unlock size={iconSize} aria-hidden="true" />

    return (
        <div>
            <WalletHeader />
            <form onSubmit={handleAuthorize} className="p-3 d-grid gap-3">
                <div className="d-flex align-items-center">
                    <label className="me-2 px-1">Password: </label>
                    <InputPassword
                        placeholder="password"
                        password={password}
                        setPassword={setUnlockPassword}
                        setErrorMessage={setErrorMessage}
                    />
                </div>
                <ErrorMessageBlock message={errorMessage} className="mb-0" />
                <ButtonWalletUnLock label={buttonLabel} disabled={isBlocked} icon={ButtonIcon} />
            </form>
        </div>
    )
}

export default WalletUnlock
