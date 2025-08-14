import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';

export default function LoginPopup({ isOpen, onClose, registerUrl = '/register' }) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Close popup on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Get current locale from AppConfig
            const locale = window.AppConfig?.currentLocale || 'en';
            
            // Create a form element to submit to Symfony's login endpoint
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `/${locale}/login`;
            form.style.display = 'none';

            // Add email field
            const emailInput = document.createElement('input');
            emailInput.type = 'email';
            emailInput.name = 'email';
            emailInput.value = formData.email;
            form.appendChild(emailInput);

            // Add password field
            const passwordInput = document.createElement('input');
            passwordInput.type = 'password';
            passwordInput.name = 'password';
            passwordInput.value = formData.password;
            form.appendChild(passwordInput);

            // Add CSRF token
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_csrf_token';
            csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            form.appendChild(csrfInput);

            // Add form to document and submit
            document.body.appendChild(form);
            form.submit();
            
            // The form submission will either redirect on success or reload with errors
            // If we reach here, show a success message
            toast.success('Logging in...');
            
        } catch (err) {
            setError('Network error. Please try again.');
            toast.error('Network error');
            setIsLoading(false);
        }
    };

    const handleRegisterRedirect = () => {
        window.location.href = registerUrl;
    };

    if (!isOpen) return null;

    return (
        <>
            <Toaster position="top-right" reverseOrder={false} />
            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title w-100 text-center display-6">Sign In</h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={onClose}
                                disabled={isLoading}
                            ></button>
                        </div>
                        <div className="modal-body p-4">
                            {error && (
                                <div className="alert alert-danger mb-4">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className="form-control"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        autoComplete="email"
                                        autoFocus
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="password" className="form-label">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        className="form-control"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        autoComplete="current-password"
                                        disabled={isLoading}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary w-100 mb-3"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Signing In...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>

                                <div className="text-center">
                                    <p className="mb-0 text-muted">Don't have an account?</p>
                                    <button 
                                        type="button"
                                        className="btn btn-link p-0 text-decoration-none"
                                        onClick={handleRegisterRedirect}
                                        disabled={isLoading}
                                    >
                                        Register here
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}