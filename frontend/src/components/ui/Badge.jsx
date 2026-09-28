import './Badge.css'

const STATUS_MAP = {
  inquiry:     { label: 'Inquiry',    color: 'info' },
  dp_paid:     { label: 'DP Lunas',  color: 'warning' },
  shooting:    { label: 'Shooting',  color: 'warning' },
  editing:     { label: 'Editing',   color: 'info' },
  proofing:    { label: 'Proofing',  color: 'info' },
  completed:   { label: 'Selesai',   color: 'success' },
  cancelled:   { label: 'Batal',     color: 'error' },
  pending:     { label: 'Pending',   color: 'info' },
  confirmed:   { label: 'Konfirmasi',color: 'warning' },
  in_progress: { label: 'Berlangsung', color: 'warning' },
  available:   { label: 'Tersedia', color: 'success' },
  booked:      { label: 'Terbooking', color: 'error' },
  blocked:     { label: 'Diblokir',  color: 'error' },
}

/**
 * Badge — label status
 * Alasan: menunjukkan state dengan warna semantik, bukan dekoratif (R-09)
 */
export default function Badge({ status, label, color, size = 'md' }) {
  const config = STATUS_MAP[status] || { label: label || status, color: color || 'info' }

  return (
    <span className={`rb-badge rb-badge--${config.color} rb-badge--${size}`}>
      <span className="rb-badge__dot" />
      {label || config.label}
    </span>
  )
}
