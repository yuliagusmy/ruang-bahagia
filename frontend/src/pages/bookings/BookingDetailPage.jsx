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
import InvoiceReceiptModal from '../../components/booking/InvoiceReceiptModal'
import { useBookingDelivery } from '../../hooks/useDelivery'
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

  // Delivery & Invoice States
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [deliverySheetOpen, setDeliverySheetOpen] = useState(false)
  const { delivery, saveDelivery: saveDeliveryData, refetch: refetchDelivery } = useBookingDelivery(id)
  const [deliveryForm, setDeliveryForm] = useState({
    download_link: '',
    download_pin: '',
    file_count: '',
    expires_in_days: 14,
    mark_completed: true,
  })

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

  const handleOpenDeliverySheet = () => {
    if (delivery) {
      setDeliveryForm({
        download_link: delivery.download_link || '',
        download_pin: delivery.download_pin || '',
        file_count: delivery.file_count || '',
        expires_in_days: 14,
        mark_completed: true,
      })
    }
    setDeliverySheetOpen(true)
  }

  const handleSaveDelivery = async (e) => {
    e.preventDefault()
    if (!deliveryForm.download_link) return
    setSubmitting(true)
    try {
      await saveDeliveryData(deliveryForm)
      setDeliverySheetOpen(false)
      refetch()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan tautan unduh foto final.')
    } finally {
      setSubmitting(false)
    }
  }

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
    const brandName = user?.brand_name || user?.name || 'Ruang Bahagia Photography'
    const bookingCode = booking.booking_code || ''
    const packageName = booking.package?.name || 'Dokumentasi Foto'
    const eventDate = dateFormatted
    const eventTime = booking.event_time ? `${booking.event_time} WIB` : 'Sesuai Jadwal'
    const location = booking.event_location || booking.location || 'Studio'
    const mapsLink = location ? `https://maps.google.com/?q=${encodeURIComponent(location)}` : ''
    const totalPrice = formatRp(booking.total_price)
    const dpAmount = formatRp(booking.dp_amount)
    const remainingAmount = formatRp(booking.remaining_amount || (booking.total_price - booking.dp_amount))
    const invoiceUrl = `${window.location.origin}/invoice/${bookingCode}`
    const proofingSlug = booking.proofing_session?.slug || booking.proofingSession?.slug || id
    const proofingPin = booking.proofing_session?.pin || booking.proofingSession?.pin || '1234'
    const proofingUrl = `${window.location.origin}/proof/${proofingSlug}`
    const quota = booking.package?.photo_quota || 20

    const notifSettings = user?.notification_settings || {}
    const bankName = notifSettings.bank_name || 'BCA'
    const bankAcc = notifSettings.bank_account_number || ''
    const bankHolder = notifSettings.bank_account_holder || user?.name || brandName
    const h1CustomNotes = notifSettings.h1_reminder_notes || ''
    const paymentCustomNotes = notifSettings.payment_reminder_notes || ''

    const bankTransferText = bankAcc
      ? `\n🏦 Rekening Pembayaran:\n• Bank: ${bankName}\n• No. Rekening: ${bankAcc}\n• A.N: ${bankHolder}\n`
      : ''

    if (type === 'booking_confirmation') {
      setWaTitle('Konfirmasi Booking & Instruksi DP')
      setWaMessage(
`Halo Kak ${clientName} ✨

Terima kasih telah melakukan reservasi sesi foto bersama ${brandName}!
Berikut adalah rincian jadwal pemesanan Anda:

🔖 Kode Booking: #${bookingCode}
📦 Paket: ${packageName}
📅 Tanggal: ${eventDate}
⏰ Waktu: ${eventTime}
📍 Lokasi: ${location}${mapsLink ? `\n🗺️ Peta Lokasi: ${mapsLink}` : ''}
💰 Total Biaya: ${totalPrice}
💳 Uang Muka (DP): ${dpAmount}
${bankTransferText}
📄 Tautan Invoice Digital & Rincian Paket:
${invoiceUrl}

Silakan transfer DP untuk mengunci slot jadwal Anda dan konfirmasikan bukti transfer ke WhatsApp ini ya Kak. Terima kasih! 🙏`
      )
    } else if (type === 'session_reminder') {
      setWaTitle('Pengingat Jadwal Pemotretan (H-1)')
      setWaMessage(
`Halo Kak ${clientName} 📸

Pengingat sesi foto besok bersama ${brandName}!
Kami ingin mengonfirmasi jadwal pemotretan Anda:

📅 Tanggal: ${eventDate}
⏰ Waktu: ${eventTime} (Harap hadir 15 menit lebih awal)
📍 Lokasi: ${location}${mapsLink ? `\n🗺️ Peta Lokasi: ${mapsLink}` : ''}
📦 Paket: ${packageName}

💡 Tips Persiapan & Outfit:
1. Pastikan pakaian / kostum sudah siap rapi & bawa alternatif outfit bila diperlukan.
2. Istirahat yang cukup malam ini agar esok tampil segar dan ceria!
${h1CustomNotes ? `3. Catatan Studio: ${h1CustomNotes}\n` : ''}
📄 Tautan Rincian Jadwal & Invoice:
${invoiceUrl}

Jika ada kendala di perjalanan, jangan ragu untuk menghubungi kami via WhatsApp ini ya Kak. Sampai jumpa besok! ✨`
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

Koleksi foto terbaik dari sesi ${packageName} bersama ${brandName} sedang dalam tahap finalisasi!
Berikut kami sampaikan rincian status tagihan Anda:

🔖 No. Booking: #${bookingCode}
💰 Total Biaya: ${totalPrice}
✅ DP Terbayar: ${dpAmount}
💳 Sisa Pelunasan: ${remainingAmount}
${bankTransferText}
📄 Tautan Kwitansi & Invoice Digital:
${invoiceUrl}
${paymentCustomNotes ? `\n💡 Catatan: ${paymentCustomNotes}\n` : ''}
Mohon menyelesaikan sisa pelunasan agar berkas foto hi-res dapat segera diserahterimakan. Silakan konfirmasikan bukti transfer ke WhatsApp ini ya Kak. Terima kasih banyak! 🙏`
      )
    } else if (type === 'final_delivery') {
      const deliveryPin = delivery?.download_pin || '••••••'
      const deliveryUrl = `${window.location.origin}/delivery/${bookingCode}`
      const fileCount = delivery?.file_count ? `${delivery.file_count} foto` : 'seluruh berkas foto pilihan'
      setWaTitle('Serah Terima Unduh Foto Final (Hi-Res)')
      setWaMessage(
`Halo Kak ${clientName} ✨

Koleksi foto terbaik dari sesi ${packageName} bersama ${brandName} telah selesai diedit dan siap diunduh dalam resolusi asli penuh!

🔗 Link Unduhan: ${deliveryUrl}
🔑 PIN Akses: ${deliveryPin}
📦 Berkas: ${fileCount}
⏱️ Masa Aktif: 14 hari ke depan

Silakan unduh dan simpan salinan foto Anda ya Kak. Terima kasih banyak atas kepercayaannya bersama ${brandName}! 🎉`
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
        {booking.addons && booking.addons.length > 0 && (
          <div className="rb-booking-detail__addons" style={{ marginTop: 'var(--rb-space-3)', paddingTop: 'var(--rb-space-3)', borderTop: '1px dashed var(--rb-border)' }}>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--rb-text-muted)', fontWeight: 700 }}>
              Layanan Tambahan (Add-on Dipilih):
            </label>
            <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: 'var(--rb-text-sm)', color: 'var(--rb-text-secondary)' }}>
              {booking.addons.map((a, i) => (
                <li key={i}>
                  <strong style={{ color: 'var(--rb-text-primary)' }}>{a.name}</strong> — {formatRp(a.price)} {a.quantity > 1 ? `(${a.quantity}x)` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
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
          <div style={{ display: 'flex', gap: 'var(--rb-space-3)' }}>
            <button
              type="button"
              className="rb-detail-card__link-action"
              onClick={() => setInvoiceModalOpen(true)}
            >
              📄 Kwitansi / Invoice
            </button>
            <button
              type="button"
              className="rb-detail-card__link-action"
              onClick={() => setPaymentSheetOpen(true)}
            >
              + Catat Bayar
            </button>
          </div>
        </div>
        <div className="rb-detail-card__payment-summary">
          <div><span>DP Wajib:</span> <strong>{formatRp(booking.dp_amount)}</strong></div>
          <div><span>Status DP:</span> <strong>{booking.dp_paid_at ? '✓ Sudah Dibayar' : '⏳ Belum Dikonfirmasi'}</strong></div>
        </div>

        {/* Banner Quick Konfirmasi Manual Mutasi Fotografer */}
        {!booking.dp_paid_at && (booking.status === 'pending' || booking.status === 'confirmed') && (
          <div style={{ marginTop: 'var(--rb-space-3)', padding: '0.875rem 1rem', background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.25)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#b45309', display: 'block' }}>
                  ⏳ Menunggu Cek Manual Mutasi QRIS / Transfer
                </strong>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--rb-color-muted, #7a6e65)' }}>
                  Periksa mutasi rekening/QRIS Anda. Jika dana DP ({formatRp(booking.dp_amount)}) sudah masuk, klik tombol di samping untuk mengonfirmasi dan mengunci jadwal.
                </p>
              </div>
              <button
                type="button"
                className="rb-btn rb-btn--primary rb-btn--sm"
                disabled={submitting}
                onClick={async () => {
                  if (!window.confirm(`Konfirmasi penerimaan pembayaran DP sebesar ${formatRp(booking.dp_amount)} dari ${booking.client?.name}? Jadwal kalender akan otomatis dikunci.`)) return
                  setSubmitting(true)
                  try {
                    await bookingService.addPayment(id, {
                      type: 'dp',
                      amount: booking.dp_amount,
                      method: 'qris',
                      notes: 'Dikonfirmasi melalui cek manual mutasi oleh fotografer',
                    })
                    refetch()
                  } catch (err) {
                    alert(err.response?.data?.message || 'Gagal mengonfirmasi pembayaran.')
                  } finally {
                    setSubmitting(false)
                  }
                }}
              >
                ✓ Konfirmasi DP Masuk
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Client Proofing (Swipe) Card ─────────────── */}
      {(() => {
        const proofSession = booking.proofing_session || booking.proofingSession
        return (
          <section className="rb-detail-card">
            <div className="rb-detail-card__header">
              <div>
                <h3 className="rb-detail-card__section-title">✨ Sesi Client Proofing (Swipe)</h3>
                <p className="rb-detail-card__hint">
                  {proofSession
                    ? 'Klien dapat memilih foto favorit dengan gestur swipe di smartphone.'
                    : 'Belum ada sesi pemilihan foto untuk reservasi ini.'}
                </p>
              </div>
              {proofSession && (
                <span className={`rb-status-pill rb-status-pill--${proofSession.status}`}>
                  {proofSession.status === 'completed'
                    ? 'Selesai Dipilih'
                    : proofSession.status === 'active'
                    ? 'Aktif'
                    : 'Draft'}
                </span>
              )}
            </div>

            {proofSession ? (
              <div className="rb-proofing-summary-box">
                <div className="rb-proofing-summary-stats">
                  <div className="rb-proofing-stat-item">
                    <span>Foto Dipilih</span>
                    <strong>{proofSession.selected_count || 0} / {proofSession.selection_quota || booking.package?.selection_quota || 20}</strong>
                  </div>
                  <div className="rb-proofing-stat-item">
                    <span>Total Foto Sesi</span>
                    <strong>{proofSession.total_photos || 0}</strong>
                  </div>
                  <div className="rb-proofing-stat-item">
                    <span>PIN Akses</span>
                    <strong>{proofSession.pin || '••••••'}</strong>
                  </div>
                </div>

                <div className="rb-proofing-quick-actions">
                  <button
                    type="button"
                    className="rb-btn rb-btn--ghost rb-btn--sm"
                    onClick={() => {
                      const proofUrl = `${window.location.origin}/proof/${proofSession.slug}`
                      navigator.clipboard?.writeText(`${proofUrl} (PIN: ${proofSession.pin})`)
                      alert('Tautan proofing & PIN berhasil disalin!')
                    }}
                  >
                    📋 Salin Link & PIN
                  </button>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/proofing/${booking.id}`)}
                  >
                    Kelola Foto & Hasil ↗
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rb-proofing-empty-box">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/proofing/${booking.id}`)}
                >
                  + Buat Sesi Proofing Baru
                </Button>
              </div>
            )}
          </section>
        )
      })()}

      {/* ── Client Delivery (Foto Final) Card ─────────── */}
      <section className="rb-detail-card">
        <div className="rb-detail-card__header">
          <div>
            <h3 className="rb-detail-card__section-title">📦 Serah Terima Foto Final (Client Delivery)</h3>
            <p className="rb-detail-card__hint">
              {delivery
                ? 'Klien dapat mengunduh foto master resolusi tinggi melalui portal khusus ber-PIN (retensi 14 hari).'
                : 'Belum ada tautan unduh foto final yang disiapkan untuk klien.'}
            </p>
          </div>
          {delivery && (
            <span className={`rb-status-pill rb-status-pill--${delivery.status}`}>
              {delivery.status === 'downloaded'
                ? 'Sudah Diunduh Klien'
                : delivery.status === 'ready'
                ? 'Siap Diunduh'
                : delivery.status === 'deleted'
                ? 'Kadaluarsa'
                : 'Menyiapkan'}
            </span>
          )}
        </div>

        {delivery ? (
          <div className="rb-proofing-summary-box">
            <div className="rb-proofing-summary-stats">
              <div className="rb-proofing-stat-item">
                <span>Jumlah Foto</span>
                <strong>{delivery.file_count ? `${delivery.file_count} Foto` : 'Semua'}</strong>
              </div>
              <div className="rb-proofing-stat-item">
                <span>PIN Akses Klien</span>
                <strong>{delivery.download_pin || '••••••'}</strong>
              </div>
              <div className="rb-proofing-stat-item">
                <span>Status Berkas</span>
                <strong style={{ color: 'var(--rb-success)' }}>Aktif (Cloud)</strong>
              </div>
            </div>

            <div className="rb-proofing-quick-actions">
              <button
                type="button"
                className="rb-btn rb-btn--ghost rb-btn--sm"
                onClick={() => {
                  const deliveryUrl = `${window.location.origin}/delivery/${booking.booking_code}`
                  navigator.clipboard?.writeText(`${deliveryUrl} (PIN: ${delivery.download_pin})`)
                  alert('Tautan unduh delivery & PIN berhasil disalin!')
                }}
              >
                📋 Salin Link Unduh & PIN
              </button>
              <a
                href={`${window.location.origin}/delivery/${booking.booking_code}?pin=${delivery.download_pin}`}
                target="_blank"
                rel="noreferrer"
                className="rb-btn rb-btn--ghost rb-btn--sm"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                Tinjau Portal Klien ↗
              </a>
              <Button size="sm" variant="secondary" onClick={handleOpenDeliverySheet}>
                Ubah Tautan / PIN
              </Button>
            </div>
          </div>
        ) : (
          <div className="rb-proofing-empty-box">
            <Button size="sm" variant="primary" onClick={handleOpenDeliverySheet}>
              + Siapkan Link Unduh Foto Final
            </Button>
          </div>
        )}
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

          <button
            type="button"
            className="rb-wa-btn"
            onClick={() => generateWaMessage('final_delivery')}
          >
            <span className="rb-wa-btn__icon">📦</span>
            <div className="rb-wa-btn__text">
              <strong>Serah Terima Foto Final</strong>
              <span>Link unduh resolusi tinggi & PIN</span>
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
      <BottomSheet isOpen={paymentSheetOpen} onClose={() => setPaymentSheetOpen(false)} title="Catat & Konfirmasi Pembayaran">
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
          <div className="rb-field">
            <label className="rb-field__label">Metode Pembayaran</label>
            <select
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              className="rb-field__control"
            >
              <option value="qris">QRIS Studio</option>
              <option value="transfer">Transfer Bank</option>
              <option value="tunai">Tunai / Cash</option>
              <option value="e_wallet">E-Wallet (GoPay, OVO, Dana)</option>
            </select>
          </div>
          <Input
            label="Nominal (Rp)"
            type="number"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            placeholder={paymentForm.type === 'dp' ? String(booking.dp_amount || 0) : String(booking.remaining_amount || 0)}
            required
          />
          <Input
            label="Catatan Verifikasi (Opsional)"
            type="text"
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            placeholder="Contoh: Cek mutasi BCA berhasil, jam 19:40"
          />
          <Button type="submit" fullWidth loading={submitting}>Simpan & Konfirmasi Pembayaran</Button>
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

      {/* Sheet Siapkan Link Delivery Final */}
      <BottomSheet
        isOpen={deliverySheetOpen}
        onClose={() => setDeliverySheetOpen(false)}
        title="Siapkan Serah Terima Foto Final"
      >
        <form onSubmit={handleSaveDelivery}>
          <Input
            label="Tautan Unduh Foto (Google Drive / Cloud Folder)"
            type="url"
            value={deliveryForm.download_link}
            onChange={(e) => setDeliveryForm({ ...deliveryForm, download_link: e.target.value })}
            placeholder="https://drive.google.com/drive/folders/..."
            required
          />
          <div className="rb-field">
            <label className="rb-field__label">PIN Keamanan Klien (6 Digit)</label>
            <input
              type="text"
              maxLength={6}
              placeholder="Kosongkan untuk PIN otomatis"
              value={deliveryForm.download_pin}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, download_pin: e.target.value.replace(/\D/g, '') })}
              className="rb-field__control"
            />
          </div>
          <Input
            label="Jumlah Foto Master (Opsional)"
            type="number"
            value={deliveryForm.file_count}
            onChange={(e) => setDeliveryForm({ ...deliveryForm, file_count: e.target.value })}
            placeholder="Contoh: 50"
          />
          <div className="rb-field">
            <label className="rb-field__label">Masa Aktif Tautan Klien</label>
            <select
              value={deliveryForm.expires_in_days}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, expires_in_days: Number(e.target.value) })}
              className="rb-field__control"
            >
              <option value={7}>7 Hari</option>
              <option value={14}>14 Hari (Standar Retensi)</option>
              <option value={30}>30 Hari</option>
            </select>
          </div>
          <Button type="submit" fullWidth loading={submitting}>
            Simpan & Aktifkan Link Unduhan
          </Button>
        </form>
      </BottomSheet>

      {/* Modal Kwitansi & Invoice Resmi */}
      <InvoiceReceiptModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        booking={booking}
        user={user}
      />
    </div>
  )
}
