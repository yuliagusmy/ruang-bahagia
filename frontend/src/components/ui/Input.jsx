import './Input.css'

/**
 * Input — komponen form input terstandarisasi
 * Mengikuti DESIGN.md: radius sm, border stone-200, focus border amber, min-height 48px
 */
export default function Input({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helper,
  required = false,
  disabled = false,
  rows,
  as = 'input',
  className = '',
  ...props
}) {
  const Component = as === 'textarea' ? 'textarea' : 'input'

  return (
    <div className={`rb-field ${error ? 'rb-field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id || name} className="rb-field__label">
          {label}
          {required && <span className="rb-field__required" aria-hidden="true">*</span>}
        </label>
      )}

      <Component
        id={id || name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows || (as === 'textarea' ? 3 : undefined)}
        className="rb-field__control"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />

      {error && (
        <p id={`${name}-error`} className="rb-field__error" role="alert">
          {error}
        </p>
      )}

      {helper && !error && (
        <p className="rb-field__helper">{helper}</p>
      )}
    </div>
  )
}
