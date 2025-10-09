import clsx from 'clsx'

export const Input = ({id, type, placeHolder, className, value, onChange, maxLength, disabled, required, setErrorMessage}) => (
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

export const Number = ({id, placeHolder, className, value, onChange, min, max, maxDecimals, disabled, required, setErrorMessage}) => (
    <input
        type={'number'}
        className={clsx('form-control', className)}
        id={id}
        placeholder={placeHolder}
        min={min}
        max={max}
        disabled={disabled}
        required={required}
        value={value}
        onChange={(e) => {
            const newValue = e.target.value

            // Allow empty value
            if (newValue === '') {
                onChange(newValue)
                if (setErrorMessage) setErrorMessage(null)
                return
            }

            // Check decimal places if maxDecimals is specified
            if (maxDecimals !== undefined) {
                const decimalMatch = newValue.match(/\.(\d+)/)
                if (decimalMatch && decimalMatch[1].length > maxDecimals) {
                    if (setErrorMessage) setErrorMessage(`Maximum ${maxDecimals} decimal places allowed`)
                    return
                }
            }

            const numValue = parseFloat(newValue)

            // Allow incomplete numbers during typing (., 0., 0.0, etc.)
            if (isNaN(numValue) && (newValue === '.' || /^0?\.0*$/.test(newValue))) {
                onChange(newValue)
                if (setErrorMessage) setErrorMessage(null)
                return
            }

            if (isNaN(numValue)) {
                if (setErrorMessage) setErrorMessage('Please enter a valid number')
                return
            }

            // Validate min/max only for valid numbers
            if (min !== undefined && numValue < min) {
                if (setErrorMessage) setErrorMessage(`Value must be at least ${min}`)
                return
            }

            if (max !== undefined && numValue > max) {
                if (setErrorMessage) setErrorMessage(`Value must not exceed ${max}`)
                return
            }

            onChange(newValue)
            if (setErrorMessage) setErrorMessage(null)
        }}
    />
)

export const TextArea = ({
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

export const Select = ({id, placeHolder, className, value, onChange, options, disabled, required, setErrorMessage}) => (
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







export const ToggleSwitch = ({
                                 id = `toggle-${Math.random().toString(36).slice(2, 9)}`,
                                 checked,
                                 defaultChecked,
                                 onChange = () => {},
                                 label,
                                 inline = false,
                                 disabled = false,
                                 size = "md", // sm | md | lg
                                 className = "",
                                 ...rest
                             }) => {
    const handleChange = (e) => onChange(e.target.checked, e);

    // Класи для розмірів (без scale)
    const sizeStyles = {
        sm: { width: "2rem", height: "1rem" },
        md: { width: "2.5rem", height: "1.25rem" },
        lg: { width: "3rem", height: "1.5rem" },
    };

    const knobSize = {
        sm: "0.9rem",
        md: "1.1rem",
        lg: "1.3rem",
    };

    return (
        <div
            className={`d-flex align-items-center justify-content-center ${
                inline ? "d-inline-flex" : ""
            } ${className}`}
            style={{ position: "relative", width: "100%", height: "100%" }}
        >
            <div
                className="form-check form-switch m-0 p-0"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
                <div
                    style={{
                        position: "relative",
                        ...sizeStyles[size],
                        backgroundColor: checked ? "#0d6efd" : "#ccc",
                        borderRadius: "1rem",
                        transition: "background-color 0.2s",
                        cursor: disabled ? "not-allowed" : "pointer",
                        flexShrink: 0,
                    }}
                    onClick={() => !disabled && onChange(!checked)}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: checked ? `calc(100% - ${knobSize[size]} - 0.1rem)` : "0.1rem",
                            transform: "translateY(-50%)",
                            width: knobSize[size],
                            height: knobSize[size],
                            backgroundColor: "#fff",
                            borderRadius: "50%",
                            transition: "left 0.2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                    />
                </div>
                {label && (
                    <label
                        htmlFor={id}
                        className="mb-0"
                        style={{
                            fontSize: size === "lg" ? "1.1rem" : size === "sm" ? "0.9rem" : "1rem",
                            userSelect: "none",
                            cursor: "pointer",
                        }}
                        onClick={() => !disabled && onChange(!checked)}
                    >
                        {label}
                    </label>
                )}
            </div>
        </div>
    );
}


// ---------- Приклад використання ----------
// 1) Імпорт Bootstrap CSS (один раз у вашому додатку, напр. у index.js або App.jsx):
// import 'bootstrap/dist/css/bootstrap.min.css';


// 2) Контрольований приклад:
// const [isOn, setIsOn] = useState(false);
// <ToggleSwitch checked={isOn} onChange={(v) => setIsOn(v)} label="Увімкнути сповіщення" />


// 3) Неконтрольований приклад (без state):
// <ToggleSwitch defaultChecked={true} label="За замовчуванням увімкнено" />


// 4) Малий inline приклад:
// <ToggleSwitch size="sm" inline label="Коротко" />


// ---------- Поради ----------
// - Якщо вам потрібен більш стильний switch — можна додати свої CSS-класи або використовувати бібліотеки
// на кшталт react-bootstrap, react-switch або bootstrap-toggle.
// - Для інтеграції з формами (Formik, react-hook-form) використайте контролюваний режим (checked + onChange)
