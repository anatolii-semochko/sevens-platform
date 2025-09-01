import clsx from 'clsx'

const Input = ({id, type, placeHolder, className, value, onChange, maxLength, disabled, required, setErrorMessage}) => (
    <input
        type={type || 'text'}
        className={clsx('form-control', className)}
        id={id}
        placeholder={placeHolder}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        value={value}
        onChange={(e) => {
            onChange(e.target.value)
            if (setErrorMessage) setErrorMessage(null)
        }}
    />
)

const TextArea = ({
    id,
    placeHolder,
    className,
    value,
    onChange,
    maxLength,
    rows,
    cols,
    disabled,
    required,
    setErrorMessage
}) => (
    <textarea
        className={clsx('form-control', className)}
        id={id}
        placeholder={placeHolder}
        maxLength={maxLength}
        rows={rows}
        cols={cols}
        disabled={disabled}
        required={required}
        value={value}
        onChange={(e) => {
            onChange(e.target.value)
            if (setErrorMessage) setErrorMessage(null)
        }}
    />
)

export { Input, TextArea }
