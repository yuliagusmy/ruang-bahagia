import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import './LoginPage.css'

/**
 * LoginPage — akses portal fotografer
 * Responsive: split-screen elegan di desktop, mobile-first card di layar ponsel
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      setAuth(data.token, data.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    setAuth('demo-token', {
      id: 1,
      name: 'Yulian',
      brand_name: 'Ruang Bahagia Studio',
      email: 'fotografer@ruangbahagia.com',
    })
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="login-page">
      {/* ── Brand Hero Showcase (Kiri pada Desktop) ── */}
      <div className="login-page__hero">
        <div className="login-page__hero-content">
          <Link to="/" className="login-page__back-link" title="Kembali ke Beranda">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="login-page__hero-top">
            <img src="/logo.jpg" alt="Ruang Bahagia Logo" className="login-page__hero-logo" />
            <div className="login-page__hero-badge">Portal Fotografer</div>
          </div>

          <h1 className="login-page__headline">
            Ruang<br /><em>Bahagia</em>
          </h1>

          <p className="login-page__sub">
            Tempat di mana setiap sesi, jadwal, dan cerita bahagia klien Anda dikelola dengan rapi dan berhati.
          </p>

          <div className="login-page__desktop-features" aria-hidden="true">
            <div className="login-page__feature-item">
              <span className="login-page__feature-icon">✦</span>
              <span>Katalog paket & jadwal otomatis tersinkron</span>
            </div>
            <div className="login-page__feature-item">
              <span className="login-page__feature-icon">✦</span>
              <span>Client proofing dengan swipe-style modern</span>
            </div>
            <div className="login-page__feature-item">
              <span className="login-page__feature-icon">✦</span>
              <span>Pencatatan pembayaran & riwayat DP akurat</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form Card (Kanan pada Desktop) ── */}
      <div className="login-page__form-section">
        <div className="login-page__card">
          <div className="login-page__card-header">
            <h2 className="login-page__form-title">Masuk ke Dasbor</h2>
            <p className="login-page__form-desc">
              Silakan masukkan akun fotografer untuk mengelola sesi dan klien.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="login-page__field">
              <label htmlFor="email" className="login-page__label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="fotografer@ruangbahagia.com"
                className="login-page__input"
                required
              />
            </div>

            <div className="login-page__field">
              <label htmlFor="password" className="login-page__label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="login-page__input"
                required
              />
            </div>

            {error && (
              <p className="login-page__error" role="alert">{error}</p>
            )}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={!form.email || !form.password}
            >
              Masuk ke Dasbor
            </Button>

            <div className="login-page__divider">
              <span>atau</span>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="login-page__demo-btn"
            >
              Masuk Cepat Mode Demo
            </button>

            <div className="login-page__register-prompt" style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--rb-color-muted)' }}>
              <span>Belum punya akun studio? </span>
              <Link to="/register" style={{ color: 'var(--rb-color-terracotta)', fontWeight: '600', textDecoration: 'none' }}>
                Daftar Gratis &rarr;
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
