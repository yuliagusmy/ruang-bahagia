import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import './LoginPage.css'

/**
 * LoginPage — akses portal fotografer
 * Eksklusif login dengan akun Google (1-klik instan & aman)
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const authError = searchParams.get('auth_error')
    if (authError) {
      if (authError.includes('redirect_uri_mismatch')) {
        setError('URI Redirect Google belum cocok di Google Cloud Console. Silakan periksa konfigurasi redirect URI.')
      } else if (authError.includes('access_denied')) {
        setError('Proses login Google dibatalkan.')
      } else {
        setError(`Kendala login Google: ${authError}`)
      }
    }
  }, [searchParams])

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true)
    setError('')
    try {
      const res = await api.get('/auth/google/url?mode=login')
      const authUrl = res.data?.data?.url
      if (authUrl) {
        window.location.href = authUrl
      } else {
        window.location.href = '/api/auth/google/redirect?mode=login'
      }
    } catch (err) {
      setLoadingGoogle(false)
      const resMsg = err.response?.data?.message
      if (err.response?.status === 404) {
        setError('Server backend sedang memproses pembaruan sistem (deploying). Silakan coba 1 menit lagi.')
      } else {
        setError(resMsg || 'Gagal memulai koneksi Google. Pastikan jaringan internet aktif.')
      }
    }
  }

  const handleDemoLogin = () => {
    setAuth('demo-token', {
      id: 1,
      name: 'Yulian Agus',
      brand_name: 'Ruang Bahagia Studio',
      username: 'yuliagus',
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

      {/* ── Google Login Section (Kanan pada Desktop) ── */}
      <div className="login-page__form-section">
        {/* Mobile Header (Khusus Mobile < 900px) */}
        <div className="login-page__mobile-header">
          <Link to="/" className="login-page__mobile-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="login-page__mobile-brand">
            <img src="/logo.jpg" alt="Ruang Bahagia Logo" className="login-page__mobile-logo" />
            <div className="login-page__mobile-brand-text">
              <h2 className="login-page__mobile-title">Ruang Bahagia</h2>
              <span className="login-page__mobile-badge">Portal Fotografer</span>
            </div>
          </div>
        </div>

        <div className="login-page__card">
          <div className="login-page__card-header">
            <div className="rb-google-lock-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Autentikasi Aman Google</span>
            </div>
            <h2 className="login-page__form-title">Masuk ke Dasbor</h2>
            <p className="login-page__form-desc">
              Gunakan akun Google studio terdaftar Anda untuk akses instan dan aman.
            </p>
          </div>

          {error && (
            <div className="login-page__error" role="alert">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Tombol Utama: Masuk dengan Google */}
          <button
            type="button"
            className="rb-google-btn"
            onClick={handleGoogleLogin}
            disabled={loadingGoogle}
          >
            {loadingGoogle ? (
              <div className="rb-btn-spinner" aria-hidden="true" />
            ) : (
              <svg className="rb-google-icon" width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loadingGoogle ? 'Mengarahkan ke Google...' : 'Masuk dengan Akun Google'}</span>
          </button>

          <div className="login-page__divider">
            <span>atau</span>
          </div>

          <div className="login-page__register-prompt">
            <span>Belum memiliki akun studio? </span>
            <Link to="/register">
              Daftar Akun Google &rarr;
            </Link>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="login-page__demo-btn"
          >
            Masuk Cepat Mode Demo
          </button>
        </div>
      </div>
    </div>
  )
}
