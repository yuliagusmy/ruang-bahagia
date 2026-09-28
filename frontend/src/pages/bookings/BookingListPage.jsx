import { useState } from 'react'
import { useBookings } from '../../hooks/useBookings'
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
        <Button size="sm" onClick={() => setIsSheetOpen(true)}>
          + Booking
        </Button>
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
