import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBookings } from '../../hooks/useBookings'
import { useAuthStore } from '../../stores/authStore'
import { exportToCsv } from '../../utils/exportCsv'
import BookingCard from '../../components/booking/BookingCard'
import BookingFormSheet from '../../components/booking/BookingFormSheet'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import Button from '../../components/ui/Button'
import BottomSheet from '../../components/ui/BottomSheet'
import './BookingListPage.css'

const TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Inquiry' },
  { id: 'dp_paid', label: 'DP Lunas' },
  { id: 'editing', label: 'Editing' },
  { id: 'completed', label: 'Selesai' },
]

export default function BookingListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { bookings, loading, error, refetch, createBooking } = useBookings()

  // WhatsApp Smart Reminder Sheet state
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [selectedBookingForWa, setSelectedBookingForWa] = useState(null)
  const [waType, setWaType] = useState('h1')
  const [waMessage, setWaMessage] = useState('')
  const [waCopied, setWaCopied] = useState(false)

  const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)

  const generateQuickWaText = (b, type) => {
    if (!b) return ''
    const clientName = b.client?.name || 'Klien'
    const brandName = user?.brand_name || user?.name || 'Ruang Bahagia Photography'
    const bookingCode = b.booking_code || ''
    const packageName = b.package?.name || 'Dokumentasi Foto'
    const dateFormatted = b.event_date
      ? new Date(b.event_date).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '-'
    const eventTime = b.event_time ? `${b.event_time} WIB` : 'Sesuai Jadwal'
    const location = b.event_location || b.location || 'Studio'
    const mapsLink = location ? `https://maps.google.com/?q=${encodeURIComponent(location)}` : ''
    const totalPrice = formatRp(b.total_price)
    const dpAmount = formatRp(b.dp_amount)
    const remainingAmount = formatRp(b.remaining_amount || (b.total_price - (b.dp_amount || 0)))
    const invoiceUrl = `${window.location.origin}/invoice/${bookingCode}`

    const notifSettings = user?.notification_settings || {}
    const bankName = notifSettings.bank_name || 'BCA'
    const bankAcc = notifSettings.bank_account_number || ''
    const bankHolder = notifSettings.bank_account_holder || user?.name || brandName
    const h1CustomNotes = notifSettings.h1_reminder_notes || ''
    const paymentCustomNotes = notifSettings.payment_reminder_notes || ''

    const bankTransferText = bankAcc
      ? `\n🏦 Rekening Pembayaran:\n• Bank: ${bankName}\n• No. Rekening: ${bankAcc}\n• A.N: ${bankHolder}\n`
      : ''

    if (type === 'h1') {
      return (
`Halo Kak ${clientName} 📸

Pengingat sesi foto besok bersama ${brandName}!
Kami ingin mengonfirmasi jadwal pemotretan Anda:

📅 Tanggal: ${dateFormatted}
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
    }

    if (type === 'pelunasan') {
      return (
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
    }

    return (
`Halo Kak ${clientName} ✨

Terima kasih telah melakukan reservasi sesi foto bersama ${brandName}!
Berikut adalah rincian jadwal pemesanan Anda:

🔖 Kode Booking: #${bookingCode}
📦 Paket: ${packageName}
📅 Tanggal: ${dateFormatted}
⏰ Waktu: ${eventTime}
📍 Lokasi: ${location}${mapsLink ? `\n🗺️ Peta Lokasi: ${mapsLink}` : ''}
💰 Total Biaya: ${totalPrice}
💳 Uang Muka (DP): ${dpAmount}
${bankTransferText}
📄 Tautan Invoice Digital & Rincian Paket:
${invoiceUrl}

Silakan transfer DP untuk mengunci slot jadwal Anda dan konfirmasikan bukti transfer ke WhatsApp ini ya Kak. Terima kasih! 🙏`
    )
  }

  const handleOpenQuickReminder = (b) => {
    setSelectedBookingForWa(b)
    const isSoon = b.event_date && Math.abs(new Date(b.event_date) - new Date()) / (1000 * 60 * 60 * 24) <= 2
    const initialType = isSoon
      ? 'h1'
      : (b.remaining_amount > 0 || (b.total_price && b.total_price > (b.dp_amount || 0)))
      ? 'pelunasan'
      : 'konfirmasi'
    setWaType(initialType)
    setWaMessage(generateQuickWaText(b, initialType))
    setWaModalOpen(true)
  }

  const handleChangeWaType = (type) => {
    setWaType(type)
    setWaMessage(generateQuickWaText(selectedBookingForWa, type))
  }

  const filtered = bookings.filter((b) => {
    const matchesTab = activeTab === 'all' || b.status === activeTab
    const matchesSearch =
      !search ||
      b.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_code?.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const handleExport = () => {
    if (!user?.is_pro) {
      if (window.confirm('Fitur Ekspor Laporan Keuangan & Rekap Booking hanya tersedia untuk akun Pro Studio. Ingin upgrade sekarang?')) {
        navigate('/subscription')
      }
      return
    }

    if (bookings.length === 0) {
      alert('Belum ada data booking untuk diekspor.')
      return
    }

    const headers = [
      'Kode Booking',
      'Nama Klien',
      'Nomor WhatsApp',
      'Paket Layanan',
      'Tanggal Sesi',
      'Waktu',
      'Lokasi',
      'Total Biaya (Rp)',
      'Uang Muka DP (Rp)',
      'Status Sesi',
      'Tanggal Reservasi',
    ]

    const rows = filtered.map((b) => [
      b.booking_code || '',
      b.client?.name || '',
      b.client?.phone || '',
      b.package?.name || '',
      b.event_date ? new Date(b.event_date).toLocaleDateString('id-ID') : '',
      b.event_time ? `${b.event_time} WIB` : '',
      b.event_location || b.location || 'Studio',
      b.total_price || 0,
      b.dp_amount || 0,
      b.status || '',
      b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID') : '',
    ])

    const dateStr = new Date().toISOString().slice(0, 10)
    exportToCsv(`laporan_booking_${user?.username || 'studio'}_${dateStr}`, headers, rows)
  }

  return (
    <div className="page rb-bookings-page">
      <div className="rb-bookings-page__top">
        <div className="rb-bookings-page__search-wrap">
          <input
            type="search"
            placeholder="Cari klien atau kode booking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-bookings-page__search"
          />
        </div>
        <div className="rb-bookings-page__top-actions">
          <button
            type="button"
            className="rb-btn rb-btn--ghost rb-btn--sm rb-export-btn"
            onClick={handleExport}
            title={user?.is_pro ? 'Ekspor data booking ke Excel/CSV' : 'Fitur Pro Studio: Ekspor Laporan'}
          >
            <span>📥 Ekspor CSV</span>
            {!user?.is_pro && <span className="rb-pro-chip">PRO</span>}
          </button>
          <Button size="sm" onClick={() => setIsSheetOpen(true)}>
            + Booking
          </Button>
        </div>
      </div>

      <div className="rb-bookings-page__tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`rb-bookings-page__tab ${activeTab === tab.id ? 'rb-bookings-page__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rb-bookings-page__content">
        {loading ? (
          <div className="rb-bookings-page__loading">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="block" height="96px" />
            ))}
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <Button size="sm" onClick={refetch} variant="secondary">Coba Lagi</Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Tidak Ada Booking"
            message={search ? 'Tidak ditemukan booking yang cocok dengan kata kunci.' : 'Belum ada data pada tab ini.'}
            actionLabel="Tambah Booking"
            onAction={() => setIsSheetOpen(true)}
          />
        ) : (
          <div className="rb-bookings-page__list">
            {filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onQuickReminder={handleOpenQuickReminder}
              />
            ))}
          </div>
        )}
      </div>

      <BookingFormSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSubmit={createBooking}
      />

      {/* ── Sheet Quick WhatsApp Smart Reminder ── */}
      <BottomSheet
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        title="Kirim Reminder WhatsApp Cepat"
        className="rb-sheet--wide"
      >
        {selectedBookingForWa && (
          <div className="rb-wa-modal">
            <div className="rb-wa-modal__header">
              <span className="rb-wa-modal__target">
                Tujuan: <strong>{selectedBookingForWa.client?.name}</strong> (
                {selectedBookingForWa.client?.phone || 'Nomor tidak ada'})
              </span>
            </div>

            {/* Template Selector Tabs */}
            <div className="rb-wa-quick-tabs">
              <button
                type="button"
                className={`rb-wa-quick-tab ${waType === 'h1' ? 'rb-wa-quick-tab--active' : ''}`}
                onClick={() => handleChangeWaType('h1')}
              >
                ⏰ Pengingat H-1
              </button>
              <button
                type="button"
                className={`rb-wa-quick-tab ${waType === 'pelunasan' ? 'rb-wa-quick-tab--active' : ''}`}
                onClick={() => handleChangeWaType('pelunasan')}
              >
                💳 Tagihan Pelunasan
              </button>
              <button
                type="button"
                className={`rb-wa-quick-tab ${waType === 'konfirmasi' ? 'rb-wa-quick-tab--active' : ''}`}
                onClick={() => handleChangeWaType('konfirmasi')}
              >
                📝 Konfirmasi DP
              </button>
            </div>

            <div className="rb-field" style={{ marginTop: 'var(--rb-space-3)' }}>
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
                href={`https://wa.me/${(selectedBookingForWa.client?.phone || '')
                  .replace(/^0/, '62')
                  .replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="rb-btn rb-btn--primary rb-btn--full rb-btn--wa"
                onClick={() => setWaModalOpen(false)}
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
        )}
      </BottomSheet>
    </div>
  )
}
