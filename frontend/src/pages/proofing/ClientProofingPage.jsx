import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useClientProofing } from '../../hooks/useProofing'
import PhotoSwipeCard from '../../components/proofing/PhotoSwipeCard'
import SelectionCounter from '../../components/proofing/SelectionCounter'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import ProofingPinGate from './components/ProofingPinGate'
import ProofingReviewSheet from './components/ProofingReviewSheet'
import './ClientProofingPage.css'

export default function ClientProofingPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const initialPin = searchParams.get('pin') || ''

  const [pinInput, setPinInput] = useState(initialPin)
  const [pin, setPin] = useState(initialPin)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIds, setSelectedIds] = useState([])
  const [history, setHistory] = useState([])
  const [reviewOpen, setReviewOpen] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { session, loading, error, submitSelections } = useClientProofing(slug, pin)

  const handlePinSubmit = (e) => {
    e.preventDefault()
    setPin(pinInput)
  }

  if (!pin) {
    return <ProofingPinGate pinInput={pinInput} setPinInput={setPinInput} onSubmit={handlePinSubmit} />
  }

  if (loading) {
    return (
      <div className="rb-proof-page">
        <Skeleton variant="card" height="400px" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="rb-proof-page">
        <div className="error-state">
          <p>{error || 'Sesi proofing tidak ditemukan.'}</p>
          <Button onClick={() => setPin('')} variant="secondary">Coba Masukkan PIN Lain</Button>
        </div>
      </div>
    )
  }

  const photos = session.photos || []
  const quota = session.selection_quota || session.package?.photo_quota || 20
  const currentPhoto = photos[currentIndex]
  const selectedPhotos = photos.filter((p) => selectedIds.includes(p.id))
  const isFinishedPhotos = currentIndex >= photos.length

  const handleSelect = () => {
    if (!currentPhoto) return
    if (selectedIds.length >= quota) {
      alert(`Kuota pemilihan foto telah mencapai batas maksimal (${quota} foto).`)
      return
    }
    if (!selectedIds.includes(currentPhoto.id)) {
      setSelectedIds([...selectedIds, currentPhoto.id])
    }
    setHistory([...history, { index: currentIndex, action: 'select', id: currentPhoto.id }])
    setCurrentIndex(currentIndex + 1)
  }

  const handleSkip = () => {
    if (!currentPhoto) return
    setHistory([...history, { index: currentIndex, action: 'skip', id: currentPhoto.id }])
    setCurrentIndex(currentIndex + 1)
  }

  const handleUndo = () => {
    if (history.length === 0) return
    const last = history[history.length - 1]
    setHistory(history.slice(0, -1))
    setCurrentIndex(last.index)
    if (last.action === 'select') {
      setSelectedIds(selectedIds.filter((id) => id !== last.id))
    }
  }

  const handleRemovePhotoFromReview = (photoId) => {
    setSelectedIds(selectedIds.filter((id) => id !== photoId))
  }

  const handleSendWhatsAppConfirmation = () => {
    const studioName = session.photographer_name || 'Studio'
    const clientName = session.client_name || session.display_client_name || 'Klien'
    const bookingCode = session.booking_code ? `\n📋 Booking: #${session.booking_code}` : ''
    const packageName = session.package_name || session.package?.name || session.title || session.display_title || 'Sesi Foto'
    const totalSelected = selectedIds.length

    let phone = (session.photographer_whatsapp || '').replace(/\D/g, '')
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1)
    }

    const message = `Halo ${studioName}! ✨\n\nSaya (${clientName}) sudah selesai memilih ${totalSelected} foto untuk sesi proofing:\n📷 Sesi: ${packageName}${bookingCode}\n✨ Total Dipilih: ${totalSelected} Foto\n\nMohon diproses untuk editing selanjutnya ya. Terima kasih! 🙏`

    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`

    window.open(waUrl, '_blank')
  }

  const handleFinish = async () => {
    if (selectedIds.length === 0) {
      alert('Pilih minimal 1 foto sebelum mengirimkan pilihan.')
      return
    }
    setSubmitting(true)
    try {
      await submitSelections(selectedIds)
      setIsCompleted(true)
      setReviewOpen(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengirim pilihan foto.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isCompleted) {
    return (
      <div className="rb-proof-gate">
        <div className="rb-proof-gate__card">
          <div style={{ fontSize: '48px', marginBottom: 'var(--rb-space-2)' }}>🎉</div>
          <h2 className="rb-proof-gate__title">Pilihan Berhasil Dikirim!</h2>
          <p className="rb-proof-gate__sub">
            Sebanyak <strong>{selectedIds.length} foto</strong> pilihan Anda telah tersimpan di sistem. Silakan konfirmasi ke fotografer agar foto Anda langsung masuk ke antrean editing.
          </p>

          <Button
            onClick={handleSendWhatsAppConfirmation}
            fullWidth
            style={{
              background: '#25D366',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              padding: '12px 16px',
              fontSize: '15px',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
            }}
          >
            📲 Konfirmasi ke WhatsApp Fotografer
          </Button>

          <div style={{ marginTop: 'var(--rb-space-3)' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCompleted(false)}
              fullWidth
            >
              ← Lihat Kembali Foto Pilihan
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rb-proof-page">
      <SelectionCounter selectedCount={selectedIds.length} quota={quota} />

      <div className="rb-proof-stage">
        {!isFinishedPhotos && currentPhoto ? (
          <PhotoSwipeCard
            key={currentPhoto.id}
            photo={currentPhoto}
            onSwipeRight={handleSelect}
            onSwipeLeft={handleSkip}
          />
        ) : (
          <div className="rb-proof-done-card">
            <h3>Semua Foto Telah Dilihat</h3>
            <p>Anda telah memilih {selectedIds.length} dari {quota} foto kuota.</p>
            <Button onClick={handleFinish} loading={submitting} fullWidth>
              Kirim Pilihan ({selectedIds.length} Foto)
            </Button>
            <Button
              variant="secondary"
              onClick={() => setReviewOpen(true)}
              fullWidth
              style={{ marginTop: 'var(--rb-space-2)' }}
            >
              Review Daftar Foto Terpilih
            </Button>
          </div>
        )}
      </div>

      {!isFinishedPhotos && (
        <>
          <div className="rb-proof-controls">
            <div className="rb-proof-btn-item">
              <button className="rb-proof-btn rb-proof-btn--skip" onClick={handleSkip} aria-label="Lewati">
                ✕
              </button>
              <span className="rb-proof-btn-label">Lewati</span>
            </div>

            <div className="rb-proof-btn-item">
              <button
                className="rb-proof-btn rb-proof-btn--undo"
                onClick={handleUndo}
                disabled={history.length === 0}
                aria-label="Kembali ke foto sebelumnya"
              >
                ↩
              </button>
              <span className="rb-proof-btn-label">Kembali</span>
            </div>

            <div className="rb-proof-btn-item">
              <button className="rb-proof-btn rb-proof-btn--select" onClick={handleSelect} aria-label="Pilih foto ini">
                ♥
              </button>
              <span className="rb-proof-btn-label">Pilih</span>
            </div>
          </div>

          <div className="rb-proof-actions-bar">
            <Button
              variant={selectedIds.length > 0 ? 'primary' : 'secondary'}
              onClick={() => setReviewOpen(true)}
              fullWidth
            >
              {selectedIds.length > 0
                ? `✓ Lanjutkan & Review (${selectedIds.length}/${quota} Foto)`
                : `Lihat Pilihan (${selectedIds.length} Foto)`}
            </Button>
          </div>
        </>
      )}

      <ProofingReviewSheet
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        selectedPhotos={selectedPhotos}
        onRemovePhoto={handleRemovePhotoFromReview}
        onSubmit={handleFinish}
        submitting={submitting}
        quota={quota}
      />
    </div>
  )
}
