import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePackages } from '../../hooks/usePackages'
import { useAuthStore } from '../../stores/authStore'
import Button from '../../components/ui/Button'
import BottomSheet from '../../components/ui/BottomSheet'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import './PackagePage.css'

export default function PackagePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { packages, loading, error, refetch, createPackage, updatePackage, deletePackage } = usePackages()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const isFree = !user?.is_pro
  const limitReached = isFree && packages.length >= 2

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
    if (limitReached) {
      if (window.confirm('Batas kuota 2 paket layanan tercapai untuk akun Starter. Buka halaman langganan untuk upgrade ke Pro Studio?')) {
        navigate('/subscription')
      }
      return
    }
    setEditingId(null)
    setFormError(null)
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
    } catch (err) {
      if (err.response?.data?.upgrade_required) {
        alert(err.response.data.message)
        navigate('/subscription')
      } else {
        setFormError(err.response?.data?.message || 'Gagal menyimpan paket.')
      }
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

      {limitReached && (
        <div className="rb-pkg-limit-banner">
          <div className="rb-pkg-limit-banner__text">
            <strong>Batas 2 Paket Starter Terpakai</strong>
            <p>Anda menggunakan 2 dari maksimal 2 paket gratis. Upgrade ke Pro Studio untuk membuat paket tanpa batas.</p>
          </div>
          <Link to="/subscription" className="rb-btn rb-btn--primary rb-btn--sm">
            Upgrade Pro ✦
          </Link>
        </div>
      )}

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
          <Input
            label="Nama Paket"
            placeholder="Contoh: Intimate Wedding, Wisuda Studio, Portrait Prewed"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            as="textarea"
            label="Deskripsi"
            placeholder="Contoh: Liputan intimate akad & resepsi hingga 6 jam. Termasuk flashdisk kayu, 40 foto edit cetak, dan portal swipe proofing."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="Harga Total (Rp)"
            type="number"
            placeholder="Contoh: 3500000"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <Input
            label="Nominal DP (Rp)"
            type="number"
            placeholder="Contoh: 1000000"
            value={form.dp_amount}
            onChange={(e) => setForm({ ...form, dp_amount: e.target.value })}
            required
          />
          <div className="rb-package-form__grid">
            <Input
              label="Durasi (Jam)"
              type="number"
              placeholder="Contoh: 6"
              value={form.duration_hours}
              onChange={(e) => setForm({ ...form, duration_hours: e.target.value })}
              required
            />
            <Input
              label="Kuota Final"
              type="number"
              placeholder="Contoh: 40"
              value={form.photo_quota}
              onChange={(e) => setForm({ ...form, photo_quota: e.target.value })}
              required
            />
          </div>
          <Input
            label="Kuota Pilihan Proofing"
            type="number"
            placeholder="Contoh: 60"
            value={form.selection_quota}
            onChange={(e) => setForm({ ...form, selection_quota: e.target.value })}
            required
          />
          <Button type="submit" fullWidth loading={submitting}>
            {editingId ? 'Simpan Perubahan' : 'Buat Paket'}
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
