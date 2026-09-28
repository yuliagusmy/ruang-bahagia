import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useClientProofing } from '../../hooks/useProofing'
import PhotoSwipeCard from '../../components/proofing/PhotoSwipeCard'
import SelectionCounter from '../../components/proofing/SelectionCounter'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import './ClientProofingPage.css'

export default function ClientProofingPage() {
  const { slug } = useParams()
  const [pinInput, setPinInput] = useState('')
  const [pin, setPin] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIds, setSelectedIds] = useState([])
  const [history, setHistory] = useState([]) // for undo
  const [isCompleted, setIsCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { session, loading, error, submitSelections } = useClientProofing(slug, pin)

  const handlePinSubmit = (e) => {
    e.preventDefault()
    setPin(pinInput)
  }

  if (!pin) {
    return (
      <div className="rb-proof-gate">
        <div className="rb-proof-gate__card">
          <span className="rb-proof-gate__badge">Sesi Proofing</span>
          <h2 className="rb-proof-gate__title">Pilih Foto Favorit Anda</h2>
          <p className="rb-proof-gate__sub">Masukkan PIN keamanan 4-digit yang diberikan fotografer.</p>
          <form onSubmit={handlePinSubmit}>
            <Input
              type="password"
              maxLength={6}
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="rb-proof-gate__input"
              required
            />
            <Button type="submit" fullWidth disabled={!pinInput}>Buka Foto</Button>
          </form>
        </div>
      </div>
    )
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
  const quota = session.package?.photo_quota || 20
  const currentPhoto = photos[currentIndex]

  const handleSelect = () => {
    if (!currentPhoto) return
    if (selectedIds.length >= quota) {
      alert(`Kuota pemilihan foto telah mencapai batas maksimal (${quota} foto).`)
      return
    }
    setSelectedIds([...selectedIds, currentPhoto.id])
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

  const handleFinish = async () => {
    setSubmitting(true)
    try {
      await submitSelections(selectedIds)
      setIsCompleted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (isCompleted) {
    return (
      <div className="rb-proof-gate">
        <div className="rb-proof-gate__card">
          <h2 className="rb-proof-gate__title">Pilihan Terkirim!</h2>
          <p className="rb-proof-gate__sub">
            Terima kasih! Sebanyak {selectedIds.length} foto pilihan Anda telah diteruskan ke fotografer untuk proses editing akhir.
          </p>
        </div>
      </div>
    )
  }

  const isFinishedPhotos = currentIndex >= photos.length

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
          </div>
        )}
      </div>

      {!isFinishedPhotos && (
        <div className="rb-proof-controls">
          <button className="rb-proof-btn rb-proof-btn--skip" onClick={handleSkip} aria-label="Lewati">
            ✕
          </button>
          <button
            className="rb-proof-btn rb-proof-btn--undo"
            onClick={handleUndo}
            disabled={history.length === 0}
            aria-label="Kembalikan foto sebelumnya"
          >
            ↩
          </button>
          <button className="rb-proof-btn rb-proof-btn--select" onClick={handleSelect} aria-label="Pilih foto ini">
            ♥
          </button>
        </div>
      )}
    </div>
  )
}
