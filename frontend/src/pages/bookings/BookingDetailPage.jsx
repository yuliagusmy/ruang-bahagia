import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBookingDetail } from '../../hooks/useBookings'
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
  const { booking, loading, error, refetch } = useBookingDetail(id)

  const [statusSheetOpen, setStatusSheetOpen] = useState(false)
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
              href={`https://wa.me/${booking.client.phone.replace(/^0/, '62')}`}
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
    </div>
  )
}
