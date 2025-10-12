import React from 'react'
import { showModal } from '@js/modal'
import { StatusBar } from '@react/components/info-componnents/Charts'
import clsx from 'clsx'

const DownloadContainer = ({token}) => {

    return (
        <div>
            <StatusBar label={'Downloading'} processStatus={50} className={'bg-success'} />
        </div>
    )
}

const ButtonContainerDownload = ({token, className}) => !!token && (
    <button className={clsx('btn btn-primary', className)} onClick={() => showModal({
        id: 'download-files-container-' + token,
        title: "Download token files container",
        body: <DownloadContainer token={token}/>,
        size: 'lg',
    })}>
        Container download
    </button>
)

export default ButtonContainerDownload
