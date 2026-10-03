import { useState, useEffect } from 'react'
import { useSearchParams, Link, useLocation, Navigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import './LoginPage.css'

/**
 * LoginPage — Portal Akses & Pendaftaran Studio Fotografer (Unified Auth)
 * Satu pintu instan dengan akun Google:
 * - Pengguna baru otomatis terdaftar & mendapatkan Starter Pack + 20 Hari Trial Pro
 * - Fotografer terdaftar langsung login masuk ke Dasbor Studio
 */
export default function LoginPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const isRegisterRoute = location.pathname === '/register'

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
        setError(`Kendala autentikasi Google: ${authError}`)
      }
    }
  }, [searchParams])

  const handleGoogleAuth = async () => {
    setLoadingGoogle(true)
    setError('')
    try {
      // Backend GoogleAuthService menangani login sekaligus auto-registrasi jika baru
      const res = await api.get('/auth/google/url?mode=unified')
      const authUrl = res.data?.data?.url
      if (authUrl) {
        window.location.href = authUrl
      } else {
        window.location.href = '/api/auth/google/redirect?mode=unified'
      }
    } catch (err) {
      setLoadingGoogle(false)
      const resMsg = err.response?.data?.message
      if (err.response?.status === 404) {
        setError('Server backend sedang memproses pembaruan sistem. Silakan coba 1 menit lagi.')
      } else {
        setError(resMsg || 'Gagal memulai koneksi Google. Pastikan jaringan internet aktif.')
      }
    }
  }

  return (
    <div className="rb-auth-page">
      {/* ── Sisi Kiri: Editorial Luxury Showcase (Desktop) ────────── */}
      <div className="rb-auth-hero">
        <div className="rb-auth-hero__backdrop" />
        <div className="rb-auth-hero__overlay" />

        <div className="rb-auth-hero__content">
          <Link to="/" className="rb-auth-back-link" title="Kembali ke Beranda">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="rb-auth-brand-row">
            <img src="/logo.jpg" alt="Ruang Bahagia Logo" className="rb-auth-hero-logo" />
            <div>
              <span className="rb-auth-hero-tag">Platform Fotografer Indonesia</span>
              <h1 className="rb-auth-hero-title">
                Ruang <em>Bahagia</em>
              </h1>
            </div>
          </div>

          <p className="rb-auth-hero-desc">
            Satu tempat di mana setiap sesi, jadwal reservasi, dan karya cerita bahagia klien Anda dikelola secara anggun, profesional, dan berhati.
          </p>

          {/* Frosted Glass Mockup Card */}
          <div className="rb-auth-glass-card">
            <div className="rb-auth-glass-card__header">
              <div className="rb-auth-glass-card__avatar">Y</div>
              <div>
                <strong>Yuliagus M. Yunus Photography</strong>
                <span>Studio Terverifikasi ✦</span>
              </div>
            </div>
            <p className="rb-auth-glass-card__quote">
              &ldquo;Seleksi foto klien dari Google Drive jadi 5x lebih cepat dengan swipe proofing, dan DP otomatis tercatat rapi.&rdquo;
            </p>
            <div className="rb-auth-glass-card__footer">
              <span className="rb-auth-glass-badge">✦ Free Trial Pro 10 Hari Aktif</span>
            </div>
          </div>

          <div className="rb-auth-features-list">
            <div className="rb-auth-feature-item">
              <span className="rb-auth-feature-icon">✦</span>
              <span>Website profil & portofolio eksklusif (<code>/@username</code>)</span>
            </div>
            <div className="rb-auth-feature-item">
              <span className="rb-auth-feature-icon">✦</span>
              <span>Client proofing swipe-style interaktif dari Google Drive</span>
            </div>
            <div className="rb-auth-feature-item">
              <span className="rb-auth-feature-icon">✦</span>
              <span>Reservasi mandiri klien, barcode QRIS & kwitansi digital</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sisi Kanan: Unified Auth Card (Sand/Terracotta) ────────── */}
      <div className="rb-auth-form-section">
        {/* Mobile Top Header */}
        <div className="rb-auth-mobile-header">
          <Link to="/" className="rb-auth-mobile-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="rb-auth-mobile-brand">
            <img src="/logo.jpg" alt="Ruang Bahagia Logo" className="rb-auth-mobile-logo" />
            <div>
              <span className="rb-auth-mobile-badge">Portal Studio Fotografer</span>
              <h2 className="rb-auth-mobile-title">Ruang Bahagia</h2>
            </div>
          </div>
        </div>

        <div className="rb-auth-card">
          <div className="rb-auth-card__header">
            <div className="rb-auth-status-pill">
              <span className="rb-auth-pill-dot" />
              <span>Akses Studio & Pendaftaran Fotografer</span>
            </div>

            <h2 className="rb-auth-title">
              {isRegisterRoute ? 'Daftarkan Studio Anda' : 'Masuk ke Dasbor Studio'}
            </h2>
            <p className="rb-auth-desc">
              Satu klik aman dengan akun Google untuk mengelola portofolio, jadwal, dan galeri klien Anda.
            </p>
          </div>

          {error && (
            <div className="rb-auth-error-alert" role="alert">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Tombol Utama Unified Google Auth */}
          <button
            type="button"
            className="rb-auth-google-btn"
            onClick={handleGoogleAuth}
            disabled={loadingGoogle}
          >
            {loadingGoogle ? (
              <div className="rb-auth-spinner" aria-hidden="true" />
            ) : (
              <svg className="rb-auth-google-svg" width="22" height="22" viewBox="0 0 24 24">
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
            <span>
              {loadingGoogle ? 'Mengarahkan ke Google...' : 'Lanjutkan dengan Akun Google'}
            </span>
          </button>

          {/* Jaminan Kenyamanan Otomatis */}
          <div className="rb-auth-guarantees">
            <div className="rb-auth-guarantee-item">
              <span className="rb-auth-check">✓</span>
              <span><strong>Pengguna Baru:</strong> Otomatis terdaftar + 10 hari Trial Pro gratis</span>
            </div>
            <div className="rb-auth-guarantee-item">
              <span className="rb-auth-check">✓</span>
              <span><strong>Pengguna Terdaftar:</strong> Langsung diarahkan ke dasbor studio Anda</span>
            </div>
            <div className="rb-auth-guarantee-item">
              <span className="rb-auth-check">✓</span>
              <span>Tanpa kartu kredit & tanpa instalasi aplikasi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
