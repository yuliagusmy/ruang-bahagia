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
          <div className="rb-landing-hero__badge">Fotografi Autentik & Hangat</div>
          <h1 className="rb-landing-hero__headline">
            Abadikan cerita bahagia Anda apa adanya.
          </h1>
          <p className="rb-landing-hero__lead">
            Setiap senyum, tatapan, dan pelukan punya jiwa. Kami hadir untuk menangkap momen berharga Anda tanpa pose yang kaku.
          </p>

          <div className="rb-landing-hero__actions">
            <Link to="/book" className="rb-btn rb-btn--primary rb-btn--lg">
              Reservasi Jadwal Sesi
            </Link>
            <a href="#galeri" className="rb-btn rb-btn--ghost rb-btn--lg">
              Lihat Karya Foto ↓
            </a>
          </div>
        </div>

        <div className="rb-landing-hero__image-wrapper">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop"
            alt="Momen Bahagia Wedding"
            className="rb-landing-hero__image"
          />
          <div className="rb-landing-hero__image-caption">
            <span>Sesi Intimate Wedding</span>
            <small>Candid & Natural Tone</small>
          </div>
        </div>
      </section>

      {/* ── Keunggulan / Experience ──────────────────── */}
      <section className="rb-landing-features">
        <h2 className="rb-landing-sec-title">Pengalaman Tanpa Khawatir</h2>
        <div className="rb-landing-features__grid">
          <div className="rb-feature-card">
            <span className="rb-feature-card__num">01</span>
            <h3 className="rb-feature-card__title">Booking Cepat Online</h3>
            <p className="rb-feature-card__desc">
              Pilih tanggal yang tersedia, pilih paket, dan amankan slot sesi Anda dalam hitungan menit.
            </p>
          </div>

          <div className="rb-feature-card">
            <span className="rb-feature-card__num">02</span>
            <h3 className="rb-feature-card__title">Suasana Nyaman & Santai</h3>
            <p className="rb-feature-card__desc">
              Bimbingan konsep ramah yang membuat Anda merasa seperti berfoto bersama sahabat sendiri.
            </p>
          </div>

          <div className="rb-feature-card">
            <span className="rb-feature-card__num">03</span>
            <h3 className="rb-feature-card__title">Client Proofing Swipe</h3>
            <p className="rb-feature-card__desc">
              Pilih foto favorit langsung dari ponsel Anda dengan pengalaman swipe yang intuitif dan praktis.
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
              <Link to="/book" className="rb-btn rb-btn--primary rb-btn--sm">
                Reservasi Sekarang &rarr;
              </Link>
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
          <span className="rb-landing-section__sub">Transparan & Lengkap</span>
          <h2 className="rb-landing-sec-title">Pilihan Paket Layanan</h2>
          <p className="rb-landing-section__lead">
            Semua paket sudah termasuk akses portal seleksi foto online.
          </p>
        </div>

        <div className="rb-landing-packages">
          {(packages.length > 0 ? packages : DEFAULT_PACKAGES).map((pkg) => (
            <div key={pkg.id} className="rb-landing-pkg-card">
              <div className="rb-landing-pkg-card__top">
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

              <Link
                to={`/book?package=${pkg.id}`}
                className="rb-btn rb-btn--primary rb-btn--full"
              >
                Pilih Paket Ini
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────── */}
      <section className="rb-landing-cta">
        <h2 className="rb-landing-cta__title">Siap Mengabadikan Momen Spesial?</h2>
        <p className="rb-landing-cta__desc">
          Konsultasikan konsep foto atau periksa ketersediaan jadwal fotografer hari ini.
        </p>
        <div className="rb-landing-cta__buttons">
          <Link to="/book" className="rb-btn rb-btn--primary rb-btn--lg">
            Reservasi Jadwal Sekarang
          </Link>
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noreferrer"
            className="rb-btn rb-btn--secondary rb-btn--lg"
          >
            Konsultasi WhatsApp
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
          <Link to="/book">Reservasi</Link>
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
