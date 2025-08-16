import React, { useState } from 'react';
import UserDropdown from './UserDropdown';
import LoginPopup from './LoginPopup';

export default function UserAuth({ user = null, registerUrl = '/register' }) {
    const [showLoginPopup, setShowLoginPopup] = useState(false);

    const handlePersonIconClick = (e) => {
        e.preventDefault();
        if (!user) {
            setShowLoginPopup(true);
        }
        // If user is logged in, the UserDropdown component handles the click
    };

    const handleCloseLoginPopup = () => {
        setShowLoginPopup(false);
    };

    if (user) {
        // User is logged in - show dropdown
        return <UserDropdown user={user} />;
    }

    // User is not logged in - show clickable icon and login popup
    return (
        <>
            <a
                href="#"
                className="text-dark"
                onClick={handlePersonIconClick}
            >
                <i className="bi bi-person fs-4 icon-button"></i>
            </a>
            <LoginPopup
                isOpen={showLoginPopup}
                onClose={handleCloseLoginPopup}
                registerUrl={registerUrl}
            />
        </>
    );
}
