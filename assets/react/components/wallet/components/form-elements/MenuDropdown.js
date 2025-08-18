import React, { useState, useEffect, useRef } from 'react'
import { FaBars } from 'react-icons/fa'
import clsx from 'clsx'

const MenuDropdown = ({
    border,
    elements,
    style,
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const ref = useRef()
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="position-relative" ref={ref}>
            <button
                className={clsx('btn btn-white', border ? 'border' : '')}
                onClick={() => setIsOpen(!isOpen)} title="Menu"
            >
                <FaBars />
            </button>
            {isOpen && (
                <div
                    className="position-absolute mt-2 bg-white border rounded shadow-sm z-10 dropdown-menu show"
                    style={style}
                >
                    {elements.map((item, index) => (
                        <button
                            key={index}
                            className="dropdown-item px-3 py-2 d-flex align-items-center gap-2"
                            onClick={() => { item.action(); setIsOpen(false) }}
                        >
                            {item.icon} {item.title}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MenuDropdown
