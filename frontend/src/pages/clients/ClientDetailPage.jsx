import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useClientDetail } from '../../hooks/useClients'
import clientService from '../../services/client.service'
import BookingCard from '../../components/booking/BookingCard'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import BottomSheet from '../../components/ui/BottomSheet'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import './ClientDetailPage.css'

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { client, loading, error, refetch } = useClientDetail(id)

  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', instagram: '', notes: '' })

  if (loading) {
    return (
      <div className="page rb-client-detail">
        <Skeleton variant="avatar" width="60px" height="60px" />
        <Skeleton variant="block" height="120px" style={{ marginTop: '16px' }} />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="page rb-client-detail">
        <div className="error-state">
          <p>{error || 'Klien tidak ditemukan.'}</p>
          <Button onClick={() => navigate('/clients')} variant="secondary">Kembali</Button>
        </div>
      </div>
    )
  }

  const openEdit = () => {
    setForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      instagram: client.instagram || '',
      notes: client.notes || '',
    })
    setEditSheetOpen(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await clientService.update(id, form)
      setEditSheetOpen(false)
      refetch()
    } finally {
      setSubmitting(false)
    }
  }

  const waLink = client.phone ? `https://wa.me/${client.phone.replace(/^0/, '62')}` : null
  const igHandle = client.instagram ? client.instagram.replace(/^@/, '') : null

  return (
    <div className="page rb-client-detail">
      <div className="rb-client-detail__header">
        <button className="rb-client-detail__back" onClick={() => navigate(-1)} aria-label="Kembali">
          ← Kembali
        </button>
        <Button size="sm" variant="ghost" onClick={openEdit}>Edit Klien</Button>
      </div>

      <div className="rb-client-detail__hero">
        <div className="rb-client-detail__avatar">
          {client.name?.[0]?.toUpperCase() || 'K'}
        </div>
        <h2 className="rb-client-detail__name">{client.name}</h2>
        {client.pipeline_status && <Badge status={client.pipeline_status} />}
      </div>

      <div className="rb-client-detail__quick-links">
        {waLink && (
          <a href={waLink} target="_blank" rel="noreferrer" className="rb-client-detail__btn-wa">
            WhatsApp
          </a>
        )}
        {igHandle && (
          <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noreferrer" className="rb-client-detail__btn-ig">
            @{igHandle}
          </a>
        )}
        {client.email && (
          <a href={`mailto:${client.email}`} className="rb-client-detail__btn-mail">
            Email
          </a>
        )}
      </div>

      {client.notes && (
        <section className="rb-detail-card">
          <h3 className="rb-detail-card__section-title">Catatan Preferensi</h3>
          <p className="rb-client-detail__notes">{client.notes}</p>
        </section>
      )}

      <section className="rb-client-detail__bookings">
        <h3 className="rb-detail-card__section-title">Riwayat Sesi ({client.bookings?.length || 0})</h3>
        {(!client.bookings || client.bookings.length === 0) ? (
          <EmptyState
            title="Belum Ada Sesi Pemotretan"
            message="Klien ini belum memiliki riwayat reservasi booking yang tercatat."
            actionLabel="+ Buat Reservasi Sesi Baru"
            onAction={() => navigate(`/book`)}
          />
        ) : (
          <div className="rb-client-detail__booking-list">
            {client.bookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </section>

      <BottomSheet isOpen={editSheetOpen} onClose={() => setEditSheetOpen(false)} title="Edit Klien">
        <form onSubmit={handleUpdate}>
          <Input label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
          <Input as="textarea" label="Catatan" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit" fullWidth loading={submitting}>Simpan Perubahan</Button>
        </form>
      </BottomSheet>
    </div>
  )
}
