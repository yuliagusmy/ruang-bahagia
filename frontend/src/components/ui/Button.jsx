import './Button.css'

/**
 * Button — komponen CTA utama Ruang Bahagia
 * Alasan: tap target 48px, warna amber hanya pada CTA utama (R-31)
 */
export default function Button({
  children,
  variant = 'primary',  // primary | secondary | ghost | danger
  size = 'md',          // sm | md | lg
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        'rb-btn',
        `rb-btn--${variant}`,
        `rb-btn--${size}`,
        fullWidth ? 'rb-btn--full' : '',
        loading ? 'rb-btn--loading' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading ? (
        <span className="rb-btn__spinner" aria-hidden="true" />
      ) : null}
      <span className={loading ? 'rb-btn__label--hidden' : ''}>{children}</span>
    </button>
  )
}
