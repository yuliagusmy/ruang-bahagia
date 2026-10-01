import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import portfolioService from '../../services/portfolio.service'
import Button from '../../components/ui/Button'
import BottomSheet from '../../components/ui/BottomSheet'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import './PortfolioPage.css'

const CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'prewedding', label: 'Prewedding' },
  { id: 'portrait', label: 'Portrait' },
  { id: 'editorial', label: 'Editorial' },
]

export default function PortfolioPage() {
  const user = useAuthStore((s) => s.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const sessionQueryId = searchParams.get('session')

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCat, setActiveCat] = useState('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Lightbox state untuk preview foto resolusi penuh
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const [form, setForm] = useState({
    title: '',
    category: 'wedding',
    thumbnail_path: '',
    photos_raw: '', // baris demi baris URL foto
    description: '',
    is_featured: false,
    taken_at: '',
  })

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await portfolioService.getAll()
      setItems(res.data?.data || res.data || [])
    } catch {
      setError('Gagal memuat galeri karya.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  // Sesi aktif jika ada session di query param URL (?session=id)
  const activeSession = items.find((it) => String(it.id) === String(sessionQueryId))

  const handleOpenSession = (item) => {
    setSearchParams({ session: item.id })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCloseSession = () => {
    setSearchParams({})
    setLightboxIndex(null)
  }

  // Keyboard navigation untuk lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null || !activeSession) return
      const photos = activeSession.photos || [activeSession.thumbnail_path]
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % photos.length)
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, activeSession])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    // Parsing URL foto dari textarea (dipisahkan baris baru / koma)
    const extraPhotos = form.photos_raw
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0)

    const allPhotos = form.thumbnail_path
      ? [form.thumbnail_path, ...extraPhotos.filter((u) => u !== form.thumbnail_path)]
      : extraPhotos

    try {
      await portfolioService.create({
        title: form.title,
        category: form.category,
        thumbnail_path: form.thumbnail_path || allPhotos[0] || '',
        photos: allPhotos,
        description: form.description,
        is_featured: form.is_featured,
        taken_at: form.taken_at || null,
      })
      setSheetOpen(false)
      setForm({
        title: '',
        category: 'wedding',
        thumbnail_path: '',
        photos_raw: '',
        description: '',
        is_featured: false,
        taken_at: '',
      })
      fetchItems()
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = items.filter((item) => activeCat === 'all' || item.category === activeCat)

  // ── 1. Tampilan Detail Sesi (Jika Sesi Dipilih) ──────────────────────
  if (activeSession) {
    const photos = activeSession.photos?.length > 0
      ? activeSession.photos
      : [activeSession.thumbnail_path || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800']

    return (
      <div className="page rb-portfolio-page rb-session-view">
        {/* Navigation & Action Bar */}
        <div className="rb-session-view__nav">
          <button
            type="button"
            onClick={handleCloseSession}
            className="rb-session-view__back-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>Kembali ke Semua Galeri</span>
          </button>

          <div className="rb-session-view__badge-row">
            <span className="rb-session-badge">{activeSession.category}</span>
            <span className="rb-session-count">📷 {photos.length} Foto</span>
          </div>
        </div>

        {/* Header Sesi */}
        <div className="rb-session-view__header">
          <h2 className="rb-session-view__title">{activeSession.title}</h2>
          {activeSession.description && (
            <p className="rb-session-view__desc">{activeSession.description}</p>
          )}
          {activeSession.taken_at && (
            <p className="rb-session-view__date">
              📅 Sesi Foto: {new Date(activeSession.taken_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Grid Semua Foto dalam 1 Sesi */}
        <div className="rb-session-photos-grid">
          {photos.map((photoUrl, idx) => (
            <div
              key={idx}
              className="rb-session-photo-item"
              onClick={() => setLightboxIndex(idx)}
              title="Klik untuk melihat resolusi penuh"
            >
              <img
                src={photoUrl}
                alt={`${activeSession.title} - Foto ${idx + 1}`}
                className="rb-session-photo-item__img"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800'
                }}
              />
              <div className="rb-session-photo-item__overlay">
                <span className="rb-session-photo-item__zoom">🔍 Perbesar</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Lightbox Modal Fullscreen ───────────────────────────── */}
        {lightboxIndex !== null && (
          <div className="rb-lightbox" onClick={() => setLightboxIndex(null)}>
            <div className="rb-lightbox__dialog" onClick={(e) => e.stopPropagation()}>
              <div className="rb-lightbox__bar">
                <span className="rb-lightbox__counter">
                  {lightboxIndex + 1} / {photos.length} &bull; {activeSession.title}
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="rb-lightbox__close"
                  aria-label="Tutup foto"
                >
                  ✕
                </button>
              </div>

              <div className="rb-lightbox__media">
                <img
                  src={photos[lightboxIndex]}
                  alt={`${activeSession.title} - ${lightboxIndex + 1}`}
                  className="rb-lightbox__img"
                />
              </div>

              {photos.length > 1 && (
                <div className="rb-lightbox__nav">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                    className="rb-lightbox__nav-btn"
                    aria-label="Foto sebelumnya"
                  >
                    &larr; Sebelumnya
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex((prev) => (prev + 1) % photos.length)}
                    className="rb-lightbox__nav-btn"
                    aria-label="Foto berikutnya"
                  >
                    Berikutnya &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── 2. Tampilan Utama: Daftar Album / Sesi Portofolio ────────────────
  return (
    <div className="page rb-portfolio-page">
      <div className="rb-portfolio-page__top">
        <div>
          <h2 className="rb-portfolio-page__title">Galeri Karya</h2>
          <p className="rb-portfolio-page__sub">
            Kumpulan sesi pemotretan. Klik salah satu karya untuk melihat seluruh foto sesi.
          </p>
        </div>
        <Button size="sm" onClick={() => setSheetOpen(true)}>+ Tambah Sesi Foto</Button>
      </div>

      {user?.username && (
        <div className="rb-portfolio-public-banner">
          <div className="rb-portfolio-public-banner__left">
            <span className="rb-portfolio-public-banner__icon">🌐</span>
            <div className="rb-portfolio-public-banner__text">
              <span className="rb-portfolio-public-banner__label">Halaman Beranda Customer Anda:</span>
              <a
                href={`/@${user.username}`}
                target="_blank"
                rel="noreferrer"
                className="rb-portfolio-public-banner__link"
                title="Buka tampilan portofolio publik Anda di tab baru"
              >
                ruangbahagia.web.id/@<strong>{user.username}</strong> ↗
              </a>
            </div>
          </div>
          <span className="rb-portfolio-public-banner__note">
            Foto yang Anda upload di sini akan tampil otomatis di beranda klien @{user.username}
          </span>
        </div>
      )}

      <div className="rb-portfolio-page__categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`rb-portfolio-page__cat-btn ${activeCat === cat.id ? 'rb-portfolio-page__cat-btn--active' : ''}`}
            onClick={() => setActiveCat(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="rb-portfolio-page__content">
        {loading ? (
          <div className="rb-portfolio-page__grid">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="block" height="220px" />)}
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <Button size="sm" onClick={fetchItems} variant="secondary">Coba Lagi</Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Galeri Belum Terisi"
            message="Tambahkan sesi karya terbaik Anda untuk dipamerkan ke calon klien."
            actionLabel="Tambah Sesi Foto"
            onAction={() => setSheetOpen(true)}
          />
        ) : (
          <div className="rb-portfolio-page__grid">
            {filtered.map((item) => {
              const photoCount = item.photos?.length || 1
              const coverUrl = item.thumbnail_path || item.photos?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800'

              return (
                <div
                  key={item.id}
                  className="rb-photo-card"
                  onClick={() => handleOpenSession(item)}
                  title={`Klik untuk melihat ${photoCount} foto di sesi ${item.title}`}
                >
                  <img
                    src={coverUrl}
                    alt={item.title}
                    className="rb-photo-card__img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800'
                    }}
                  />

                  {/* Badge Jumlah Foto Sesi */}
                  <div className="rb-photo-card__top-badge">
                    <span>📷 {photoCount} Foto</span>
                  </div>

                  <div className="rb-photo-card__overlay">
                    <span className="rb-photo-card__cat">{item.category}</span>
                    <h4 className="rb-photo-card__title">{item.title}</h4>
                    <span className="rb-photo-card__hint">Lihat Sesi &rarr;</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── BottomSheet Tambah Sesi Foto ──────────────────────────── */}
      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="Tambah Sesi Karya Baru">
        <form onSubmit={handleSubmit} className="rb-portfolio-form">
          <Input
            label="Judul Sesi Foto"
            placeholder="Contoh: Graduation Memory at UI - Yuliagus"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <div className="rb-field">
            <label className="rb-field__label">Kategori</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rb-field__control"
            >
              <option value="wedding">Wedding</option>
              <option value="prewedding">Prewedding</option>
              <option value="portrait">Portrait</option>
              <option value="editorial">Editorial</option>
              <option value="family">Family</option>
            </select>
          </div>

          <Input
            label="Foto Sampul Utama (URL Cover)"
            placeholder="https://images.unsplash.com/..."
            value={form.thumbnail_path}
            onChange={(e) => setForm({ ...form, thumbnail_path: e.target.value })}
            helper="Foto ini akan tampil sebagai perwakilan sesi di halaman utama."
            required
          />

          <Input
            as="textarea"
            label="Koleksi Foto Sesi (URL Foto Lainnya)"
            placeholder="Masukkan satu URL foto per baris&#10;https://.../foto-1.jpg&#10;https://.../foto-2.jpg&#10;https://.../foto-3.jpg"
            value={form.photos_raw}
            onChange={(e) => setForm({ ...form, photos_raw: e.target.value })}
            helper="Masukkan URL foto-foto lain dalam sesi ini agar dapat dilihat klien saat sesi diklik."
          />

          <Input
            type="date"
            label="Tanggal Pemotretan (Opsional)"
            value={form.taken_at}
            onChange={(e) => setForm({ ...form, taken_at: e.target.value })}
          />

          <Input
            as="textarea"
            label="Deskripsi / Cerita Sesi (Opsional)"
            placeholder="Ceritakan konsep foto, lokasi, atau momen berharga dalam sesi ini..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Button type="submit" fullWidth loading={submitting}>
            Simpan Sesi ke Galeri
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
