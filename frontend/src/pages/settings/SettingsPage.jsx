import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import './SettingsPage.css'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [form, setForm] = useState({
    name: user?.name || '',
    brand_name: user?.brand_name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    city: user?.city || '',
    avatar_path: user?.avatar_path || '',
    whatsapp: user?.whatsapp || user?.phone || '',
    phone: user?.phone || '',
    instagram: user?.instagram || '',
  })

  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const handleChange = (e) => {
    let { name, value } = e.target
    if (name === 'username') {
      value = value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    }
    setForm((f) => ({ ...f, [name]: value }))
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handleCopyLink = () => {
    const handle = form.username || user?.username || 'studio'
    const fullUrl = `${window.location.origin}/@${handle}`
    navigator.clipboard?.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const { data } = await api.patch('/auth/profile', form)
      setUser(data)
      setSuccessMsg('Pengaturan profil studio berhasil disimpan.')
    } catch (err) {
      const res = err.response?.data
      if (res?.errors) {
        const firstKey = Object.keys(res.errors)[0]
        setErrorMsg(res.errors[firstKey][0])
      } else {
        setErrorMsg(res?.message || 'Gagal menyimpan perubahan profil studio.')
      }
    } finally {
      setLoading(false)
    }
  }

  const currentHandle = form.username || user?.username || ''
  const publicProfileUrl = currentHandle ? `/@${currentHandle}` : '/'

  return (
    <div className="rb-settings-page">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="rb-settings-header">
        <div>
          <span className="rb-settings-badge">Identitas & Branding</span>
          <h1 className="rb-settings-title">Pengaturan Profil Studio</h1>
          <p className="rb-settings-sub">
            Kelola profil publik, handle username (@handle), dan kontak reservasi klien Anda.
          </p>
        </div>
      </div>

      {/* ── Public Profile Card Banner ─────────────────────── */}
      <div className="rb-settings-preview-card">
        <div className="rb-settings-preview-card__main">
          <div className="rb-settings-preview-avatar">
            {form.avatar_path ? (
              <img
                src={form.avatar_path}
                alt="Logo Studio"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <span>{(form.brand_name || form.name || 'S').charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="rb-settings-preview-info">
            <div className="rb-settings-preview-top">
              <span className="rb-settings-preview-badge">Link Profil Publik Anda</span>
              {form.city && <span className="rb-settings-preview-city">📍 {form.city}</span>}
            </div>
            <h3 className="rb-settings-preview-name">
              {form.brand_name || form.name || 'Nama Studio'}
            </h3>
            <p className="rb-settings-preview-url">
              <span>ruangbahagia.web.id/@</span>
              <strong>{currentHandle || 'username'}</strong>
            </p>
          </div>
        </div>

        <div className="rb-settings-preview-actions">
          <button
            type="button"
            onClick={handleCopyLink}
            className="rb-btn rb-btn--ghost rb-btn--sm"
          >
            {copied ? '✓ Tautan Tersalin' : 'Salin Tautan'}
          </button>
          <a
            href={publicProfileUrl}
            target="_blank"
            rel="noreferrer"
            className="rb-btn rb-btn--primary rb-btn--sm"
          >
            Buka Profil Publik ↗
          </a>
        </div>
      </div>

      {/* ── Alerts ─────────────────────────────────────────── */}
      {successMsg && (
        <div className="rb-settings-alert rb-settings-alert--success" role="status">
          <span>✓ {successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rb-settings-alert rb-settings-alert--error" role="alert">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* ── Settings Form ──────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="rb-settings-form" noValidate>
        {/* Seksi 1: Branding & Identitas */}
        <div className="rb-settings-card">
          <h2 className="rb-settings-sec-title">1. Branding & Identitas Studio</h2>
          <p className="rb-settings-sec-desc">
            Informasi ini akan ditampilkan di halaman portofolio publik yang dilihat calon klien.
          </p>

          <div className="rb-form-row">
            <div className="rb-form-group">
              <label htmlFor="brand_name" className="rb-form-label">
                Nama Brand / Studio <span className="rb-form-req">*</span>
              </label>
              <input
                id="brand_name"
                name="brand_name"
                type="text"
                value={form.brand_name}
                onChange={handleChange}
                placeholder="Contoh: Ruang Bahagia Photography"
                className="rb-form-input"
                required
              />
            </div>

            <div className="rb-form-group">
              <label htmlFor="name" className="rb-form-label">
                Nama Lengkap Pemilik <span className="rb-form-req">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Contoh: Yulian Agus"
                className="rb-form-input"
                required
              />
            </div>
          </div>

          <div className="rb-form-row">
            <div className="rb-form-group">
              <label htmlFor="username" className="rb-form-label">
                Handle Username Publik (@handle) <span className="rb-form-req">*</span>
              </label>
              <div className="rb-handle-input-wrap">
                <span className="rb-handle-prefix">@</span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoCapitalize="none"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="yuliagus"
                  className="rb-form-input rb-handle-input"
                  required
                />
              </div>
              <small className="rb-form-hint">
                Tautan profil Anda: ruangbahagia.web.id/@{form.username || 'username'}
              </small>
            </div>

            <div className="rb-form-group">
              <label htmlFor="city" className="rb-form-label">
                Kota Domisili Studio
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={handleChange}
                placeholder="Contoh: Yogyakarta / Jakarta Selatan"
                className="rb-form-input"
              />
            </div>
          </div>

          <div className="rb-form-group">
            <label htmlFor="bio" className="rb-form-label">
              Bio / Filosofi Fotografi
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              value={form.bio}
              onChange={handleChange}
              placeholder="Ceritakan sedikit tentang gaya foto Anda, spesialisasi momen, atau cerita studio Anda..."
              className="rb-form-textarea"
            />
          </div>

          <div className="rb-form-group">
            <label htmlFor="avatar_path" className="rb-form-label">
              URL Avatar / Logo Studio
            </label>
            <input
              id="avatar_path"
              name="avatar_path"
              type="url"
              value={form.avatar_path}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/... atau link gambar logo"
              className="rb-form-input"
            />
            <small className="rb-form-hint">
              Tempelkan URL langsung gambar logo studio Anda untuk ditampilkan di profil publik.
            </small>
          </div>
        </div>

        {/* Seksi 2: Kontak & Notifikasi Booking */}
        <div className="rb-settings-card">
          <h2 className="rb-settings-sec-title">2. Kontak & Konfirmasi WhatsApp DP</h2>
          <p className="rb-settings-sec-desc">
            Nomor ini digunakan calon klien untuk mengirim bukti transfer DP via QRIS secara langsung ke WhatsApp Anda.
          </p>

          <div className="rb-form-row">
            <div className="rb-form-group">
              <label htmlFor="whatsapp" className="rb-form-label">
                Nomor WhatsApp Konfirmasi Booking <span className="rb-form-req">*</span>
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="Contoh: 081234567890"
                className="rb-form-input"
                required
              />
              <small className="rb-form-hint">
                Klien yang melakukan reservasi akan langsung diarahkan konfirmasi bukti pembayaran ke nomor ini.
              </small>
            </div>

            <div className="rb-form-group">
              <label htmlFor="instagram" className="rb-form-label">
                Akun Instagram
              </label>
              <input
                id="instagram"
                name="instagram"
                type="text"
                value={form.instagram}
                onChange={handleChange}
                placeholder="Contoh: @ruangbahagia.studio"
                className="rb-form-input"
              />
              <small className="rb-form-hint">
                Ditampilkan sebagai tombol tautan sosial media di profil portofolio Anda.
              </small>
            </div>
          </div>
        </div>

        {/* Action Submit */}
        <div className="rb-settings-submit-bar">
          <Button
            type="submit"
            loading={loading}
            disabled={!form.name || !form.username}
          >
            Simpan Perubahan Studio
          </Button>
        </div>
      </form>
    </div>
  )
}
