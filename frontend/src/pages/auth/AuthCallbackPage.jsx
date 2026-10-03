import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import './AuthCallbackPage.css'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const processedRef = useRef(false)

  const [status, setStatus] = useState('processing') // 'processing' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    const token = searchParams.get('token')
    const userParam = searchParams.get('user')
    const authError = searchParams.get('auth_error')

    if (authError) {
      setStatus('error')
      let message = 'Autentikasi dengan akun Google dibatalkan atau mengalami kendala.'
      if (authError.includes('redirect_uri_mismatch')) {
        message = 'URI Redirect Google belum cocok di Google Cloud Console. Silakan hubungi admin.'
      } else if (authError.includes('access_denied')) {
        message = 'Izin login Google ditolak oleh pengguna.'
      } else {
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

    // Ekstrak data user jika dikirim langsung oleh server
    let parsedUser = null
    if (userParam) {
      try {
        parsedUser = JSON.parse(decodeURIComponent(userParam))
      } catch {
        try {
          parsedUser = JSON.parse(userParam)
        } catch {
          // ignore
        }
      }
    }

    const processLogin = async () => {
      try {
        // Segera simpan auth agar request selanjutnya otomatis menyertakan token
        setAuth(token, parsedUser || { name: 'Fotografer' })

        // Jika user belum ada dari parameter, fetch dari /auth/me
        if (!parsedUser) {
          const res = await api.get('/auth/me')
          const userData = res.data?.data || res.data
          setAuth(token, userData)
        }

        setStatus('success')
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 500)
      } catch (err) {
        if (err.response?.status === 401) {
          useAuthStore.getState().logout()
          setStatus('error')
          setErrorMessage('Token autentikasi kedaluwarsa atau tidak valid. Silakan coba masuk kembali.')
          return
        }

        // Jika hanya kegagalan jaringan sementara tetapi token ada, tetap arahkan ke dashboard
        setStatus('success')
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 500)
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
