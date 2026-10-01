import { useEffect, useRef } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import AppHeader from '../components/layout/AppHeader'
import DesktopSidebar from '../components/layout/DesktopSidebar'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { activeTheme, applyToElement } = useThemeStore()
  const layoutRef = useRef(null)

  // Apply tema ke div ini setiap kali activeTheme berubah
  useEffect(() => {
    applyToElement(layoutRef.current)
  }, [activeTheme, applyToElement])

  if (!isAuthenticated) return <Navigate to="/login" replace />

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
