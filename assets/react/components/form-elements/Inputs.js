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

const Select = ({id, placeHolder, className, value, onChange, options, disabled, required, setErrorMessage}) => (
    <select
        className={clsx('form-control', className)}
        id={id}
        placeholder={placeHolder}
        disabled={disabled}
        required={required}
        value={value}
        onChange={(e) => {
            onChange(e.target.value)
            if (setErrorMessage) setErrorMessage(null)
        }}
    >
        {options.map((option, key) => (
            <option key={key} value={option.value}>{option.label}</option>
        ))}
    </select>
)

export { Input, TextArea, Select }
