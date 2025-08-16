import React from 'react'
import { createRoot } from 'react-dom/client'
import DynamicModal from '@react/components/modal/DynamicModal'

const showModal = ({ id, title, body, footer, size }) =>  {
    const container = document.createElement('div')
    container.id = `modal-container-${id}`
    document.body.appendChild(container)
    const root = createRoot(container)
    root.render(
        <DynamicModal
            id={id}
            title={title}
            body={body}
            footer={footer}
            size={size}
            onClose={() => {
                root.unmount()
                container.remove()
            }}
        />
    )
}

export { showModal }
