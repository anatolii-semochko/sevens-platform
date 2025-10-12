import React, {useState} from 'react'
import clsx from 'clsx'
import { showModal } from '@js/modal'
import { StatusBar } from '@react/components/info-componnents/Charts'
import { SuccessMessageBlock } from '@react/components/info-componnents/Messages'

export const DownloadContainer = ({token, onDownloaded}) => {
    const [downloading, setDownloading] = useState(null)
    const [downloaded, setDownloaded] = useState(false)

    const handleDownload = () => {
        setDownloading(0)
        setDownloaded(false)

        let progress = 0
        const interval = setInterval(() => {
            progress += 10
            setDownloading(progress)

            if (progress >= 100) {
                clearInterval(interval)
                setDownloading(null)
                setDownloaded(true)
                if (onDownloaded) {
                    onDownloaded()
                }
            }
        }, 100)
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
            {!downloaded && !downloading && (
                <button className="btn w-100 fs-5 btn-primary p-2 mb-1" onClick={handleDownload}>
                    Download
                </button>
            )}
            {!!downloading && (
                <StatusBar label={'Downloading'} processStatus={downloading} className={'bg-success'} />
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
