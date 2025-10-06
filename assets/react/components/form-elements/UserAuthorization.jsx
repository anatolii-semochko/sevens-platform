import React, { useEffect } from 'react'
import store from '@react/store'
import { InfoMessageBlock } from '@react/components/form-elements/Messages'

export const UserAuthorization = ({message}) => {
    useEffect(() => {
        if (store.getState().user) return

        const tryClick = () => {
            const link = document.querySelector('#user-auth a')
            if (link) {
                link.click()
                return true
            }
            return false
        }

        // Try click
        if (tryClick()) return

        // Or wait the element
        const observer = new MutationObserver(() => {
            if (tryClick()) observer.disconnect()
        })

        observer.observe(document.body, { childList: true, subtree: true })

        // Demount observer
        return () => observer.disconnect()
    }, [])

    return (
        <InfoMessageBlock message={message || 'This operation requires user authorization.'} />
    )
}
