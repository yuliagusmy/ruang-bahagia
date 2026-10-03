import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import './AuthCallbackPage.css'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [status, setStatus] = useState('processing') // 'processing' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('')
  const processedRef = useRef(false)

  useEffect(() => {
    // Cegah multi-invoke / render loop dari React Router atau React 18
    if (processedRef.current) return

    const token = searchParams.get('token')
    const authError = searchParams.get('auth_error')
    const userParam = searchParams.get('user')

    if (authError) {
      processedRef.current = true
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
      processedRef.current = true
      setStatus('error')
      setErrorMessage('Token autentikasi tidak ditemukan.')
      return
    }

    processedRef.current = true

    // Parse user jika disertakan di URL query param
    let initialUser = { name: 'Fotografer' }
    if (userParam) {
      try {
        initialUser = JSON.parse(userParam)
      } catch {
        try {
          initialUser = JSON.parse(decodeURIComponent(userParam))
        } catch {
          // ignore
        }
      }
    }

    // Set auth langsung agar store dan request berikutnya langsung valid
    setAuth(token, initialUser)
    setStatus('success')

    // Lakukan verifikasi profil di latar belakang (tidak memblokir navigasi)
    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const freshUser = res.data?.data || res.data
        if (freshUser) {
          useAuthStore.getState().setUser(freshUser)
        }
      })
      .catch(() => {
        // Abaikan jika verifikasi me di latar belakang gagal sementara
      })

    // Navigasi mulus ke dashboard
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true })
    }, 400)

    return () => clearTimeout(timer)
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
