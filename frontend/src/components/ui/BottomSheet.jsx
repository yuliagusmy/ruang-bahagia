import './BottomSheet.css'
import { useEffect } from 'react'

/**
 * BottomSheet — wrapper form pendek dan detail
 * Alasan: mobile-first, menghindari modal full-screen yang ganggu konteks (AGENTS.md rule 4)
 */
export default function BottomSheet({ isOpen, onClose, title, children, height = 'auto', className = '' }) {
  // Tutup dengan Escape (R-32 keyboard accessibility)
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.() }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Lock body scroll saat sheet terbuka
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <div
        className="rb-sheet-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`rb-sheet ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={height !== 'auto' ? { height } : {}}
      >
        <div className="rb-sheet__handle" aria-hidden="true" />
        {title && (
          <div className="rb-sheet__header">
            <h3 className="rb-sheet__title">{title}</h3>
            <button
              className="rb-sheet__close"
              onClick={onClose}
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        )}
        <div className="rb-sheet__body">
          {children}
        </div>
      </div>
    </>
  )
}
