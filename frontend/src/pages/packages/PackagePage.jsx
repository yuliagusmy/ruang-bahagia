import { useState } from 'react'
import { usePackages } from '../../hooks/usePackages'
import Button from '../../components/ui/Button'
import BottomSheet from '../../components/ui/BottomSheet'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import './PackagePage.css'

export default function PackagePage() {
  const { packages, loading, error, refetch, createPackage, updatePackage, deletePackage } = usePackages()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    dp_amount: '',
    duration_hours: 2,
    photo_quota: 20,
    selection_quota: 30,
    is_active: true,
  })

  const openCreate = () => {
    setEditingId(null)
    setForm({
      name: '',
      description: '',
      price: '',
      dp_amount: '',
      duration_hours: 2,
      photo_quota: 20,
      selection_quota: 30,
      is_active: true,
    })
    setSheetOpen(true)
  }

  const openEdit = (pkg) => {
    setEditingId(pkg.id)
    setForm({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      dp_amount: pkg.dp_amount || Math.round(pkg.price * 0.3),
      duration_hours: pkg.duration_hours || 2,
      photo_quota: pkg.photo_quota || 20,
      selection_quota: pkg.selection_quota || 30,
      is_active: Boolean(pkg.is_active),
    })
    setSheetOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        await updatePackage(editingId, form)
      } else {
        await createPackage(form)
      }
      setSheetOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)

  return (
    <div className="page rb-package-page">
      <div className="rb-package-page__top">
        <h2 className="rb-package-page__title">Paket Layanan</h2>
        <Button size="sm" onClick={openCreate}>+ Tambah Paket</Button>
      </div>

      <div className="rb-package-page__content">
        {loading ? (
          <div className="rb-package-page__loading">
            {[1, 2, 3].map((i) => <Skeleton key={i} variant="block" height="120px" />)}
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <Button size="sm" onClick={refetch} variant="secondary">Coba Lagi</Button>
          </div>
        ) : packages.length === 0 ? (
          <EmptyState
            title="Belum Ada Paket"
            message="Buat paket foto pertama Anda untuk ditampilkan di katalog klien."
            actionLabel="Tambah Paket"
            onAction={openCreate}
          />
        ) : (
          <div className="rb-package-page__list">
            {packages.map((pkg) => (
              <div key={pkg.id} className={`rb-pkg-card ${!pkg.is_active ? 'rb-pkg-card--inactive' : ''}`}>
                <div className="rb-pkg-card__header">
                  <h3 className="rb-pkg-card__name">{pkg.name}</h3>
                  <span className="rb-pkg-card__price">{formatRp(pkg.price)}</span>
                </div>

                {pkg.description && (
                  <p className="rb-pkg-card__desc">{pkg.description}</p>
                )}

                <div className="rb-pkg-card__specs">
                  <span>⏱ {pkg.duration_hours || 2} Jam</span>
                  <span>📷 Kuota {pkg.photo_quota} Foto</span>
                  <span>💰 DP {formatRp(pkg.dp_amount)}</span>
                </div>

                <div className="rb-pkg-card__footer">
                  <span className={`rb-pkg-card__status ${pkg.is_active ? 'rb-pkg-card__status--active' : ''}`}>
                    {pkg.is_active ? 'Katalog Aktif' : 'Nonaktif'}
                  </span>
                  <div className="rb-pkg-card__actions">
                    <button className="rb-pkg-card__btn-edit" onClick={() => openEdit(pkg)}>Edit</button>
                    <button className="rb-pkg-card__btn-del" onClick={() => deletePackage(pkg.id)}>Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingId ? 'Edit Paket Foto' : 'Tambah Paket Baru'}
      >
        <form onSubmit={handleSubmit}>
          <Input label="Nama Paket" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input as="textarea" label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Harga Total (Rp)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <Input label="Nominal DP (Rp)" type="number" value={form.dp_amount} onChange={(e) => setForm({ ...form, dp_amount: e.target.value })} required />
          <div className="rb-package-form__grid">
            <Input label="Durasi (Jam)" type="number" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} required />
            <Input label="Kuota Final" type="number" value={form.photo_quota} onChange={(e) => setForm({ ...form, photo_quota: e.target.value })} required />
          </div>
          <Input label="Kuota Pilihan Proofing" type="number" value={form.selection_quota} onChange={(e) => setForm({ ...form, selection_quota: e.target.value })} required />
          <Button type="submit" fullWidth loading={submitting}>
            {editingId ? 'Simpan Perubahan' : 'Buat Paket'}
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
