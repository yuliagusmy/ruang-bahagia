import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import packageService from '../../services/package.service'
import portfolioService from '../../services/portfolio.service'
import BottomSheet from '../../components/ui/BottomSheet'
import Skeleton from '../../components/ui/Skeleton'
import PlatformGuideModal from '../../components/common/PlatformGuideModal'
import './LandingPage.css'

const CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'prewedding', label: 'Prewedding' },
  { id: 'portrait', label: 'Portrait' },
]

export default function LandingPage() {
  const [packages, setPackages] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [selectedCat, setSelectedCat] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedLandingSession, setSelectedLandingSession] = useState(null)
  const [landingLightboxPhoto, setLandingLightboxPhoto] = useState(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const [guideTab, setGuideTab] = useState('client')

  useEffect(() => {
    Promise.allSettled([
      packageService.getPublic(),
      portfolioService.getPublic(),
    ]).then(([pkgRes, portRes]) => {
      if (pkgRes.status === 'fulfilled') {
        setPackages(pkgRes.value.data?.data || pkgRes.value.data || [])
      }
      if (portRes.status === 'fulfilled') {
        setPortfolio(portRes.value.data?.data || portRes.value.data || [])
      }
      setLoading(false)
    })
  }, [])

  const filteredPhotos = portfolio.filter(
    (item) => selectedCat === 'all' || item.category === selectedCat
  )

  const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0)

  return (
    <div className="rb-landing">
      {/* ── Hero Section ─────────────────────────────── */}
      <section className="rb-landing-hero">
        <div className="rb-landing-hero__content">
          <div className="rb-landing-hero__badge">Platform Modern Fotografer & Klien</div>
          <h1 className="rb-landing-hero__headline">
            Seleksi foto klien tanpa ribet, reservasi tanpa drama.
          </h1>
          <p className="rb-landing-hero__lead">
            Buat galeri dari Google Drive, bagikan linknya, dan biarkan klien memilih foto favorit lewat smartphone. Hasil pilihan langsung rapi dan siap diproses ke Adobe Lightroom atau salin berkas RAW.
          </p>

          <div className="rb-landing-hero__actions">
            <Link to="/register" className="rb-btn rb-btn--primary rb-btn--lg">
              Daftar Sebagai Fotografer ↗
            </Link>
            <a href="#fitur" className="rb-btn rb-btn--secondary rb-btn--lg">
              Pelajari Alur Kerja ↓
            </a>
          </div>
        </div>

        <div className="rb-landing-hero__image-wrapper">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop"
            alt="Momen Bahagia Wedding & Proofing"
            className="rb-landing-hero__image"
          />
          <div className="rb-landing-hero__image-caption">
            <span>Kurasi Foto Google Drive & Swipe Proofing</span>
            <small>Editorial & Modern Workflow</small>
          </div>
        </div>
      </section>

      {/* ── Keunggulan / Experience ──────────────────── */}
      <section id="fitur" className="rb-landing-features">
        <h2 className="rb-landing-sec-title">Alur Kerja Cerdas & Praktis</h2>
        <div className="rb-landing-features__grid">
          <div className="rb-feature-card">
            <span className="rb-feature-card__num">01</span>
            <h3 className="rb-feature-card__title">Galeri dari Google Drive</h3>
            <p className="rb-feature-card__desc">
              Cukup tempel tautan folder Drive sesi foto. Sistem otomatis menyiapkan galeri preview untuk klien Anda.
            </p>
          </div>

          <div className="rb-feature-card">
            <span className="rb-feature-card__num">02</span>
            <h3 className="rb-feature-card__title">Klien Swipe & Pilih Sendiri</h3>
            <p className="rb-feature-card__desc">
              Klien memilih foto favorit dengan antarmuka swipe yang interaktif dan nyaman langsung dari smartphone.
            </p>
          </div>

          <div className="rb-feature-card">
            <span className="rb-feature-card__num">03</span>
            <h3 className="rb-feature-card__title">Siap Impor ke Lightroom</h3>
            <p className="rb-feature-card__desc">
              Salin nama file RAW atau filter pencarian Lightroom dengan satu ketukan. Editing jadi 5x lebih cepat.
            </p>
          </div>

          <div className="rb-feature-card">
            <span className="rb-feature-card__num">04</span>
            <h3 className="rb-feature-card__title">Preset Multi-Tema Eksklusif</h3>
            <p className="rb-feature-card__desc">
              Sesuaikan estetika visual studio Anda: Studio Editorial, Warm Film, Noir, Sage, atau Bloom.
            </p>
          </div>
        </div>
      </section>

      {/* ── Platform Guideline Card ──────────────────── */}
      <section className="rb-landing-guide-section">
        <div className="rb-landing-guide-card">
          <div className="rb-landing-guide-card__header">
            <div className="rb-landing-guide-card__badges">
              <span className="rb-guide-badge rb-guide-badge--client">💑 Untuk Klien & Pasangan</span>
              <span className="rb-guide-badge rb-guide-badge--studio">📸 Untuk Fotografer & Studio</span>
            </div>
            <h2 className="rb-landing-guide-card__title">
              Baru Mengenal Ruang Bahagia?
            </h2>
            <p className="rb-landing-guide-card__desc">
              Pelajari alur kerja platform cerdas kami. Mulai dari reservasi jadwal dan DP instan via QRIS, swipe proofing foto dari smartphone, hingga manajemen portofolio studio fotografi Anda.
            </p>
          </div>

          <div className="rb-landing-guide-card__actions">
            <button
              type="button"
              className="rb-guide-btn rb-guide-btn--primary"
              onClick={() => {
                setGuideTab('client')
                setGuideOpen(true)
              }}
            >
              <span>Panduan Klien (Alur Booking & Proofing)</span>
              <span className="rb-guide-btn__arrow">✦</span>
            </button>
            <button
              type="button"
              className="rb-guide-btn rb-guide-btn--outline"
              onClick={() => {
                setGuideTab('photographer')
                setGuideOpen(true)
              }}
            >
              <span>Panduan Fotografer & Studio ↗</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Galeri Karya ─────────────────────────────── */}
      <section id="galeri" className="rb-landing-section">
        <div className="rb-landing-section__header">
          <div>
            <span className="rb-landing-section__sub">Dokumentasi Terpilih</span>
            <h2 className="rb-landing-sec-title">Galeri Karya Kami</h2>
          </div>
          <div className="rb-landing-cats">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`rb-landing-cat-btn ${selectedCat === cat.id ? 'rb-landing-cat-btn--active' : ''}`}
                onClick={() => setSelectedCat(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rb-landing-gallery">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="block" height="240px" />
            ))}
          </div>
        ) : (
          <div className="rb-landing-gallery">
            {(filteredPhotos.length > 0 ? filteredPhotos : DEFAULT_PHOTOS).map((item, idx) => {
              const photoCount = item.photos?.length || 1
              const coverUrl = item.thumbnail_path || item.image_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800'

              const photographer = item.user || null
              const photographerUsername = photographer?.username || null
              const photographerName = photographer?.brand_name || photographer?.name || null
              const photographerAvatar = photographer?.avatar_path || null

              return (
                <div
                  key={item.id || idx}
                  className="rb-landing-photo-card"
                  onClick={() => setSelectedLandingSession(item)}
                  title={`Klik untuk melihat ${photoCount} foto di sesi ${item.title}`}
                >
                  <img
                    src={coverUrl}
                    alt={item.title}
                    className="rb-landing-photo-card__img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800'
                    }}
                  />

                  {/* Badge jumlah foto */}
                  <div className="rb-landing-photo-card__badge">
                    <span>📷 {photoCount} Foto</span>
                  </div>

                  {/* Info fotografer di pojok kiri bawah */}
                  {photographerUsername && (
                    <div
                      className="rb-landing-photo-card__photographer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {photographerAvatar ? (
                        <img
                          src={photographerAvatar}
                          alt={photographerName}
                          className="rb-landing-photo-card__photographer-avatar"
                        />
                      ) : (
                        <div className="rb-landing-photo-card__photographer-avatar rb-landing-photo-card__photographer-avatar--initial">
                          {(photographerName || 'P').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <Link
                        to={`/@${photographerUsername}`}
                        className="rb-landing-photo-card__photographer-name"
                        title={`Lihat profil ${photographerName}`}
                      >
                        {photographerName || `@${photographerUsername}`}
                      </Link>
                    </div>
                  )}

                  <div className="rb-landing-photo-card__info">
                    <span>{item.category}</span>
                    <h4>{item.title}</h4>
                    <span className="rb-landing-photo-card__cta">Lihat Sesi &rarr;</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Modal BottomSheet Sesi Galeri Publik ───────────── */}
      <BottomSheet
        isOpen={Boolean(selectedLandingSession)}
        onClose={() => {
          setSelectedLandingSession(null)
          setLandingLightboxPhoto(null)
        }}
        title={selectedLandingSession?.title || 'Koleksi Foto Sesi'}
      >
        {selectedLandingSession && (
          <div className="rb-landing-session-modal">
            <div className="rb-landing-session-modal__header">
              <span className="rb-session-badge">{selectedLandingSession.category}</span>
              <span className="rb-session-count">📷 {selectedLandingSession.photos?.length || 1} Foto</span>
            </div>

            {selectedLandingSession.description && (
              <p className="rb-landing-session-modal__desc">{selectedLandingSession.description}</p>
            )}

            <div className="rb-landing-session-grid">
              {(selectedLandingSession.photos?.length > 0
                ? selectedLandingSession.photos
                : [selectedLandingSession.thumbnail_path || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800']
              ).map((photoUrl, pIdx) => (
                <div
                  key={pIdx}
                  className="rb-landing-session-thumb"
                  onClick={() => setLandingLightboxPhoto(photoUrl)}
                  title="Klik untuk memperbesar"
                >
                  <img
                    src={photoUrl}
                    alt={`${selectedLandingSession.title} - ${pIdx + 1}`}
                    className="rb-landing-session-thumb__img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800'
                    }}
                  />
                  <span className="rb-landing-session-thumb__zoom">🔍</span>
                </div>
              ))}
            </div>

            <div className="rb-landing-session-modal__cta-box">
              <div>
                <strong>Tertarik dengan konsep foto ini?</strong>
                <p>Reservasi jadwal sesi Anda sebelum slot penuh.</p>
              </div>
              <div className="rb-landing-session-modal__cta-actions">
                {selectedLandingSession?.user?.username ? (
                  <>
                    <Link
                      to={`/@${selectedLandingSession.user.username}`}
                      className="rb-btn rb-btn--ghost rb-btn--sm"
                      onClick={() => setSelectedLandingSession(null)}
                    >
                      Profil Studio
                    </Link>
                    <Link
                      to={`/book?photographer=${selectedLandingSession.user.username}`}
                      className="rb-btn rb-btn--primary rb-btn--sm"
                      onClick={() => setSelectedLandingSession(null)}
                    >
                      Reservasi Sesi &rarr;
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/register"
                    className="rb-btn rb-btn--primary rb-btn--sm"
                    onClick={() => setSelectedLandingSession(null)}
                  >
                    Daftar Sebagai Fotografer &rarr;
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Lightbox Zoom Foto di Landing Page */}
      {landingLightboxPhoto && (
        <div className="rb-lightbox" onClick={() => setLandingLightboxPhoto(null)}>
          <div className="rb-lightbox__dialog" onClick={(e) => e.stopPropagation()}>
            <div className="rb-lightbox__bar">
              <span className="rb-lightbox__counter">Preview Foto</span>
              <button
                type="button"
                onClick={() => setLandingLightboxPhoto(null)}
                className="rb-lightbox__close"
              >
                ✕
              </button>
            </div>
            <div className="rb-lightbox__media">
              <img src={landingLightboxPhoto} alt="Preview Foto" className="rb-lightbox__img" />
            </div>
          </div>
        </div>
      )}

      {/* ── Paket & Layanan ─────────────────────────── */}
      <section id="paket" className="rb-landing-section rb-landing-section--light">
        <div className="rb-landing-section__header-center">
          <span className="rb-landing-section__sub">Etalase Layanan Studio</span>
          <h2 className="rb-landing-sec-title">Pilihan Paket dari Studio Terdaftar</h2>
          <p className="rb-landing-section__lead">
            Setiap fotografer di Ruang Bahagia menentukan paket, harga investasi, dan kuota foto sesi mereka sendiri.
          </p>
        </div>

        <div className="rb-landing-packages">
          {(packages.length > 0 ? packages : DEFAULT_PACKAGES).map((pkg) => {
            const studioUser = pkg.user || null
            const studioUsername = studioUser?.username || null
            const studioName = studioUser?.brand_name || studioUser?.name || null

            return (
              <div key={pkg.id} className="rb-landing-pkg-card">
                <div className="rb-landing-pkg-card__top">
                  {studioUsername ? (
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--rb-color-terracotta, #b87357)', fontWeight: '600' }}>
                      Studio: {studioName} (@{studioUsername})
                    </div>
                  ) : (
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--rb-color-muted, #7a6e65)', fontWeight: '600' }}>
                      Format Paket Studio
                    </div>
                  )}

                  <h3 className="rb-landing-pkg-card__name">{pkg.name}</h3>
                  <p className="rb-landing-pkg-card__desc">{pkg.description}</p>
                  <div className="rb-landing-pkg-card__price">
                    {formatRp(pkg.price)}
                  </div>
                </div>

                <ul className="rb-landing-pkg-card__specs">
                  <li>⏱ Durasi sesi: <strong>{pkg.duration_hours || 2} Jam</strong></li>
                  <li>📷 Kuota foto final: <strong>{pkg.photo_quota || 20} Foto</strong></li>
                  <li>💳 Uang Muka (DP): <strong>{formatRp(pkg.dp_amount || pkg.price * 0.3)}</strong></li>
                </ul>

                {studioUsername ? (
                  <Link
                    to={`/@${studioUsername}`}
                    className="rb-btn rb-btn--primary rb-btn--full"
                  >
                    Lihat Studio & Booking &rarr;
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="rb-btn rb-btn--secondary rb-btn--full"
                  >
                    Daftar & Buat Paket Anda ↗
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Pricing SaaS Fotografer Studio ────────── */}
      <section id="pricing" className="rb-landing-section">
        <div className="rb-landing-section__header-center">
          <span className="rb-landing-section__sub">Solusi Studio Fotografi</span>
          <h2 className="rb-landing-sec-title">Biaya Berlangganan Fotografer</h2>
          <p className="rb-landing-section__lead">
            Semua fotografer baru otomatis mendapatkan <strong>Masa Uji Coba Gratis 20 Hari Fitur Pro Studio</strong> tanpa biaya dan tanpa kartu kredit.
          </p>
        </div>

        <div className="rb-landing-pricing-grid">
          {/* Starter Plan */}
          <div className="rb-landing-price-card">
            <div className="rb-landing-price-card__header">
              <span className="rb-landing-price-card__tier">Starter</span>
              <div className="rb-landing-price-card__cost">
                <span className="rb-landing-price-card__currency">Rp</span>
                <span className="rb-landing-price-card__amount">0</span>
                <span className="rb-landing-price-card__period">/selamanya</span>
              </div>
              <p className="rb-landing-price-card__desc">
                Sempurna untuk fotografer freelance pemula yang ingin mencoba sistem reservasi digital.
              </p>
            </div>

            <ul className="rb-landing-price-card__list">
              <li>✓ Website portofolio pribadi (<code>/@username</code>)</li>
              <li>✓ Maksimal 2 paket layanan aktif</li>
              <li>✓ Maksimal 5 reservasi per bulan</li>
              <li>✓ 1 sesi client proofing (50 foto)</li>
              <li>✓ Pembayaran DP via QRIS</li>
              <li className="rb-landing-price-card__muted">✗ Watermark Ruang Bahagia</li>
            </ul>

            <Link to="/register" className="rb-btn rb-btn--secondary rb-btn--full">
              Daftar Gratis Sekarang
            </Link>
          </div>

          {/* Pro Studio Plan */}
          <div className="rb-landing-price-card rb-landing-price-card--pro">
            <div className="rb-landing-price-card__badge">Paling Populer ✦</div>
            <div className="rb-landing-price-card__header">
              <span className="rb-landing-price-card__tier">Pro Studio</span>
              <div className="rb-landing-price-card__cost">
                <span className="rb-landing-price-card__currency">Rp</span>
                <span className="rb-landing-price-card__amount">49.000</span>
                <span className="rb-landing-price-card__period">/bulan</span>
              </div>
              <p className="rb-landing-price-card__desc">
                Atau hemat 2 bulan dengan paket tahunan <strong>Rp 490.000/tahun</strong>.
              </p>
            </div>

            <ul className="rb-landing-price-card__list">
              <li>✓ <strong>Unlimited</strong> sesi client swipe proofing</li>
              <li>✓ <strong>Integrasi Google Drive</strong> (Tarik foto & hapus delivery otomatis)</li>
              <li>✓ <strong>Kustomisasi Multi-Tema</strong> (Studio, Warm, Noir, Sage, Bloom)</li>
              <li>✓ <strong>Ekspor Lightroom & Salin Nama File RAW</strong></li>
              <li>✓ <strong>Unlimited</strong> reservasi jadwal & kalender</li>
              <li>✓ <strong>Tanpa Watermark</strong> (Full branding nama studio Anda)</li>
              <li>✓ <strong>Lencana Studio Terverifikasi Emas ✦</strong></li>
              <li>✓ Ekspor rekap data klien & keuangan ke Excel</li>
            </ul>

            <Link to="/register" className="rb-btn rb-btn--primary rb-btn--full">
              Mulai Uji Coba Pro Studio ✦
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────── */}
      <section className="rb-landing-cta">
        <h2 className="rb-landing-cta__title">Siap Meningkatkan Kualitas Studio Anda?</h2>
        <p className="rb-landing-cta__desc">
          Dapatkan halaman profil personal dengan tautan booking khusus, sistem swipe proofing Google Drive, dan manajemen jadwal tanpa ribet. Coba gratis 20 hari fitur Pro Studio.
        </p>
        <div className="rb-landing-cta__buttons">
          <Link to="/register" className="rb-btn rb-btn--primary rb-btn--lg">
            Daftar Studio Gratis (Trial 20 Hari) ↗
          </Link>
          <a
            href="#pricing"
            className="rb-btn rb-btn--secondary rb-btn--lg"
          >
            Lihat Paket Langganan
          </a>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="rb-landing-footer">
        <div className="rb-landing-footer__brand">
          <span className="rb-landing-footer__logo">RB</span>
          <span className="rb-landing-footer__name">Ruang Bahagia</span>
        </div>
        <p className="rb-landing-footer__copy">
          Tempat di mana momen berharga dikelola dengan hati.
        </p>
        <div className="rb-landing-footer__links">
          <button
            type="button"
            onClick={() => {
              setGuideTab('client')
              setGuideOpen(true)
            }}
            className="rb-landing-footer__link-btn"
          >
            Panduan Platform
          </button>
          <a href="#fitur">Fitur Studio</a>
          <Link to="/register">Daftar Studio</Link>
          <Link to="/login">Akses Fotografer</Link>
        </div>
      </footer>

      {/* ── Modal Panduan Platform ──────────────────── */}
      <PlatformGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        defaultTab={guideTab}
      />
    </div>
  )
}

// Data cadangan jika backend belum terhubung
const DEFAULT_PHOTOS = [
  {
    id: 'd1',
    title: 'The Intimate Vow of Sarah & Kevin',
    category: 'wedding',
    thumbnail_path: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    description: 'Dokumentasi momen syahdu ikrar suci akad nikah dan kehangatan resepsi keluarga di Plataran Dharmawangsa.',
    photos: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800',
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800',
    ],
  },
  {
    id: 'd2',
    title: 'Sunset Breeze di Parangtritis',
    category: 'prewedding',
    thumbnail_path: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
    description: 'Sesi prewedding bertema senja pantai pesisir selatan Yogyakarta dengan perpaduan cahaya alami dan hembusan angin laut.',
    photos: [
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800',
      'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800',
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800',
    ],
  },
  {
    id: 'd3',
    title: 'Graduation Memory at UI - Yuliagus',
    category: 'portrait',
    thumbnail_path: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    description: 'Selebrasi kelulusan sarjana Yuliagus bersama keluarga dan sahabat di pelataran Rektorat Universitas Indonesia.',
    photos: [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
    ],
  },
  {
    id: 'd4',
    title: 'Earthy Botanical Editorial',
    category: 'portrait',
    thumbnail_path: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    description: 'Konsep editorial potret berbalut nuansa tanaman tropis dan pantulan sinar matahari sore yang hangat.',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
    ],
  },
]

const DEFAULT_PACKAGES = [
  {
    id: 'p1',
    name: 'Intimate Wedding',
    description: 'Liputan akad & resepsi intim hingga 6 jam penuh emosi dan cerita.',
    price: 5500000,
    dp_amount: 1500000,
    duration_hours: 6,
    photo_quota: 40,
  },
  {
    id: 'p2',
    name: 'Prewedding Sunset',
    description: 'Sesi outdoor romantis saat golden hour berbalut busana casual/etnik.',
    price: 3000000,
    dp_amount: 1000000,
    duration_hours: 3,
    photo_quota: 25,
  },
  {
    id: 'p3',
    name: 'Personal & Graduation',
    description: 'Dokumentasi kelulusan atau personal branding dengan arahan pose natural.',
    price: 1200000,
    dp_amount: 400000,
    duration_hours: 2,
    photo_quota: 15,
  },
]
