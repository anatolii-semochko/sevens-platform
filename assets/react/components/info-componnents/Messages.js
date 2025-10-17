import clsx from 'clsx'

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

export { SuccessMessageBlock, InfoMessageBlock, ErrorMessageBlock, MessagesBlock }
