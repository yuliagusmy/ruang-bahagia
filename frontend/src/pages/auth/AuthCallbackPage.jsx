import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import './AuthCallbackPage.css'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [status, setStatus] = useState('processing') // 'processing' | 'error'
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const authError = searchParams.get('auth_error')

    if (authError) {
      setStatus('error')
      let message = 'Autentikasi dengan akun Google dibatalkan atau mengalami kendala.'
      if (authError.includes('redirect_uri_mismatch')) {
        message = 'URI Redirect Google belum cocok di Google Cloud Console. Silakan hubungi admin.'
      } else if (authError.includes('access_denied')) {
        message = 'Izin login Google ditolak oleh pengguna.'
      } else if (authError) {
        message = `Kendala Google: ${authError}`
      }
      setErrorMessage(message)
      return
    }

    if (!token) {
      setStatus('error')
      setErrorMessage('Token autentikasi tidak ditemukan.')
      return
    }

    const processLogin = async () => {
      try {
        // Simpan token sementara di header axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        // Ambil data profil terbaru
        const res = await api.get('/auth/me')
        const user = res.data?.data || res.data

        setAuth(token, user)
        setStatus('success')

        // Redirect mulus ke dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 600)
      } catch (err) {
        // Tetap simpan token jika network me gagal
        setAuth(token, { name: 'Fotografer' })
        navigate('/dashboard', { replace: true })
      }
    }

    processLogin()
  }, [searchParams, navigate, setAuth])

  return (
    <div className="rb-auth-callback">
      <div className="rb-auth-callback__card">
        <img
          src="/logo.jpg"
          alt="Ruang Bahagia Logo"
          className="rb-auth-callback__logo"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />

        {status === 'processing' && (
          <div className="rb-auth-callback__state">
            <div className="rb-auth-callback__spinner" aria-hidden="true" />
            <h2 className="rb-auth-callback__title">Menghubungkan Akun Google</h2>
            <p className="rb-auth-callback__desc">
              Sedang menyiapkan dasbor studio fotografer Anda. Harap tunggu sebentar...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="rb-auth-callback__state">
            <div className="rb-auth-callback__check" aria-hidden="true">✓</div>
            <h2 className="rb-auth-callback__title">Berhasil Terhubung!</h2>
            <p className="rb-auth-callback__desc">Mengarahkan Anda ke dasbor studio...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="rb-auth-callback__state">
            <div className="rb-auth-callback__error-icon" aria-hidden="true">⚠️</div>
            <h2 className="rb-auth-callback__title">Gagal Masuk</h2>
            <p className="rb-auth-callback__error-desc">{errorMessage}</p>

            <div className="rb-auth-callback__actions">
              <Link to="/login" className="rb-auth-callback__btn">
                Kembali ke Halaman Masuk
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
