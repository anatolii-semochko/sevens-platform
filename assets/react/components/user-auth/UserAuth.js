import React, { useState, useEffect } from 'react'
import store from '@react/store'
import { useSelector } from 'react-redux'
import { route } from '@js/router/routing-with-locale'
import { InfoMessageBlock } from '@react/components/info-componnents/Messages'
import UserDropdown from './UserDropdown'
import LoginPopup from './LoginPopup'

export default function UserAuth() {
    const user = useSelector((state) => state.user)
    const [showLoginPopup, setShowLoginPopup] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)

    useEffect(() => {
        const handleAuthRequest = () => {
            if (!user) {
                setShowLoginPopup(true)
            }
        }
        window.addEventListener('auth-request', handleAuthRequest)

        return () => window.removeEventListener('auth-request', handleAuthRequest)
    }, [user])

    useEffect(() => {
        const iconToggle = document.getElementById('user-dropdown-toggle')
        if (iconToggle) {
            const handleClick = (e) => {
                e.preventDefault()
                if (user) {
                    setShowDropdown(!showDropdown)
                } else {
                    setShowLoginPopup(true)
                }
            }
            iconToggle.addEventListener('click', handleClick)
            return () => iconToggle.removeEventListener('click', handleClick)
        }
    }, [user, showDropdown])

    const handleCloseLoginPopup = () => {
        setShowLoginPopup(false)
    }

    if (user) {
        return <UserDropdown user={user} isOpen={showDropdown} setIsOpen={setShowDropdown} />
    }

    const registerUrl = route('app_register')

    return (
        <LoginPopup
            isOpen={showLoginPopup}
            onClose={handleCloseLoginPopup}
            registerUrl={registerUrl}
        />
    )
}

export const callUserAuthorization = () => {
    window.dispatchEvent(new CustomEvent('auth-request'))
}

export const UserAuthorization = ({message}) => {
    useEffect(() => {
        if (store.getState().user) {
            return
        }

        const timeoutId = setTimeout(() => {
            callUserAuthorization()
        }, 100)

        return () => clearTimeout(timeoutId)
    }, [])

    return (
        <InfoMessageBlock message={message || 'This operation requires user authorization.'} />
    )
}
