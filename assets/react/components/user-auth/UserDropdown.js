import React, { useState, useEffect, useRef } from 'react'

export default function UserDropdown({ user }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const toggleDropdown = (e) => {
        e.preventDefault()
        setIsOpen(!isOpen)
    }

    const handlePersonalCabinet = (e) => {
        e.preventDefault()
        // Navigate to user profile page using locale-aware route
        const locale = window.AppConfig?.currentLocale || 'en'
        window.location.href = user.profileUrl || `/${locale}/user`
        setIsOpen(false)
    }

    const handleLogout = (e) => {
        e.preventDefault()
        // Navigate to logout using the correct locale-aware route
        const locale = window.AppConfig?.currentLocale || 'en'
        window.location.href = `/${locale}/logout`
    }

    return (
        <div className="position-relative" ref={dropdownRef}>
            <a 
                href="#" 
                className="text-dark d-flex align-items-center" 
                onClick={toggleDropdown}
            >
                <i className="bi bi-person fs-4 icon-button"></i>
            </a>
            
            {isOpen && (
                <div className="dropdown-menu dropdown-menu-end show position-absolute" style={{ top: '100%', right: 0, minWidth: '200px' }}>
                    <div className="dropdown-header">
                        <div className="d-flex align-items-center">
                            <i className="bi bi-person-circle fs-5 me-2 text-primary"></i>
                            <div>
                                <div className="fw-bold">{user.email}</div>
                                <small className="text-muted">Welcome back!</small>
                            </div>
                        </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button 
                        className="dropdown-item d-flex align-items-center" 
                        onClick={handlePersonalCabinet}
                    >
                        <i className="bi bi-person-gear me-2"></i>
                        Personal Cabinet
                    </button>
                    <div className="dropdown-divider"></div>
                    <button 
                        className="dropdown-item d-flex align-items-center text-danger" 
                        onClick={handleLogout}
                    >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Logout
                    </button>
                </div>
            )}
        </div>
    )
}