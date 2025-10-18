import React, { useEffect } from 'react'
import store from '@react/store'
import { InfoMessageBlock } from '@react/components/info-componnents/Messages'

export const callUserAuthorization = () => {
    const link = document.querySelector('#user-auth a')
    if (link) {
        link.click()
        return true
    }
    return false
}

export const UserAuthorization = ({message}) => {
    useEffect(() => {
        if (store.getState().user) {
            return
        }
        if (callUserAuthorization()) {
            return
        }
        const observer = new MutationObserver(() => {
            if (callUserAuthorization()) observer.disconnect()
        })
        observer.observe(document.body, { childList: true, subtree: true })

        return () => observer.disconnect()
    }, [])

    return (
        <InfoMessageBlock message={message || 'This operation requires user authorization.'} />
    )
}
