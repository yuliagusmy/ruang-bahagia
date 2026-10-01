import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useClientDelivery } from '../../hooks/useDelivery'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import Input from '../../components/ui/Input'
import './ClientDeliveryPage.css'

export default function ClientDeliveryPage() {
  const { code } = useParams()
  const [searchParams] = useSearchParams()
  const initialPin = searchParams.get('pin') || ''

  const [pinInput, setPinInput] = useState(initialPin)
  const [pin, setPin] = useState(initialPin)
  const [copied, setCopied] = useState(false)

  const { delivery, loading, error, isExpired, refetch } = useClientDelivery(code, pin)

  const handlePinSubmit = (e) => {
    e.preventDefault()
    setPin(pinInput)
  }

  // Jika belum memasukkan PIN
  if (!pin) {
    return (
      <div className="rb-delivery-page">
        <div className="rb-delivery-card" style={{ maxWidth: 440, margin: '40px auto' }}>
          <div className="rb-delivery-header">
            <span className="rb-delivery-badge">Serah Terima Foto Final</span>
            <h2 className="rb-delivery-title">Akses Unduhan Foto</h2>
            <p className="rb-delivery-sub">Masukkan PIN keamanan 6 digit yang diberikan fotografer.</p>
          </div>
          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rb-space-4)' }}>
            <Input
              type="password"
              maxLength={6}
              placeholder="••••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              required
            />
            <Button type="submit" fullWidth disabled={!pinInput}>
              Buka Tautan Unduhan
            </Button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rb-delivery-page">
        <Skeleton variant="card" height="120px" />
        <Skeleton variant="card" height="280px" />
      </div>
    )
  }

  // Tampilan jika link sudah kedaluwarsa (14 hari retensi)
  if (isExpired) {
    const waPhone = delivery?.photographer_whatsapp
      ? delivery.photographer_whatsapp.replace(/\D/g, '')
      : ''
    return (
      <div className="rb-delivery-page">
        <div className="rb-delivery-expired">
          <div className="rb-delivery-expired-icon">⏳</div>
          <h3>Masa Akses Unduhan Berakhir</h3>
          <p>
            Tautan pengunduhan untuk reservasi <strong>#{code}</strong> telah melewati batas waktu penyimpanan aktif
            (14 hari) dan diarsipkan secara otomatis.
          </p>
          {waPhone ? (
            <a
              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Halo! Saya ingin menanyakan arsip foto final untuk reservasi #${code}`)}`}
              target="_blank"
              rel="noreferrer"
              className="rb-delivery-main-btn"
              style={{ display: 'inline-flex', width: 'auto', padding: '0 24px' }}
            >
              Hubungi Fotografer di WhatsApp
            </a>
          ) : (
            <Button variant="secondary" onClick={() => setPin('')}>
              Coba Masukkan PIN Lain
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (error || !delivery) {
    return (
      <div className="rb-delivery-page">
        <div className="rb-delivery-expired">
          <div className="rb-delivery-expired-icon">🔒</div>
          <h3>Tidak Dapat Mengakses Unduhan</h3>
          <p>{error || 'Data serah terima foto belum tersedia untuk nomor reservasi ini.'}</p>
          <Button variant="secondary" onClick={() => setPin('')}>
            Coba Masukkan PIN Lain
          </Button>
        </div>
      </div>
    )
  }

  const handleCopyLink = () => {
    if (!delivery.download_link) return
    navigator.clipboard?.writeText(delivery.download_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const daysLeft = delivery.days_left ?? 14
  const expiryFormatted = delivery.expires_at
    ? new Date(delivery.expires_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '14 hari ke depan'

  const waContact = delivery.photographer_whatsapp
    ? delivery.photographer_whatsapp.replace(/\D/g, '')
    : ''

  return (
    <div className="rb-delivery-page">
      <header className="rb-delivery-header">
        <span className="rb-delivery-badge">✨ Hasil Jadi Foto Final</span>
        <h1 className="rb-delivery-title">Halo, Kak {delivery.client_name || 'Klien'}!</h1>
        <p className="rb-delivery-sub">
          Koleksi foto terbaik dari sesi <strong>{delivery.package_name || 'Dokumentasi'}</strong> bersama{' '}
          <strong>{delivery.photographer_name}</strong> telah selesai diedit dan siap diunduh.
        </p>
      </header>

      {/* Countdown / Retention Notice */}
      <div className="rb-delivery-timer-box">
        <div className="rb-delivery-timer-icon">⏱️</div>
        <div className="rb-delivery-timer-content">
          <h4>Tersisa {daysLeft} Hari untuk Mengunduh</h4>
          <p>
            Tautan cloud aktif hingga <strong>{expiryFormatted}</strong>. Mohon segera unduh dan simpan salinan
            foto Anda ke laptop atau penyimpanan pribadi sebelum diarsipkan.
          </p>
        </div>
      </div>

      {/* Main Download Card */}
      <section className="rb-delivery-card">
        <div className="rb-delivery-meta-grid">
          <div className="rb-delivery-meta-item">
            <label>No. Reservasi</label>
            <strong>#{delivery.booking_code}</strong>
          </div>
          <div className="rb-delivery-meta-item">
            <label>Kualitas Berkas</label>
            <strong>Hi-Res Master (Original)</strong>
          </div>
          <div className="rb-delivery-meta-item">
            <label>Jumlah Foto</label>
            <strong>{delivery.file_count ? `${delivery.file_count} Foto` : 'Lengkap'}</strong>
          </div>
          <div className="rb-delivery-meta-item">
            <label>Status Unduh</label>
            <strong style={{ color: 'var(--rb-success)' }}>Siap Diakses</strong>
          </div>
        </div>

        <div className="rb-delivery-action-block">
          <a
            href={delivery.download_link}
            target="_blank"
            rel="noreferrer"
            className="rb-delivery-main-btn"
          >
            <span>📥</span>
            <span>Buka & Unduh Semua Foto (Cloud)</span>
          </a>

          <Button variant="ghost" size="sm" onClick={handleCopyLink} fullWidth>
            {copied ? '✓ Tautan Cloud Berhasil Disalin!' : '📋 Salin Tautan Cloud Langsung'}
          </Button>
        </div>

        <div className="rb-delivery-tips">
          <h5>💡 Panduan Mengunduh:</h5>
          <ol>
            <li>Gunakan koneksi Wi-Fi yang stabil karena file berukuran besar dengan resolusi asli.</li>
            <li>Sangat disarankan membuka tautan melalui Laptop / PC agar lebih leluasa mengunduh format ZIP.</li>
            <li>Segera lakukan backup foto ke drive eksternal atau cloud penyimpanan pribadi Anda.</li>
          </ol>
        </div>
      </section>

      {/* Contact Photographer */}
      {waContact && (
        <div className="rb-delivery-contact">
          <p>Butuh bantuan atau mengalami kendala saat mengunduh?</p>
          <a
            href={`https://wa.me/${waContact}?text=${encodeURIComponent(`Halo ${delivery.photographer_name}, saya ingin menanyakan perihal unduhan foto untuk reservasi #${delivery.booking_code}`)}`}
            target="_blank"
            rel="noreferrer"
            className="rb-delivery-wa-link"
          >
            💬 Hubungi {delivery.photographer_name} di WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}
