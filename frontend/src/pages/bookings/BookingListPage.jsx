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
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>

      <BookingFormSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSubmit={createBooking}
      />
    </div>
  )
}
