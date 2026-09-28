import { Outlet, Link, useLocation } from 'react-router-dom'
import './ClientLayout.css'

/**
 * ClientLayout — wrapper halaman publik klien (landing page, booking katalog, proofing)
 * Header responsif disejajarkan dengan batas konten halaman
 */
export default function ClientLayout() {
  const location = useLocation()
  const isBookPage = location.pathname === '/book'

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
              <Link to="/book" className="rb-client-header__btn-book">
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
