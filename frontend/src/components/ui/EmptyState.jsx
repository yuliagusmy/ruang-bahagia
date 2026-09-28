import Button from './Button'
import './EmptyState.css'

/**
 * EmptyState — tampilan saat data kosong
 * Alasan: Antislop mewajibkan empty state yang jelas dan bermakna (R-05)
 */
export default function EmptyState({
  title = 'Belum Ada Data',
  message,
  actionLabel,
  onAction,
  icon,
}) {
  return (
    <div className="rb-empty-state">
      <div className="rb-empty-state__icon" aria-hidden="true">
        {icon || (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        )}
      </div>
      <h4 className="rb-empty-state__title">{title}</h4>
      {message && <p className="rb-empty-state__message">{message}</p>}
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="rb-empty-state__action">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
