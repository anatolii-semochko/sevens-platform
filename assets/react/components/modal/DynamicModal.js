import { useEffect, useRef } from 'react'

const DynamicModal = ({ id, title, body, onClose, footer, size }) => {
    const modalRef = useRef(null)

    useEffect(() => {
        const modalElement = modalRef.current
        const bs = window.bootstrap

        if (bs && modalElement) {
            const modalInstance = new bs.Modal(modalElement)
            modalInstance.show()

            modalElement.addEventListener('hide.bs.modal', () => {
                if (document.activeElement && modalElement.contains(document.activeElement)) {
                    document.activeElement.blur()
                }
            })

            modalElement.addEventListener('hidden.bs.modal', () => {
                onClose?.()
            })
        }
    }, [])

    const sizeClass = size ? `modal-${size}` : '' // sm, lg, xl

    return (
        <div
            ref={modalRef}
            className="modal fade"
            id={id}
            tabIndex="-1"
            aria-labelledby={`${id}Label`}
            aria-hidden="true"
        >
            <div className={`modal-dialog ${sizeClass}`}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id={`${id}Label`}>{title}</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                    </div>
                    <div className="modal-body">{body}</div>
                    <div className="modal-footer">
                        {footer}
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DynamicModal
