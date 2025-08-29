import config from '@react/components/wallet/config.json'
import React, { useEffect, useRef, useState } from 'react'
import { t } from '@react/components/wallet/translations/translations'
import useWalletContext from '@react/components/wallet/hooks/useWalletContext'
import clsx from 'clsx'

const CurrentLanguage = ({className}) => {
    const {language, setLanguage} = useWalletContext()
    const languages = config.LANGUAGES

    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)
    const languageEntries = Object.entries(languages)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (code) => {
        setLanguage(code)
        setIsOpen(false)
    }

    const selectedLanguage = language ? languages[language] : t('selectLanguage')

    return (

        <div className={clsx('d-flex align-items-center', className)}>
            <label className="text-nowrap me-2 mb-0 px-1">{t('language')}: </label>
            <div className={clsx('position-relative w-100', className)} ref={dropdownRef}>
                <button
                    type="button"
                    id="current-language"
                    className="form-select text-start d-flex align-items-center justify-content-between"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ gap: '8px' }}
                >
                    <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                        {language && (
                            <img
                                src={require(`@react/components/wallet/translations/flags/${language}.png`)}
                                alt={`${selectedLanguage} flag`}
                                style={{
                                    width: '20px',
                                    height: '15px',
                                    flexShrink: 0
                                }}
                            />
                        )}
                        <span>{selectedLanguage}</span>
                    </div>
                </button>
                {isOpen && (
                    <div
                        className="position-absolute w-100 bg-white border rounded shadow-sm"
                        style={{
                            top: '100%',
                            zIndex: 1050,
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}
                    >
                        {languageEntries.map(([code, name]) => (
                            <button
                                key={code}
                                type="button"
                                className={clsx(
                                    'w-100 px-3 py-2 border-0 text-start d-flex align-items-center',
                                    { 'bg-primary text-white': language === code }
                                )}
                                onClick={() => handleSelect(code)}
                                style={{
                                    backgroundColor: language === code ? '' : 'transparent',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    if (language !== code) {
                                        e.target.style.backgroundColor = '#f8f9fa'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (language !== code) {
                                        e.target.style.backgroundColor = 'transparent'
                                    }
                                }}
                            >
                                <img
                                    src={require(`@react/components/wallet/translations/flags/${code}.png`)}
                                    alt={`${name} flag`}
                                    style={{
                                        width: '20px',
                                        height: '15px',
                                        flexShrink: 0
                                    }}
                                />
                                <span>{name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CurrentLanguage
