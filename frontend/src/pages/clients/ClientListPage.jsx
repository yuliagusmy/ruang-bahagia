import { useState } from 'react'
import { useClients } from '../../hooks/useClients'
import ClientCard from '../../components/client/ClientCard'
import ClientFormSheet from '../../components/client/ClientFormSheet'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import Button from '../../components/ui/Button'
import './ClientListPage.css'

export default function ClientListPage() {
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
        <Button size="sm" onClick={() => setIsSheetOpen(true)}>
          + Klien
        </Button>
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
