import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import './RegisterPage.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({
    name: '',
    brand_name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    city: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    let { name, value } = e.target
    if (name === 'username') {
      // Auto-sanitize username to lowercase and valid characters
      value = value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    }
    setForm((f) => ({ ...f, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data } = await api.post('/auth/register', form)
      setAuth(data.token, data.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const res = err.response?.data
      if (res?.errors) {
        const firstErrorKey = Object.keys(res.errors)[0]
        setError(res.errors[firstErrorKey][0])
      } else {
        setError(res?.message || 'Registrasi gagal. Silakan periksa kembali data Anda.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rb-register-page">
      {/* ── Brand Hero Showcase (Kiri pada Desktop) ── */}
      <div className="rb-register-hero">
        <div className="rb-register-hero__content">
          <Link to="/" className="rb-register-hero__back" title="Kembali ke Beranda">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="rb-register-brand">
            <img
              src="/logo.jpg"
              alt="Ruang Bahagia Logo"
              className="rb-register-brand__logo"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div>
              <span className="rb-register-badge">Mulai Gratis</span>
              <h1 className="rb-register-hero__title">
                Portal Studio Fotografer Profesional
              </h1>
            </div>
          </div>

          <p className="rb-register-hero__lead">
            Dapatkan portal portofolio pribadi, sistem booking mandiri dengan QRIS, dan seleksi foto interaktif (swipe proofing) untuk klien Anda.
          </p>

          <div className="rb-register-features">
            <div className="rb-reg-feat">
              <span className="rb-reg-feat__icon">✦</span>
              <div>
                <strong>Domain & Handle Pribadi</strong>
                <p>Bagikan link portofolio Anda seperti ruangbahagia.web.id/@namastudio di bio Instagram.</p>
              </div>
            </div>
            <div className="rb-reg-feat">
              <span className="rb-reg-feat__icon">✦</span>
              <div>
                <strong>Client Swipe Proofing</strong>
                <p>Klien Anda memilih foto favorit dengan gesture swipe yang mulus di ponsel mereka.</p>
              </div>
            </div>
            <div className="rb-reg-feat">
              <span className="rb-reg-feat__icon">✦</span>
              <div>
                <strong>100% Mobile-First</strong>
                <p>Kelola jadwal, DP klien, dan galeri karya langsung dari kenyamanan smartphone Anda.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form Section (Kanan pada Desktop) ── */}
      <div className="rb-register-form-wrap">
        {/* Mobile Header (Khusus Mobile < 900px) */}
        <div className="rb-register-mobile-header">
          <Link to="/" className="rb-register-mobile-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="rb-register-mobile-brand">
            <img src="/logo.jpg" alt="Ruang Bahagia Logo" className="rb-register-mobile-logo" />
            <div className="rb-register-mobile-brand-text">
              <h2 className="rb-register-mobile-title">Ruang Bahagia</h2>
              <span className="rb-register-mobile-badge">Daftar Studio Gratis</span>
            </div>
          </div>
        </div>

        <div className="rb-register-card">
          <div className="rb-register-card__header">
            <h2 className="rb-register-card__title">Daftar Akun Fotografer</h2>
            <p className="rb-register-card__sub">
              Buat studio online Anda dalam 2 menit. Gratis tanpa biaya pendaftaran.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rb-register-form" noValidate>
            <div className="rb-form-row">
              <div className="rb-form-group">
                <label htmlFor="name" className="rb-form-label">
                  Nama Lengkap <span className="rb-form-req">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Yulian Agus"
                  className="rb-form-input"
                  required
                />
              </div>

              <div className="rb-form-group">
                <label htmlFor="brand_name" className="rb-form-label">
                  Nama Brand / Studio
                </label>
                <input
                  id="brand_name"
                  name="brand_name"
                  type="text"
                  value={form.brand_name}
                  onChange={handleChange}
                  placeholder="Ruang Bahagia Photography"
                  className="rb-form-input"
                />
              </div>
            </div>

            {/* Handle / Username with Live URL Preview */}
            <div className="rb-form-group">
              <label htmlFor="username" className="rb-form-label">
                Pilih Username Handle <span className="rb-form-req">*</span>
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
              <p className="rb-handle-preview">
                Link profil publik Anda: <strong>ruangbahagia.web.id/@{form.username || 'username'}</strong>
              </p>
            </div>

            <div className="rb-form-row">
              <div className="rb-form-group">
                <label htmlFor="email" className="rb-form-label">
                  Email <span className="rb-form-req">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="fotografer@domain.com"
                  className="rb-form-input"
                  required
                />
              </div>

              <div className="rb-form-group">
                <label htmlFor="password" className="rb-form-label">
                  Kata Sandi <span className="rb-form-req">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  className="rb-form-input"
                  required
                />
              </div>
            </div>

            <div className="rb-form-row">
              <div className="rb-form-group">
                <label htmlFor="phone" className="rb-form-label">
                  Nomor WhatsApp
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="081234567890"
                  className="rb-form-input"
                />
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
                  placeholder="Jakarta / Yogyakarta"
                  className="rb-form-input"
                />
              </div>
            </div>

            {error && (
              <div className="rb-form-error" role="alert">
                <span>⚠️ {error}</span>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={!form.name || !form.username || !form.email || !form.password}
            >
              Daftar & Masuk ke Dasbor Studio &rarr;
            </Button>

            <div className="rb-register-footer">
              <span>Sudah memiliki akun studio? </span>
              <Link to="/login" className="rb-register-login-link">
                Masuk ke sini
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
