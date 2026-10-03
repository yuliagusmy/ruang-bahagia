import { useEffect, useRef } from 'react'
import { Outlet, Navigate, useSearchParams } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import AppHeader from '../components/layout/AppHeader'
import DesktopSidebar from '../components/layout/DesktopSidebar'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import { registerPushSubscription } from '../services/pushNotifications'
import './AppLayout.css'

/**
 * AppLayout — wrapper halaman fotografer (dashboard & CRM).
 *
 * Menggunakan class .rb-themed + data-theme untuk scope tema fotografer.
 * Tema HANYA berlaku di dalam div ini — tidak mempengaruhi landing page
 * atau halaman publik platform lainnya.
 *
 * Mobile: AppHeader + BottomNav
 * Desktop: DesktopSidebar + Spacious Content Area
 */
export default function AppLayout() {
  const [searchParams] = useSearchParams()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setAuth = useAuthStore((s) => s.setAuth)
  const { activeTheme, applyToElement } = useThemeStore()
  const layoutRef = useRef(null)

  // Pulihkan auth jika terdapat auth_token di URL (misal redirect callback Google OAuth)
  const urlAuthToken = searchParams.get('auth_token')
  const urlUserParam = searchParams.get('user')
  if (urlAuthToken && !isAuthenticated) {
    try {
      let parsedUser = null
      if (urlUserParam) {
        try {
          parsedUser = JSON.parse(urlUserParam)
        } catch {
          parsedUser = JSON.parse(decodeURIComponent(urlUserParam))
        }
      }
      setAuth(urlAuthToken, parsedUser)
      // Bersihkan parameter dari URL agar address bar tetap rapi
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('auth_token')
      cleanUrl.searchParams.delete('user')
      window.history.replaceState({}, document.title, cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ''))
    } catch {
      // ignore
    }
  }

  const effectiveAuth = isAuthenticated || !!urlAuthToken

  // Apply tema ke div ini setiap kali activeTheme berubah
  useEffect(() => {
    applyToElement(layoutRef.current)
  }, [activeTheme, applyToElement])

  // Daftarkan Web Push Notifications saat fotografer masuk (sekali per sesi)
  useEffect(() => {
    if (!effectiveAuth) return
    const registered = sessionStorage.getItem('rb_push_registered')
    if (!registered) {
      registerPushSubscription()
        .then((res) => {
          if (res.success) {
            sessionStorage.setItem('rb_push_registered', '1')
          }
        })
        .catch(() => {})
    }
  }, [effectiveAuth])

  if (!effectiveAuth) return <Navigate to="/login" replace />

  return (
    <div className="rb-app-layout rb-themed" ref={layoutRef} data-theme={activeTheme}>
      <DesktopSidebar />
      <div className="rb-app-layout__content">
        <AppHeader />
        <main className="rb-app-layout__main">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
