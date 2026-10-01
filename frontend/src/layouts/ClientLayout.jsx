import { Outlet, Link, useLocation } from 'react-router-dom'
import './ClientLayout.css'

/**
 * ClientLayout — wrapper halaman publik klien (landing page, booking katalog, proofing)
 * Header responsif disejajarkan dengan batas konten halaman
 */
export default function ClientLayout() {
  const location = useLocation()
  const isBookPage = location.pathname === '/book'

  // Cek apakah sedang melihat profil publik fotografer (misal /@yuliagusmy atau /p/yuliagusmy atau /yuliagusmy)
  const isStaticRoute = ['/', '/book', '/login', '/register', '/auth/callback'].includes(location.pathname)
  const isSubRoute = location.pathname.startsWith('/proof/') || location.pathname.startsWith('/delivery/') || location.pathname.startsWith('/invoice/')
  
  const profileMatch = (!isStaticRoute && !isSubRoute)
    ? location.pathname.replace(/^\/p\//, '/').match(/^\/@?([a-zA-Z0-9_-]+)$/)
    : null
  const currentPhotographerHandle = profileMatch ? profileMatch[1] : null

  const bookUrl = currentPhotographerHandle
    ? `/book?photographer=${currentPhotographerHandle}`
    : '/book'

  return (
    <div className="rb-client-layout">
      <header className="rb-client-header">
        <div className="rb-client-header__inner">
          <Link to="/" className="rb-client-header__brand">
            <img src="/logo.jpg" alt="Ruang Bahagia Logo" className="rb-client-header__logo-img" />
            <span className="rb-client-header__title">Ruang Bahagia</span>
          </Link>

          <nav className="rb-client-header__nav">
            {!isBookPage ? (
              <Link to={bookUrl} className="rb-client-header__btn-book">
                Reservasi
              </Link>
            ) : (
              <Link to="/" className="rb-client-header__btn-home">
                Beranda
              </Link>
            )}
            <Link to="/login" className="rb-client-header__link-login" title="Akses Fotografer">
              Masuk
            </Link>
          </nav>
        </div>
      </header>

      <main className="rb-client-layout__main">
        <Outlet />
      </main>
    </div>
  )
}
