import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { route } from '@js/router/routing-with-locale'
import UserDropdown from './UserDropdown'
import LoginPopup from './LoginPopup'

export default function UserAuth() {
    const user = useSelector((state) => state.user)
    const [showLoginPopup, setShowLoginPopup] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)

    // Attach click handler to the icon in the template
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
        // User is logged in - show dropdown menu only
        return <UserDropdown user={user} isOpen={showDropdown} setIsOpen={setShowDropdown} />
    }

    // User is not logged in - show login popup
    const registerUrl = route('app_register')
    return (
        <LoginPopup
            isOpen={showLoginPopup}
            onClose={handleCloseLoginPopup}
            registerUrl={registerUrl}
        />
    )
}
