import clsx from 'clsx'

export const ButtonLargeWidth = ({label, onClick, className}) => (
    <button className={clsx('btn w-100 fs-5 p-3 mb-3', className)} onClick={onClick}>{label}</button>
)
