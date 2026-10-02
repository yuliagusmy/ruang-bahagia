import { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useNotifStore } from '../../stores/notifStore'
import BottomSheet from '../ui/BottomSheet'
import PlatformGuideModal from '../common/PlatformGuideModal'
import NotificationSheet from './NotificationSheet'
import './AppHeader.css'

const TITLES = {
  '/dashboard': 'Ruang Bahagia',
  '/bookings':  'Booking',
  '/clients':   'Klien',
  '/schedule':  'Jadwal',
  '/portfolio': 'Galeri',
  '/packages':  'Paket Layanan',
  '/proofing':  'Proofing Klien',
}

/**
 * AppHeader — header navigasi atas aplikasi
 * Fitur:
 * - Logo kiri: pintasan langsung ke Web Klien / Beranda Publik
 * - Judul halaman dinamis di tengah
 * - Bell notifikasi: membuka NotificationSheet dengan live badge
 * - Avatar kanan: membuka Bottom Sheet profil studio & tombol logout
 */
export default function AppHeader({ title, showBack, onBack }) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { unreadCount, fetchNotifications } = useNotifStore()

  const [profileOpen, setProfileOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  // Ambil data notifikasi saat mount dan berkala setiap 60 detik
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const pageTitle = title || TITLES[location.pathname] || 'Ruang Bahagia'
  const isDashboard = location.pathname === '/dashboard'

  const handleLogout = () => {
    setProfileOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const handleNavClick = (path) => {
    setProfileOpen(false)
    navigate(path)
  }

  return (
    <>
      <header className="rb-header" role="banner">
        {showBack ? (
          <button className="rb-header__back" onClick={onBack} aria-label="Kembali">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        ) : (
          <Link
            to="/"
            className="rb-header__brand-link"
            title="Kunjungi Beranda Web Klien"
            aria-label="Kunjungi Beranda Web Klien"
          >
            <img src="/logo.jpg" alt="Ruang Bahagia" className="rb-header__logo-img" />
            <span className="rb-header__client-pill">Web Klien</span>
          </Link>
        )}

        <h1 className={`rb-header__title ${isDashboard ? 'rb-header__title--display' : ''}`}>
          {pageTitle}
        </h1>

        <div className="rb-header__actions">
          <button
            type="button"
            className="rb-header__notif-btn"
            onClick={() => setNotifOpen(true)}
            aria-label={`Pusat Notifikasi (${unreadCount} belum dibaca)`}
            title="Pusat Notifikasi"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="rb-header__notif-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="rb-header__avatar-btn"
            onClick={() => setProfileOpen(true)}
            aria-label={`Menu Akun ${user?.name || 'Fotografer'}`}
            title="Menu Akun & Studio"
          >
            <div className="rb-header__avatar">
              {user?.avatar_path ? (
                <img src={user.avatar_path} alt={user.name} />
              ) : (
                <span>{user?.name?.[0]?.toUpperCase() || 'F'}</span>
              )}
            </div>
            <span className="rb-header__avatar-indicator" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ── Modal Notifikasi In-App ────────────────────────── */}
      <NotificationSheet
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />

      {/* ── Bottom Sheet Profil Fotografer ──────────────────────── */}
      <BottomSheet
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Menu Studio"
      >
        <div className="rb-profile-menu">
          {/* Identitas Fotografer */}
          <div className="rb-profile-menu__user-card">
            <div className="rb-profile-menu__avatar-large">
              {user?.avatar_path ? (
                <img src={user.avatar_path} alt={user.name} />
              ) : (
                <span>{user?.name?.[0]?.toUpperCase() || 'F'}</span>
              )}
            </div>
            <div className="rb-profile-menu__user-info">
              <h4 className="rb-profile-menu__user-name">{user?.name || 'Fotografer'}</h4>
              <p className="rb-profile-menu__user-brand">{user?.brand_name || 'Ruang Bahagia Studio'}</p>
              <p className="rb-profile-menu__user-email">{user?.email || 'fotografer@ruangbahagia.com'}</p>
              <span className="rb-profile-menu__badge">Portal Fotografer Aktif</span>
            </div>
          </div>

          {/* Navigasi Cepat & Manajemen Studio */}
          <div className="rb-profile-menu__section">
            <h5 className="rb-profile-menu__section-title">Manajemen Studio</h5>
            <div className="rb-profile-menu__list">
              <button
                type="button"
                className="rb-profile-menu__item"
                onClick={() => {
                  setProfileOpen(false)
                  if (user?.username) {
                    window.open(`/@${user.username}`, '_blank')
                  } else {
                    navigate('/')
                  }
                }}
              >
                <div className="rb-profile-menu__icon rb-profile-menu__icon--green">🌐</div>
                <div className="rb-profile-menu__text">
                  <strong>Profil Publik ({user?.username ? `@${user.username}` : 'Studio'}) ↗</strong>
                  <span>Tampilan portofolio & booking yang dilihat klien</span>
                </div>
                <span className="rb-profile-menu__arrow">›</span>
              </button>

              <button
                type="button"
                className="rb-profile-menu__item"
                onClick={() => handleNavClick('/settings')}
              >
                <div className="rb-profile-menu__icon rb-profile-menu__icon--stone">⚙️</div>
                <div className="rb-profile-menu__text">
                  <strong>Pengaturan Studio</strong>
                  <span>Ubah nama, handle @username, bio, & WhatsApp DP</span>
                </div>
                <span className="rb-profile-menu__arrow">›</span>
              </button>

              <button
                type="button"
                className="rb-profile-menu__item"
                onClick={() => handleNavClick('/packages')}
              >
                <div className="rb-profile-menu__icon rb-profile-menu__icon--amber">📦</div>
                <div className="rb-profile-menu__text">
                  <strong>Paket Layanan</strong>
                  <span>Atur harga, kuota, & rincian paket foto</span>
                </div>
                <span className="rb-profile-menu__arrow">›</span>
              </button>

              <button
                type="button"
                className="rb-profile-menu__item"
                onClick={() => handleNavClick('/portfolio')}
              >
                <div className="rb-profile-menu__icon rb-profile-menu__icon--warm">🖼️</div>
                <div className="rb-profile-menu__text">
                  <strong>Galeri Portofolio</strong>
                  <span>Kelola foto karya & preview klien</span>
                </div>
                <span className="rb-profile-menu__arrow">›</span>
              </button>

              <button
                type="button"
                className="rb-profile-menu__item"
                onClick={() => handleNavClick('/proofing')}
              >
                <div className="rb-profile-menu__icon rb-profile-menu__icon--amber">✨</div>
                <div className="rb-profile-menu__text">
                  <strong>Tools Proofing Klien</strong>
                  <span>Kirim link swipe foto mandiri & ekspor Lightroom</span>
                </div>
                <span className="rb-profile-menu__arrow">›</span>
              </button>

              <button
                type="button"
                className="rb-profile-menu__item"
                onClick={() => handleNavClick('/subscription')}
              >
                <div className="rb-profile-menu__icon rb-profile-menu__icon--green">⭐</div>
                <div className="rb-profile-menu__text">
                  <strong>Langganan & Kuota Pro ✦</strong>
                  <span>Kapasitas tanpa batas & fitur studio</span>
                </div>
                <span className="rb-profile-menu__arrow">›</span>
              </button>

              <button
                type="button"
                className="rb-profile-menu__item"
                onClick={() => {
                  setProfileOpen(false)
                  setGuideOpen(true)
                }}
              >
                <div className="rb-profile-menu__icon rb-profile-menu__icon--amber">📖</div>
                <div className="rb-profile-menu__text">
                  <strong>Panduan Platform</strong>
                  <span>Alur kerja booking, DP QRIS, & swipe proofing</span>
                </div>
                <span className="rb-profile-menu__arrow">›</span>
              </button>
            </div>
          </div>

          {/* Tombol Logout */}
          <div className="rb-profile-menu__footer">
            <button
              type="button"
              className="rb-profile-menu__logout-btn"
              onClick={handleLogout}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── Modal Panduan Platform ──────────────────── */}
      <PlatformGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        defaultTab="photographer"
      />
    </>
  )
}
