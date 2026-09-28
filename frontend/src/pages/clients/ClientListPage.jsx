import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients } from '../../hooks/useClients'
import { useAuthStore } from '../../stores/authStore'
import { exportToCsv } from '../../utils/exportCsv'
import ClientCard from '../../components/client/ClientCard'
import ClientFormSheet from '../../components/client/ClientFormSheet'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import Button from '../../components/ui/Button'
import './ClientListPage.css'

export default function ClientListPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { clients, loading, error, refetch, createClient } = useClients()

  const filtered = clients.filter((c) => {
    return (
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    )
  })

  const handleExport = () => {
    if (!user?.is_pro) {
      if (window.confirm('Fitur Ekspor Kontak Klien (Excel/CSV) adalah fitur eksklusif Ruang Bahagia Pro Studio. Upgrade sekarang untuk membuka fitur ini?')) {
        navigate('/subscription')
      }
      return
    }

    if (!filtered || filtered.length === 0) {
      alert('Tidak ada data klien untuk diekspor.')
      return
    }

    const headers = [
      'Nama Klien',
      'Nomor WhatsApp',
      'Email',
      'Instagram',
      'Total Sesi Booking',
      'Catatan',
      'Tanggal Bergabung',
    ]

    const rows = filtered.map((c) => [
      c.name || '',
      c.phone || '',
      c.email || '',
      c.instagram || '',
      c.bookings_count ?? c.bookings?.length ?? 0,
      c.notes || '',
      c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID') : '',
    ])

    const dateStr = new Date().toISOString().slice(0, 10)
    exportToCsv(`database_klien_${user?.username || 'studio'}_${dateStr}`, headers, rows)
  }

  return (
    <div className="page rb-clients-page">
      <div className="rb-clients-page__top">
        <div className="rb-clients-page__search-wrap">
          <input
            type="search"
            placeholder="Cari nama, nomor HP, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-clients-page__search"
          />
        </div>
        <div className="rb-clients-page__top-actions">
          <button
            type="button"
            className="rb-btn rb-btn--ghost rb-btn--sm rb-export-btn"
            onClick={handleExport}
            title={user?.is_pro ? 'Ekspor database klien ke Excel/CSV' : 'Fitur Pro Studio: Ekspor Kontak Klien'}
          >
            <span>📥 Ekspor CSV</span>
            {!user?.is_pro && <span className="rb-pro-chip">PRO</span>}
          </button>
          <Button size="sm" onClick={() => setIsSheetOpen(true)}>
            + Klien
          </Button>
        </div>
      </div>

      <div className="rb-clients-page__content">
        {loading ? (
          <div className="rb-clients-page__loading">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <Button size="sm" onClick={refetch} variant="secondary">Coba Lagi</Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Belum Ada Klien"
            message={search ? 'Klien dengan kata kunci tersebut tidak ditemukan.' : 'Mulai tambahkan kontak klien pertama Anda.'}
            actionLabel="Tambah Klien"
            onAction={() => setIsSheetOpen(true)}
          />
        ) : (
          <div className="rb-clients-page__list">
            {filtered.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>

      <ClientFormSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSubmit={createClient}
      />
    </div>
  )
}
