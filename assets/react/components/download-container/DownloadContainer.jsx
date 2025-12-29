import React, {useState, useEffect, useRef} from 'react'
import clsx from 'clsx'
import { showModal } from '@js/modal'
import { SuccessMessageBlock } from '@react/components/info-componnents/Messages'
import MaterialApi from '@react/api/materialApi'

const materialApi = new MaterialApi()

export const DownloadContainer = ({token, onDownloaded}) => {
    const [downloading, setDownloading] = useState(false)
    const [downloaded, setDownloaded] = useState(false)
    const [error, setError] = useState(null)
    const timeoutRef = useRef(null)

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const handleDownload = async () => {
        setDownloading(true)
        setDownloaded(false)
        setError(null)

        try {
            // Fetch presigned download URL from backend
            const { downloadUrl, filename } = await materialApi.getArchiveDownloadUrl(token)

            // Create hidden link to trigger download
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = filename || `material-${token}.zip`
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Show success message after short delay
            // (we can't actually detect download completion with presigned URLs)
            timeoutRef.current = setTimeout(() => {
                setDownloading(false)
                setDownloaded(true)
                if (onDownloaded) {
                    onDownloaded()
                }
            }, 1000)
        } catch (err) {
            setDownloading(false)
            setError(err.message || 'Failed to download archive')
        }
    }

    return (
        <div>
            <h3 className="text-center">Attention !</h3>
            <p className="mb-2">
                The file container is an integral part of your intellectual property, represented by the current token.
                Losing this container means losing your proof of ownership. Download it and store it in a safe place
                along with your wallet's private key!
            </p>
            <p className="text-center mb-2">Token public key:</p>
            <p className="text-center fw-bold mb-3">{token}</p>
            {error && (
                <div className="alert alert-danger mb-3" role="alert">
                    {error}
                </div>
            )}
            {!downloaded && !downloading && (
                <button className="btn w-100 fs-5 btn-primary p-2 mb-1" onClick={handleDownload}>
                    Download
                </button>
            )}
            {downloading && (
                <div className="text-center mb-3">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Preparing download...</span>
                    </div>
                    <p className="mt-2 mb-0">Preparing your archive...</p>
                    <small className="text-muted">Download will start automatically</small>
                </div>
            )}
            {downloaded && (
                <SuccessMessageBlock
                    message={'The file container has been downloaded successfully. Save it in a safe place.'}
                    className={'mb-0'}
                />
            )}
        </div>
    )
}

export const ButtonContainerDownload = ({token, className}) => !!token && (
    <button className={clsx('btn btn-primary', className)} onClick={() => showModal({
        id: 'download-files-container-' + token,
        title: 'Download token files container',
        body: <DownloadContainer token={token}/>,
        size: 'lg',
    })}>
        Container download
    </button>
)

ButtonContainerDownload.DownloadContainer = DownloadContainer
