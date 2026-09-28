import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import './DesktopSidebar.css'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Beranda',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    to: '/bookings',
    label: 'Daftar Booking',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    to: '/clients',
    label: 'Klien (CRM)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    to: '/schedule',
    label: 'Kalender Jadwal',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    to: '/packages',
    label: 'Paket Layanan',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    ),
  },
  {
    to: '/portfolio',
    label: 'Galeri Portofolio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
]

export default function DesktopSidebar() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="rb-desktop-sidebar" aria-label="Navigasi Desktop">
      <div className="rb-desktop-sidebar__top">
        <Link to="/dashboard" className="rb-desktop-sidebar__brand">
          <img src="/logo.jpg" alt="Ruang Bahagia Logo" className="rb-desktop-sidebar__logo-img" />
          <div>
            <h2 className="rb-desktop-sidebar__brand-name">Ruang Bahagia</h2>
            <span className="rb-desktop-sidebar__brand-role">Portal Fotografer</span>
          </div>
        </Link>

        <div className="rb-desktop-sidebar__user">
          <div className="rb-desktop-sidebar__avatar">
            {user?.name?.[0]?.toUpperCase() || 'F'}
          </div>
          <div className="rb-desktop-sidebar__user-info">
            <span className="rb-desktop-sidebar__user-name">{user?.name || 'Fotografer'}</span>
            <span className="rb-desktop-sidebar__user-brand">{user?.brand_name || 'Studio'}</span>
          </div>
        </div>

        <nav className="rb-desktop-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rb-desktop-sidebar__nav-item ${isActive ? 'rb-desktop-sidebar__nav-item--active' : ''}`
              }
            >
              <span className="rb-desktop-sidebar__nav-icon">{item.icon}</span>
              <span className="rb-desktop-sidebar__nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="rb-desktop-sidebar__bottom">
        <Link to="/" target="_blank" rel="noreferrer" className="rb-desktop-sidebar__link-public">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Lihat Web Klien ↗
        </Link>

        <button onClick={handleLogout} className="rb-desktop-sidebar__btn-logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Keluar
        </button>
      </div>
    </aside>
  )
}
