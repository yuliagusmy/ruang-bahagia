import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { usePhotographerProofing } from '../../hooks/useProofing'
import { useDrive } from '../../hooks/useDrive'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import BottomSheet from '../../components/ui/BottomSheet'
import { useAuthStore } from '../../stores/authStore'
import ProofingDriveModal from './components/ProofingDriveModal'
import ProofingExportSection from './components/ProofingExportSection'
import './ProofingPage.css'

const SAMPLE_PHOTO_PRESETS = [
  { original_filename: '_DSC4821_wedding.jpg', lowres_path: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop' },
  { original_filename: '_DSC4829_ceremony.jpg', lowres_path: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop' },
  { original_filename: '_DSC4835_rings.jpg', lowres_path: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop' },
  { original_filename: '_DSC4840_reception.jpg', lowres_path: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&auto=format&fit=crop' },
  { original_filename: '_DSC4852_portrait.jpg', lowres_path: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&auto=format&fit=crop' },
  { original_filename: '_DSC4860_outdoor.jpg', lowres_path: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop' },
]

export default function ProofingPage() {
  const { id: bookingId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const { session, loading, error, createSession, addPhotos, importFromDrive, deletePhoto, refetch } =
    usePhotographerProofing(bookingId)

  const { status: driveStatus, loading: driveLoading, actionLoading: driveActionLoading, connect: connectDrive, refetch: refetchDrive } =
    useDrive()

  // Creation State
  const [initLoading, setInitLoading] = useState(false)
  const [customQuota, setCustomQuota] = useState('')
  const [customPin, setCustomPin] = useState('')

  // Modals & Feedback
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [driveModalOpen, setDriveModalOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoFilename, setPhotoFilename] = useState('')
  const [uploading, setUploading] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [driveAlert, setDriveAlert] = useState(null) // { type: 'success' | 'error', message: string }

  // Handle redirect callback dari Google OAuth ke sesi proofing ini
  useEffect(() => {
    const gdriveParam = searchParams.get('gdrive')
    if (gdriveParam === 'success') {
      setDriveAlert({
        type: 'success',
        message: '✓ Akun Google Drive berhasil dihubungkan! Anda dapat langsung memilih folder foto galeri.',
      })
      refetchDrive()
      setDriveModalOpen(true)
      setSearchParams({}, { replace: true })
    } else if (gdriveParam === 'error') {
      setDriveAlert({
        type: 'error',
        message: '⚠️ Gagal menghubungkan Google Drive. Silakan coba kembali.',
      })
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  // Auth – harus di sini, bukan setelah early return!
  const user = useAuthStore((s) => s.user)

  const handleCreateSession = async (e) => {
    e?.preventDefault()
    setInitLoading(true)
    try {
      await createSession({
        selection_quota: customQuota ? parseInt(customQuota, 10) : undefined,
        pin: customPin || undefined,
      })
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat sesi proofing.')
    } finally {
      setInitLoading(false)
    }
  }

  const handleAddSinglePhoto = async (e) => {
    e.preventDefault()
    if (!photoUrl) return
    setUploading(true)
    try {
      const filename = photoFilename.trim() || `photo_${Date.now()}.jpg`
      await addPhotos([{ original_filename: filename, display_filename: filename, lowres_path: photoUrl.trim() }])
      setPhotoUrl('')
      setPhotoFilename('')
      setAddSheetOpen(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambahkan foto.')
    } finally {
      setUploading(false)
    }
  }

  const handleLoadSamplePhotos = async () => {
    if (!window.confirm('Muat 6 foto sampel pernikahan untuk demonstrasi sesi ini?')) return
    setUploading(true)
    try {
      await addPhotos(SAMPLE_PHOTO_PRESETS)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memuat foto sampel.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId, filename) => {
    if (!window.confirm(`Hapus foto ${filename} dari sesi proofing ini?`)) return
    try {
      await deletePhoto(photoId)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus foto.')
    }
  }

  const handleBack = () => {
    if (session?.booking_id) {
      navigate(`/bookings/${session.booking_id}`)
    } else if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/proofing')
    }
  }

  if (loading) {
    return (
      <div className="page rb-proofing-admin">
        <Skeleton variant="card" height="180px" />
        <Skeleton variant="card" height="240px" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page rb-proofing-admin">
        <div className="error-state">
          <p>{error}</p>
          <Button onClick={refetch} variant="secondary">Coba Muat Ulang</Button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="page rb-proofing-admin">
        <div className="rb-proofing-admin__top">
          <button className="rb-proofing-admin__back" onClick={handleBack}>
            ← Kembali
          </button>
        </div>

        <section className="rb-detail-card rb-proofing-init-card">
          <div className="rb-proofing-init-icon">✨</div>
          <h2 className="rb-detail-card__title">Buat Sesi Client Proofing</h2>
          <p className="rb-detail-card__sub">
            {bookingId
              ? `Aktifkan portal swipe pemilihan foto untuk klien pada reservasi booking #${bookingId}.`
              : 'Aktifkan portal swipe pemilihan foto untuk klien.'}
          </p>

          <form onSubmit={handleCreateSession} className="rb-proofing-init-form">
            <div className="rb-field">
              <label className="rb-field__label">Kuota Foto Pilihan Klien</label>
              <input
                type="number"
                min="1"
                placeholder="Contoh: 20 (mengikuti paket)"
                value={customQuota}
                onChange={(e) => setCustomQuota(e.target.value)}
                className="rb-field__control"
              />
            </div>
            <div className="rb-field">
              <label className="rb-field__label">PIN Keamanan Klien (6 Digit)</label>
              <input
                type="text"
                maxLength={6}
                placeholder="Kosongkan untuk PIN acak"
                value={customPin}
                onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, ''))}
                className="rb-field__control"
              />
            </div>
            <Button type="submit" loading={initLoading} fullWidth>
              + Inisialisasi Sesi Proofing
            </Button>
          </form>
        </section>
      </div>
    )
  }

  const selectedPhotos = session.photos?.filter((p) => p.status === 'selected') || []
  const allPhotos = session.photos || []
  const shareUrl = `${window.location.origin}/proof/${session.slug}`

  const copyClientLink = () => {
    navigator.clipboard?.writeText(`${shareUrl} (PIN: ${session.pin})`)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2200)
  }

  const handleSendWhatsApp = () => {
    const clientName = session.display_client_name || session.client_name || 'Kak'
    const quota = session.selection_quota || 20
    const studioName = user?.brand_name || user?.name || 'Studio'
    
    let phone = (session.client_phone || '').replace(/\D/g, '')
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1)
    }

    const message = `Halo ${clientName}! ✨\n\nFoto sesi kamu sudah siap dipilih! Silakan buka tautan galeri swipe di bawah ini dari smartphone kamu ya:\n\n🔗 ${shareUrl}?pin=${session.pin}\n🔑 PIN Akses: ${session.pin}\n📷 Kuota Pilihan: ${quota} Foto\n\nKamu bisa swipe ke kanan foto yang kamu suka. Setelah selesai memilih, jangan lupa klik "Kirim Pilihan Foto".\n\nTerima kasih,\n${studioName}`

    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`

    window.open(waUrl, '_blank')
  }

  return (
    <div className="page rb-proofing-admin">
      <div className="rb-proofing-admin__top">
        <button className="rb-proofing-admin__back" onClick={handleBack}>
          {session.booking_id ? '← Detail Booking' : '← Daftar Sesi Proofing'}
        </button>
        <Badge status={session.status || 'active'} />
      </div>

      {/* ── Feedback Alert Integrasi Google Drive ─────── */}
      {driveAlert && (
        <div
          className={`rb-settings-alert ${
            driveAlert.type === 'success' ? 'rb-settings-alert--success' : 'rb-settings-alert--error'
          }`}
          role="status"
          style={{ marginBottom: 'var(--rb-space-2)' }}
        >
          <span>{driveAlert.message}</span>
          <button
            type="button"
            onClick={() => setDriveAlert(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Link Akses & PIN Klien ─────────────────────── */}
      <section className="rb-detail-card">
        <div className="rb-detail-card__header">
          <div>
            <h2 className="rb-detail-card__title">
              {session.display_title || session.title || session.client_name || (session.booking_id ? `Booking #${session.booking_id}` : 'Sesi Proofing')}
            </h2>
            <p className="rb-detail-card__sub">
              {session.package?.name || (session.booking_id ? 'Paket Foto' : 'Tools Proofing Mandiri')}
              {' • '}
              Klien: {session.display_client_name || session.client_name || 'Umum'}
              {' • '}
              Kuota {session.selection_quota} Foto
              {session.gdrive_folder_url && (
                <>
                  {' • '}
                  <a
                    href={session.gdrive_folder_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--rb-primary)', textDecoration: 'underline' }}
                  >
                    Buka Google Drive ↗
                  </a>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="rb-proofing-admin__stats-grid">
          <div className="rb-proofing-stat-box">
            <span>Foto Dipilih</span>
            <strong>{session.selected_count || selectedPhotos.length} / {session.selection_quota}</strong>
          </div>
          <div className="rb-proofing-stat-box">
            <span>Total Foto</span>
            <strong>{allPhotos.length}</strong>
          </div>
          <div className="rb-proofing-stat-box">
            <span>PIN Keamanan</span>
            <strong className="rb-proofing-pin-code">{session.pin}</strong>
          </div>
        </div>

        <div className="rb-proofing-admin__link-card">
          <label>Tautan Khusus Klien (Mobile Swipe):</label>
          <div className="rb-proofing-admin__url-box">
            <input type="text" readOnly value={`${shareUrl}?pin=${session.pin}`} />
            <button type="button" onClick={copyClientLink}>
              {copiedLink ? '✓ Tersalin' : 'Salin Link'}
            </button>
          </div>
          <div className="rb-proofing-admin__link-actions">
            <span className="rb-proofing-admin__pin">PIN Akses: <strong>{session.pin}</strong></span>
            <a href={`${shareUrl}?pin=${session.pin}`} target="_blank" rel="noreferrer" className="rb-proofing-preview-link">
              Buka Tampilan Klien ↗
            </a>
          </div>

          <div style={{ marginTop: 'var(--rb-space-3)' }}>
            <Button
              size="sm"
              onClick={handleSendWhatsApp}
              fullWidth
              style={{
                background: '#25D366',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
              }}
            >
              📲 Kirim Link & PIN ke WhatsApp Klien
            </Button>
          </div>
        </div>
      </section>

      {/* ── Foto Dipilih Klien (Lightroom Export) ─────── */}
      <ProofingExportSection
        selectedPhotos={selectedPhotos}
        session={session}
        bookingId={bookingId}
      />

      {/* ── Kelola Foto dalam Sesi ─────────────────────── */}
      <section className="rb-detail-card">
        <div className="rb-detail-card__header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--rb-space-2)', flexWrap: 'wrap' }}>
              <h3 className="rb-detail-card__section-title">
                Semua Foto dalam Sesi ({allPhotos.length})
              </h3>
              {driveStatus?.connected ? (
                <span className="rb-drive-status-badge rb-drive-status-badge--connected" title={`Terhubung: ${driveStatus.gdrive_email}`}>
                  <span className="rb-drive-dot--on" /> Drive Aktif
                </span>
              ) : (
                <span className="rb-drive-status-badge rb-drive-status-badge--offline">
                  <span className="rb-drive-dot--off" /> Drive Belum Terhubung
                </span>
              )}
            </div>
            <p className="rb-detail-card__hint">
              Foto-foto ini akan ditampilkan kepada klien untuk dipilih dengan gestur swipe.
            </p>
          </div>
          <div className="rb-proofing-upload-actions">
            <Button size="sm" variant="primary" onClick={() => setDriveModalOpen(true)}>
              📁 Import Google Drive
            </Button>
            {!driveStatus?.connected && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => connectDrive(window.location.pathname)}
                loading={driveActionLoading}
                title="Hubungkan akun Google Drive studio untuk sesi proofing"
              >
                🔗 Hubungkan Drive
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setAddSheetOpen(true)}>
              + URL Manual
            </Button>
            {allPhotos.length === 0 && (
              <Button size="sm" variant="ghost" onClick={handleLoadSamplePhotos} loading={uploading}>
                ⚡ Sampel Foto
              </Button>
            )}
          </div>
        </div>

        {allPhotos.length === 0 ? (
          <div className="rb-proofing-admin__empty">
            <div className="rb-proofing-empty-icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M7.71 3.5L1.15 15L4.58 21L11.13 9.5L7.71 3.5Z" fill="#0FA958" />
                <path d="M16.29 3.5L22.85 15H15.97L9.42 3.5H16.29Z" fill="#4285F4" />
                <path d="M4.58 21L7.97 15H22.85L19.42 21H4.58Z" fill="#FBBC04" />
              </svg>
            </div>
            <h4 style={{ margin: 0, fontSize: 'var(--rb-text-base)', color: 'var(--rb-text-primary)' }}>
              Belum ada foto dalam sesi ini
            </h4>
            <p style={{ margin: 0, fontSize: 'var(--rb-text-sm)', color: 'var(--rb-text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
              {!driveStatus?.connected
                ? 'Hubungkan Google Drive Anda untuk langsung menarik puluhan hingga ratusan foto hasil sesi dalam hitungan detik.'
                : 'Pilih folder foto dari Google Drive Anda atau masukkan tautan preview foto.'}
            </p>
            <div className="rb-proofing-empty-actions">
              <Button
                variant="primary"
                onClick={() => setDriveModalOpen(true)}
                style={{ minHeight: '44px' }}
              >
                {!driveStatus?.connected ? '🔗 Hubungkan & Import Google Drive' : '📁 Pilih Folder dari Google Drive'}
              </Button>
              <Button variant="secondary" onClick={() => setAddSheetOpen(true)} style={{ minHeight: '44px' }}>
                + Tambah URL Manual
              </Button>
              <Button variant="ghost" onClick={handleLoadSamplePhotos} loading={uploading} style={{ minHeight: '44px' }}>
                ⚡ Muat 6 Foto Sampel
              </Button>
            </div>
          </div>
        ) : (
          <div className="rb-proofing-admin__all-grid">
            {allPhotos.map((p) => (
              <div key={p.id} className="rb-proofing-thumb">
                <img src={p.watermarked_url} alt={p.original_filename} loading="lazy" />
                <button
                  type="button"
                  className="rb-proofing-thumb__delete"
                  onClick={() => handleDeletePhoto(p.id, p.original_filename)}
                  title="Hapus foto dari sesi"
                >
                  ✕
                </button>
                <span className="rb-proofing-thumb__name">{p.original_filename}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Google Drive Import Modal */}
      <ProofingDriveModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        onImport={importFromDrive}
        currentPath={window.location.pathname}
      />

      {/* Sheet Tambah Foto Manual */}
      <BottomSheet
        isOpen={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        title="Tambah Foto Manual"
      >
        <form onSubmit={handleAddSinglePhoto} className="rb-proofing-add-form">
          <div className="rb-field">
            <label className="rb-field__label">URL Gambar Preview <span className="rb-form-req">*</span></label>
            <input
              type="url"
              placeholder="https://..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="rb-field__control"
              required
            />
          </div>
          <div className="rb-field">
            <label className="rb-field__label">Nama File Asli</label>
            <input
              type="text"
              placeholder="_DSC1234.JPG"
              value={photoFilename}
              onChange={(e) => setPhotoFilename(e.target.value)}
              className="rb-field__control"
            />
          </div>
          <Button type="submit" loading={uploading} fullWidth>
            Simpan Foto ke Sesi
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
