import clsx from 'clsx'
import React from 'react'

const SuccessMessageBlock = ({ message, className }) => !!message && (
    <div className={getMessageBlockClass('success', className)} role="alert">{getFormattedMessage(message)}</div>
)
const InfoMessageBlock = ({ message, className }) => !!message && (
    <div className={getMessageBlockClass('info', className)} role="alert">{getFormattedMessage(message)}</div>
)
const ErrorMessageBlock = ({ message, className }) => (!!message?.message || !!message) && (
    <div className={getMessageBlockClass('danger', className)} role="alert">
        {getFormattedMessage(message?.message || message)}
    </div>
)
const getMessageBlockClass = (type, className) => clsx(`alert-${type}`, 'alert text-break', className)
const MessagesBlock = ({success, info, error, className}) => (
    <>
         <ErrorMessageBlock message={error?.message || error} className={className} />
         <InfoMessageBlock message={info} className={className} />
         <SuccessMessageBlock message={success} className={className} />
    </>
)
const getFormattedMessage = (message) => message.split('\n').map((line, idx) => <div key={idx}>{line}</div>)

const LoaderBlock = ({message}) => (
    <div className="pt-3 pb-3 d-flex justify-content-center">
        <div className="spinner-border" role="status"></div>
        <div className="d-flex align-items-center ps-2">{message}</div>
    </div>
)

export { SuccessMessageBlock, InfoMessageBlock, ErrorMessageBlock, MessagesBlock, LoaderBlock }
