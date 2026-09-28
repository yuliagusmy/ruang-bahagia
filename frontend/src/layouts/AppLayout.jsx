import { Outlet, Navigate } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import AppHeader from '../components/layout/AppHeader'
import DesktopSidebar from '../components/layout/DesktopSidebar'
import { useAuthStore } from '../stores/authStore'
import './AppLayout.css'

/**
 * AppLayout — wrapper halaman fotografer
 * Mobile: AppHeader + BottomNav
 * Desktop: DesktopSidebar + Spacious Content Area
 */
export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="rb-app-layout">
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
