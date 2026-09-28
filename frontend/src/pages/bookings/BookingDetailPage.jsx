import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBookingDetail } from '../../hooks/useBookings'
import { useAuthStore } from '../../stores/authStore'
import bookingService from '../../services/booking.service'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import BottomSheet from '../../components/ui/BottomSheet'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import './BookingDetailPage.css'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Inquiry (Menunggu Konfirmasi)' },
  { value: 'confirmed', label: 'Dikonfirmasi (Menunggu DP)' },
  { value: 'dp_paid', label: 'DP Lunas (Jadwal Terkunci)' },
  { value: 'in_progress', label: 'Hari H (Shooting)' },
  { value: 'editing', label: 'Proses Editing' },
  { value: 'proofing', label: 'Proofing Siap Dipilih' },
  { value: 'completed', label: 'Selesai & Terkirim' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

export default function BookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { booking, loading, error, refetch } = useBookingDetail(id)

  const [statusSheetOpen, setStatusSheetOpen] = useState(false)
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // WhatsApp Smart Template States
  const [waSheetOpen, setWaSheetOpen] = useState(false)
  const [waTitle, setWaTitle] = useState('')
  const [waMessage, setWaMessage] = useState('')
  const [waCopied, setWaCopied] = useState(false)

  const [paymentForm, setPaymentForm] = useState({
    type: 'dp',
    amount: '',
    payment_method: 'transfer',
    notes: '',
  })

  if (loading) {
    return (
      <div className="page rb-booking-detail">
        <Skeleton variant="block" height="200px" />
        <Skeleton variant="block" height="150px" style={{ marginTop: '16px' }} />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="page rb-booking-detail">
        <div className="error-state">
          <p>{error || 'Booking tidak ditemukan.'}</p>
          <Button onClick={() => navigate('/bookings')} variant="secondary">Kembali ke Daftar</Button>
        </div>
      </div>
    )
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await bookingService.updateStatus(id, selectedStatus)
      setStatusSheetOpen(false)
      refetch()
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddPayment = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await bookingService.addPayment(id, paymentForm)
      setPaymentSheetOpen(false)
      setPaymentForm({ type: 'final', amount: '', payment_method: 'transfer', notes: '' })
      refetch()
    } finally {
      setSubmitting(false)
    }
  }

  const dateFormatted = new Date(booking.event_date).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)

  const generateWaMessage = (type) => {
    const clientName = booking.client?.name || 'Klien'
    const brandName = user?.brand_name || 'Ruang Bahagia Photography'
    const bookingCode = booking.booking_code || ''
    const packageName = booking.package?.name || 'Dokumentasi Foto'
    const eventDate = dateFormatted
    const eventTime = booking.event_time ? `${booking.event_time} WIB` : 'Sesuai Jadwal'
    const location = booking.event_location || booking.location || 'Studio'
    const totalPrice = formatRp(booking.total_price)
    const dpAmount = formatRp(booking.dp_amount)
    const remainingAmount = formatRp(booking.remaining_amount || (booking.total_price - booking.dp_amount))
    const proofingSlug = booking.proofing_session?.slug || booking.proofingSession?.slug || id
    const proofingPin = booking.proofing_session?.pin || booking.proofingSession?.pin || '1234'
    const proofingUrl = `${window.location.origin}/proof/${proofingSlug}`
    const quota = booking.package?.photo_quota || 20

    if (type === 'booking_confirmation') {
      setWaTitle('Konfirmasi Booking & Instruksi DP')
      setWaMessage(
`Halo Kak ${clientName} ✨

Terima kasih telah melakukan reservasi sesi foto di ${brandName}!
Berikut adalah rincian jadwal pemesanan Anda:

🔖 Kode Booking: #${bookingCode}
📦 Paket: ${packageName}
📅 Tanggal: ${eventDate}
⏰ Waktu: ${eventTime}
📍 Lokasi: ${location}
💰 Total Biaya: ${totalPrice}
💳 Uang Muka (DP): ${dpAmount}

Silakan transfer DP ke rekening / QRIS resmi kami untuk mengunci slot jadwal Anda.
Mohon konfirmasikan bukti transfer ke WhatsApp ini ya Kak. Terima kasih! 🙏`
      )
    } else if (type === 'session_reminder') {
      setWaTitle('Pengingat Jadwal Pemotretan (H-1)')
      setWaMessage(
`Halo Kak ${clientName} 📸

Pengingat sesi foto bersama ${brandName}!
Kami ingin mengingatkan jadwal pemotretan Anda besok:

📅 Tanggal: ${eventDate}
⏰ Waktu: ${eventTime}
📍 Lokasi: ${location}
📦 Paket: ${packageName}

Tips persiapan sesi:
1. Disarankan hadir 15 menit lebih awal untuk persiapan outfit / makeup.
2. Jangan lupa istirahat yang cukup malam ini agar besok tetap segar dan ceria!

Sampai jumpa besok di lokasi pemotretan Kak! ✨`
      )
    } else if (type === 'proofing_link') {
      setWaTitle('Kirim Tautan Client Proofing')
      setWaMessage(
`Halo Kak ${clientName} ✨

Sesi pemotretan Anda sudah selesai dan foto-foto telah siap untuk dipilih!
Kakak bisa langsung memilih foto favorit dari smartphone dengan pengalaman swipe yang praktis melalui tautan berikut:

🔗 Link Proofing: ${proofingUrl}
🔑 PIN Akses: ${proofingPin}
📷 Kuota Pilihan: ${quota} foto

Silakan geser kanan untuk foto yang disukai. Setelah selesai, fotografer kami akan langsung memproses edit foto pilihan Kakak. Selamat memilih! 🎉`
      )
    } else if (type === 'final_payment') {
      setWaTitle('Pengingat Pelunasan Tagihan Sisa')
      setWaMessage(
`Halo Kak ${clientName} 🌸

Koleksi foto hasil edit dari sesi ${packageName} Anda sedang dalam tahap finalisasi!
Berikut rekap status pembayaran:

💰 Total Biaya: ${totalPrice}
💳 Sisa Pelunasan: ${remainingAmount}

Mohon menyelesaikan sisa pelunasan agar file hi-res dan album foto dapat segera diserahterimakan. Terima kasih banyak atas kepercayaannya bersama ${brandName}! 🙏`
      )
    }
    setWaSheetOpen(true)
  }

  return (
    <div className="page rb-booking-detail">
      <div className="rb-booking-detail__header">
        <button className="rb-booking-detail__back" onClick={() => navigate(-1)} aria-label="Kembali">
          ← Kembali
        </button>
        <span className="rb-booking-detail__code">#{booking.booking_code}</span>
        <Badge status={booking.status} />
      </div>

      <section className="rb-detail-card">
        <div className="rb-detail-card__header">
          <h2 className="rb-detail-card__title">{booking.client?.name}</h2>
          {booking.client?.phone && (
            <a
              href={`https://wa.me/${booking.client.phone.replace(/^0/, '62').replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="rb-booking-detail__wa-btn"
            >
              WhatsApp
            </a>
          )}
        </div>
        <p className="rb-detail-card__sub">{booking.client?.email || 'Email tidak tercantum'}</p>
      </section>

      <section className="rb-detail-card">
        <h3 className="rb-detail-card__section-title">Detail Sesi</h3>
        <div className="rb-detail-card__grid">
          <div><label>Paket</label><p>{booking.package?.name}</p></div>
          <div><label>Tanggal</label><p>{dateFormatted}</p></div>
          <div><label>Lokasi</label><p>{booking.location || 'Studio'}</p></div>
          <div><label>Total Biaya</label><p className="rb-detail-card__highlight">{formatRp(booking.total_price)}</p></div>
        </div>
        {booking.notes && (
          <div className="rb-detail-card__notes">
            <label>Catatan:</label>
            <p>{booking.notes}</p>
          </div>
        )}
      </section>

      <section className="rb-detail-card">
        <div className="rb-detail-card__header">
          <h3 className="rb-detail-card__section-title">Pembayaran</h3>
          <button className="rb-detail-card__link-action" onClick={() => setPaymentSheetOpen(true)}>
            + Catat Bayar
          </button>
        </div>
        <div className="rb-detail-card__payment-summary">
          <div><span>DP:</span> <strong>{formatRp(booking.dp_amount)}</strong></div>
          <div><span>Status DP:</span> <strong>{booking.dp_paid_at ? 'Sudah Dibayar' : 'Belum Dibayar'}</strong></div>
        </div>
      </section>

      {/* ── WhatsApp Communication & Templates Card ──── */}
      <section className="rb-detail-card">
        <div className="rb-detail-card__header">
          <div>
            <h3 className="rb-detail-card__section-title">💬 Komunikasi WhatsApp Klien</h3>
            <p className="rb-detail-card__hint">
              Kirim template pesan otomatis dengan data yang terisi instan ke {booking.client?.phone || 'klien'}
            </p>
          </div>
        </div>

        <div className="rb-wa-templates-grid">
          <button
            type="button"
            className="rb-wa-btn"
            onClick={() => generateWaMessage('booking_confirmation')}
          >
            <span className="rb-wa-btn__icon">💬</span>
            <div className="rb-wa-btn__text">
              <strong>Konfirmasi Booking & DP</strong>
              <span>Kirim rincian invoice & instruksi DP</span>
            </div>
            <span className="rb-wa-btn__arrow">›</span>
          </button>

          <button
            type="button"
            className="rb-wa-btn"
            onClick={() => generateWaMessage('session_reminder')}
          >
            <span className="rb-wa-btn__icon">⏰</span>
            <div className="rb-wa-btn__text">
              <strong>Pengingat Jadwal (H-1)</strong>
              <span>Briefing waktu tiba, lokasi & outfit</span>
            </div>
            <span className="rb-wa-btn__arrow">›</span>
          </button>

          <button
            type="button"
            className="rb-wa-btn"
            onClick={() => generateWaMessage('proofing_link')}
          >
            <span className="rb-wa-btn__icon">✨</span>
            <div className="rb-wa-btn__text">
              <strong>Kirim Link Proofing Swipe</strong>
              <span>Tautan seleksi foto & PIN akses</span>
            </div>
            <span className="rb-wa-btn__arrow">›</span>
          </button>

          <button
            type="button"
            className="rb-wa-btn"
            onClick={() => generateWaMessage('final_payment')}
          >
            <span className="rb-wa-btn__icon">💳</span>
            <div className="rb-wa-btn__text">
              <strong>Pengingat Pelunasan Tagihan</strong>
              <span>Rincian sisa sebelum foto final</span>
            </div>
            <span className="rb-wa-btn__arrow">›</span>
          </button>
        </div>
      </section>

      <div className="rb-booking-detail__actions">
        <Button
          fullWidth
          variant="secondary"
          onClick={() => { setSelectedStatus(booking.status); setStatusSheetOpen(true) }}
        >
          Ubah Status Sesi
        </Button>
      </div>

      {/* Sheet Ubah Status */}
      <BottomSheet isOpen={statusSheetOpen} onClose={() => setStatusSheetOpen(false)} title="Perbarui Status Sesi">
        <form onSubmit={handleUpdateStatus}>
          <div className="rb-field">
            <label className="rb-field__label">Pilih Status Baru</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rb-field__control"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <Button type="submit" fullWidth loading={submitting}>Perbarui Status</Button>
        </form>
      </BottomSheet>

      {/* Sheet Catat Pembayaran */}
      <BottomSheet isOpen={paymentSheetOpen} onClose={() => setPaymentSheetOpen(false)} title="Catat Pembayaran">
        <form onSubmit={handleAddPayment}>
          <div className="rb-field">
            <label className="rb-field__label">Tipe Pembayaran</label>
            <select
              value={paymentForm.type}
              onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
              className="rb-field__control"
            >
              <option value="dp">Uang Muka (DP)</option>
              <option value="final">Pelunasan</option>
            </select>
          </div>
          <Input
            label="Nominal (Rp)"
            type="number"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            placeholder="Contoh: 500000"
            required
          />
          <Button type="submit" fullWidth loading={submitting}>Simpan Pembayaran</Button>
        </form>
      </BottomSheet>

      {/* Sheet Pratinjau & Kirim WhatsApp */}
      <BottomSheet
        isOpen={waSheetOpen}
        onClose={() => setWaSheetOpen(false)}
        title={waTitle}
        className="rb-sheet--wide"
      >
        <div className="rb-wa-modal">
          <div className="rb-wa-modal__header">
            <span className="rb-wa-modal__target">
              Tujuan: <strong>{booking.client?.name}</strong> ({booking.client?.phone || 'Nomor tidak ada'})
            </span>
          </div>

          <div className="rb-field">
            <label className="rb-field__label">Pratinjau & Edit Teks Pesan:</label>
            <textarea
              className="rb-field__control rb-wa-textarea"
              rows={9}
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
            />
          </div>

          <div className="rb-wa-modal__actions">
            <a
              href={`https://wa.me/${(booking.client?.phone || '').replace(/^0/, '62').replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="rb-btn rb-btn--primary rb-btn--full rb-btn--wa"
              onClick={() => setWaSheetOpen(false)}
            >
              <span>Kirim via WhatsApp (wa.me) ↗</span>
            </a>

            <button
              type="button"
              className="rb-btn rb-btn--secondary rb-btn--full"
              onClick={() => {
                navigator.clipboard?.writeText(waMessage)
                setWaCopied(true)
                setTimeout(() => setWaCopied(false), 2000)
              }}
            >
              {waCopied ? '✓ Teks Berhasil Disalin!' : 'Salin Teks Pesan'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
