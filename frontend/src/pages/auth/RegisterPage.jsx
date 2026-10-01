import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import './RegisterPage.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSignup = async () => {
    setLoadingGoogle(true)
    setError('')

    try {
      // Ambil Google authorization URL dari API
      const res = await api.get('/auth/google/url?mode=register')
      const authUrl = res.data?.data?.url

      if (authUrl) {
        window.location.href = authUrl
      } else {
        // Fallback jika API redirect langsung
        window.location.href = '/api/auth/google/redirect?mode=register'
      }
    } catch (err) {
      setLoadingGoogle(false)
      const msg = err.response?.data?.message || 'Gagal memulai koneksi Google. Pastikan jaringan internet aktif.'
      setError(msg)
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
              <span className="rb-register-badge">Pendaftaran Terverifikasi</span>
              <h1 className="rb-register-hero__title">
                Portal Studio Fotografer Profesional
              </h1>
            </div>
          </div>

          <p className="rb-register-hero__lead">
            Satu klik akun Google untuk membuka portal portofolio pribadi, sistem booking mandiri dengan QRIS, dan seleksi foto interaktif klien.
          </p>

          <div className="rb-register-features">
            <div className="rb-reg-feat">
              <span className="rb-reg-feat__icon">✦</span>
              <div>
                <strong>Email 100% Terverifikasi Asli</strong>
                <p>Pendaftaran aman langsung terhubung dengan identitas Google resmi tanpa risiko akun palsu.</p>
              </div>
            </div>
            <div className="rb-reg-feat">
              <span className="rb-reg-feat__icon">✦</span>
              <div>
                <strong>Domain & Handle Pribadi</strong>
                <p>Otomatis mendapatkan URL publik seperti ruangbahagia.web.id/@studio untuk bio media sosial.</p>
              </div>
            </div>
            <div className="rb-reg-feat">
              <span className="rb-reg-feat__icon">✦</span>
              <div>
                <strong>100% Siap di Ponsel</strong>
                <p>Kelola jadwal, DP klien, dan galeri karya langsung dari kenyamanan smartphone Anda.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Google Registration Section (Kanan pada Desktop) ── */}
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
              <span className="rb-register-mobile-badge">Daftar Studio Fotografer</span>
            </div>
          </div>
        </div>

        <div className="rb-register-card">
          <div className="rb-register-card__header">
            <div className="rb-google-lock-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Autentikasi Terverifikasi Google</span>
            </div>
            <h2 className="rb-register-card__title">Buka Studio Fotografer</h2>
            <p className="rb-register-card__sub">
              Pendaftaran resmi kini dibuka eksklusif melalui akun Google demi keamanan data studio dan verifikasi email asli fotografer.
            </p>
          </div>

          <div className="rb-google-signup-flow">
            {/* Benefit highlights */}
            <div className="rb-google-benefits">
              <div className="rb-google-benefit-item">
                <span className="rb-google-benefit-check">✓</span>
                <span><strong>1-Klik Instan:</strong> Tidak perlu mengingat sandi atau mengisi form berbelit.</span>
              </div>
              <div className="rb-google-benefit-item">
                <span className="rb-google-benefit-check">✓</span>
                <span><strong>Handle Otomatis:</strong> Langsung dapatkan link profil publik untuk calon klien.</span>
              </div>
              <div className="rb-google-benefit-item">
                <span className="rb-google-benefit-check">✓</span>
                <span><strong>Aman & Bebas Spam:</strong> Melindungi reputasi platform dan portofolio Anda.</span>
              </div>
            </div>

            {error && (
              <div className="rb-form-error" role="alert">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Tombol Utama: Daftar dengan Google */}
            <button
              type="button"
              className="rb-google-btn"
              onClick={handleGoogleSignup}
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
              <span>{loadingGoogle ? 'Mengarahkan ke Google...' : 'Daftar dengan Akun Google'}</span>
            </button>

            <p className="rb-register-terms">
              Dengan mendaftar, Anda menyetujui ketentuan layanan dan kebijakan privasi ruangbahagia.web.id.
            </p>

            <div className="rb-register-divider">
              <span>atau</span>
            </div>

            <div className="rb-register-footer">
              <span>Sudah memiliki akun studio? </span>
              <Link to="/login" className="rb-register-login-link">
                Masuk ke Dasbor &rarr;
              </Link>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="rb-register-demo-btn"
            >
              Masuk Cepat Mode Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
