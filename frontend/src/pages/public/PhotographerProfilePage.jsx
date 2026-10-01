import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import photographerService from '../../services/photographer.service'
import BottomSheet from '../../components/ui/BottomSheet'
import Skeleton from '../../components/ui/Skeleton'
import './PhotographerProfilePage.css'

export default function PhotographerProfilePage() {
  const { username } = useParams()
  const cleanUsername = decodeURIComponent(username || '')
    .replace(/^@/, '')
    .trim()
    .toLowerCase()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [photographer, setPhotographer] = useState(null)
  const [packages, setPackages] = useState([])
  const [portfolioItems, setPortfolioItems] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedCat, setSelectedCat] = useState('all')
  const [selectedSession, setSelectedSession] = useState(null)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!cleanUsername) return

    setLoading(true)
    setError(null)

    photographerService
      .getByUsername(cleanUsername)
      .then((res) => {
        const d = res.data?.data || {}
        setPhotographer(d.photographer || null)
        setPackages(d.packages || [])
        setPortfolioItems(d.portfolio_items || [])
        setAvailableSlots(d.available_slots || [])
        setLoading(false)
      })
      .catch((err) => {
        const msg =
          err.response?.data?.message ||
          `Profil fotografer @${cleanUsername} tidak dapat ditemukan.`
        setError(msg)
        setLoading(false)
      })
  }, [cleanUsername])

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0)

  // Gunakan data portofolio dan paket aktif, jika belum ada gunakan starter dummy yang dapat diedit di pengaturan
  const activePortfolio = portfolioItems.length > 0 ? portfolioItems : STARTER_PORTFOLIO
  const activePackages = packages.length > 0 ? packages : STARTER_PACKAGES

  // Filter kategori portofolio unik dari data yang ada
  const categories = [
    { id: 'all', label: 'Semua Karya' },
    ...Array.from(new Set(activePortfolio.map((item) => item.category).filter(Boolean))).map(
      (cat) => ({
        id: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
      })
    ),
  ]

  const filteredPortfolio = activePortfolio.filter(
    (item) => selectedCat === 'all' || item.category === selectedCat
  )

  if (loading) {
    return (
      <div className="rb-profile-page rb-profile-page--loading">
        <div className="rb-profile-hero-skel">
          <Skeleton variant="circle" width="88px" height="88px" />
          <Skeleton variant="text" width="220px" height="28px" />
          <Skeleton variant="text" width="140px" height="18px" />
          <Skeleton variant="block" width="100%" height="60px" />
        </div>
        <div className="rb-profile-grid-skel">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="block" height="220px" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !photographer) {
    return (
      <div className="rb-profile-page rb-profile-page--error">
        <div className="rb-profile-error-card">
          <div className="rb-profile-error-icon">🔍</div>
          <h1 className="rb-profile-error-title">Profil Tidak Ditemukan</h1>
          <p className="rb-profile-error-desc">
            {error || `Fotografer dengan username @${cleanUsername} belum terdaftar.`}
          </p>
          <div className="rb-profile-error-actions">
            <Link to="/" className="rb-btn rb-btn--ghost">
              Kembali ke Beranda
            </Link>
            <Link to="/register" className="rb-btn rb-btn--primary">
              Daftarkan @{cleanUsername} Sekarang &rarr;
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const cleanWaNumber = (photographer.whatsapp || photographer.phone || '')
    .replace(/[^0-9]/g, '')
    .replace(/^0/, '62')

  const igUsername = (photographer.instagram || '').replace(/^@/, '')

  return (
    <div className="rb-profile-page">
      {/* ── Profile Header & Hero Showcase ────────────────────────── */}
      <section className="rb-profile-hero">
        <div className="rb-profile-hero__inner">
          <div className="rb-profile-hero__top">
            <div className="rb-profile-avatar-wrap">
              {photographer.avatar_path ? (
                <img
                  src={photographer.avatar_path}
                  alt={photographer.brand_name || photographer.name}
                  className="rb-profile-avatar"
                />
              ) : (
                <div className="rb-profile-avatar rb-profile-avatar--initial">
                  {(photographer.brand_name || photographer.name || 'P')
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <div className="rb-profile-meta">
              <div className="rb-profile-badge-row">
                <span className="rb-profile-badge">Studio Terverifikasi</span>
                {photographer.city && (
                  <span className="rb-profile-city">📍 {photographer.city}</span>
                )}
              </div>

              <h1 className="rb-profile-title">
                {photographer.brand_name || photographer.name}
              </h1>

              <div className="rb-profile-handle-row">
                <span className="rb-profile-handle">@{photographer.username}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="rb-profile-copy-btn"
                  title="Salin tautan profil portofolio"
                >
                  {copied ? '✓ Tersalin' : 'Salin Link'}
                </button>
              </div>
            </div>
          </div>

          <p className="rb-profile-bio">
            {photographer.bio ||
              'Fotografer profesional yang berfokus pada dokumentasi momen berharga dengan visual hangat, sentuhan editorial elegan, dan cerita yang abadi. Melayani sesi wedding, prewedding, dan portrait.'}
          </p>

          {/* Action Contact Bar */}
          <div className="rb-profile-actions">
            <Link
              to={`/book?photographer=${cleanUsername}`}
              className="rb-btn rb-btn--primary rb-profile-cta"
            >
              Reservasi Sesi &rarr;
            </Link>

            {cleanWaNumber && (
              <a
                href={`https://wa.me/${cleanWaNumber}?text=Halo%20${encodeURIComponent(
                  photographer.brand_name || photographer.name
                )},%20saya%20tertarik%20dengan%20layanan%20fotografi%20Anda.`}
                target="_blank"
                rel="noreferrer"
                className="rb-btn rb-btn--secondary rb-profile-cta"
              >
                Chat WhatsApp
              </a>
            )}

            {igUsername && (
              <a
                href={`https://instagram.com/${igUsername}`}
                target="_blank"
                rel="noreferrer"
                className="rb-btn rb-btn--ghost rb-profile-cta"
              >
                Instagram
              </a>
            )}

            <a href="#paket-layanan" className="rb-btn rb-btn--ghost rb-profile-cta">
              Lihat Paket & Harga
            </a>
          </div>
        </div>
      </section>

      {/* ── Galeri Portofolio Karya ──────────────────────────────── */}
      <section className="rb-profile-section" id="galeri-karya">
        <div className="rb-profile-section__header">
          <div>
            <span className="rb-profile-section__sub">Dokumentasi Terpilih</span>
            <h2 className="rb-profile-section__title">Galeri Portofolio</h2>
          </div>

          {categories.length > 1 && (
            <div className="rb-profile-cats">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`rb-profile-cat-btn ${
                    selectedCat === cat.id ? 'rb-profile-cat-btn--active' : ''
                  }`}
                  onClick={() => setSelectedCat(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredPortfolio.length === 0 ? (
          <div className="rb-profile-empty">
            <div className="rb-profile-empty-icon" style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📷</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--rb-color-text, #2c2523)', margin: '0 0 0.5rem' }}>
              Galeri Portofolio Sedang Disiapkan
            </h3>
            <p style={{ margin: 0, color: 'var(--rb-color-muted, #7a6e65)', fontSize: '0.9375rem' }}>
              Karya foto sesi terbaik dari {photographer.brand_name || photographer.name} akan segera ditampilkan di sini.
            </p>
          </div>
        ) : (
          <div className="rb-profile-gallery">
            {filteredPortfolio.map((item) => {
              const photoList = Array.isArray(item.photos) ? item.photos : []
              const photoCount = item.photo_count || photoList.length || 1
              const coverUrl =
                item.cover_url ||
                item.thumbnail_path ||
                photoList[0] ||
                'https://images.unsplash.com/photo-1519741497674-611481863552?w=800'

              return (
                <div
                  key={item.id}
                  className="rb-profile-card"
                  onClick={() => setSelectedSession(item)}
                  title={`Buka sesi ${item.title} (${photoCount} Foto)`}
                >
                  <img
                    src={coverUrl}
                    alt={item.title}
                    className="rb-profile-card__img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1519741497674-611481863552?w=800'
                    }}
                  />

                  <div className="rb-profile-card__badge">
                    <span>📷 {photoCount} Foto</span>
                  </div>

                  <div className="rb-profile-card__overlay">
                    <span className="rb-profile-card__cat">{item.category}</span>
                    <h3 className="rb-profile-card__title">{item.title}</h3>
                    <span className="rb-profile-card__hint">Lihat Koleksi &rarr;</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Paket Layanan Fotografer ─────────────────────────────── */}
      <section className="rb-profile-section rb-profile-section--light" id="paket-layanan">
        <div className="rb-profile-section__header-center">
          <span className="rb-profile-section__sub">Pilihan Layanan</span>
          <h2 className="rb-profile-section__title">Paket & Investasi Sesi</h2>
          <p className="rb-profile-section__lead">
            Pilih paket yang sesuai dengan kebutuhan dokumentasi momen berharga Anda.
          </p>
        </div>

        <div className="rb-profile-packages">
          {activePackages.map((pkg) => (
            <div key={pkg.id} className="rb-profile-pkg">
              <div className="rb-profile-pkg__top">
                <h3 className="rb-profile-pkg__name">{pkg.name}</h3>
                {pkg.description && (
                  <p className="rb-profile-pkg__desc">{pkg.description}</p>
                )}
                <div className="rb-profile-pkg__price">
                  {formatRp(pkg.price)}
                </div>
              </div>

              <ul className="rb-profile-pkg__specs">
                <li>
                  ⏱ Durasi sesi: <strong>{pkg.duration_hours || 2} Jam</strong>
                </li>
                <li>
                  📷 Kuota foto final: <strong>{pkg.photo_quota || 20} Foto</strong>
                </li>
                <li>
                  💳 Uang Muka (DP):{' '}
                  <strong>{formatRp(pkg.dp_amount || pkg.price * 0.3)}</strong>
                </li>
              </ul>

              <Link
                to={`/book?photographer=${cleanUsername}${pkg.id && !String(pkg.id).startsWith('starter-') ? `&package=${pkg.id}` : ''}`}
                className="rb-btn rb-btn--primary rb-btn--full"
              >
                Pilih Paket & Booking &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Jadwal Sesi Tersedia (Jika Ada) ───────────────────────── */}
      {availableSlots.length > 0 && (
        <section className="rb-profile-section" id="jadwal-tersedia">
          <div className="rb-profile-section__header">
            <div>
              <span className="rb-profile-section__sub">Ketersediaan Waktu</span>
              <h2 className="rb-profile-section__title">Slot Jadwal Dibuka</h2>
            </div>
          </div>

          <div className="rb-profile-slots-grid">
            {availableSlots.slice(0, 6).map((slot) => {
              const dateObj = new Date(slot.date)
              const dateFormatted = dateObj.toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })

              return (
                <div key={slot.id} className="rb-profile-slot-card">
                  <div className="rb-profile-slot-icon">📅</div>
                  <div>
                    <strong className="rb-profile-slot-date">{dateFormatted}</strong>
                    <div className="rb-profile-slot-time">
                      {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)} WIB
                    </div>
                    {slot.notes && (
                      <div className="rb-profile-slot-notes">{slot.notes}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── BottomSheet Peninjauan Sesi Foto ─────────────────────── */}
      <BottomSheet
        isOpen={Boolean(selectedSession)}
        onClose={() => {
          setSelectedSession(null)
          setLightboxPhoto(null)
        }}
        title={selectedSession?.title || 'Koleksi Foto Sesi'}
      >
        {selectedSession && (
          <div className="rb-profile-session-modal">
            <div className="rb-profile-session-modal__meta">
              <span className="rb-session-badge">{selectedSession.category}</span>
              <span className="rb-session-count">
                📷 {selectedSession.photos?.length || 1} Foto
              </span>
            </div>

            {selectedSession.description && (
              <p className="rb-profile-session-modal__desc">
                {selectedSession.description}
              </p>
            )}

            <div className="rb-profile-session-grid">
              {(selectedSession.photos?.length > 0
                ? selectedSession.photos
                : [
                    selectedSession.cover_url ||
                      selectedSession.thumbnail_path ||
                      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
                  ]
              ).map((photoUrl, pIdx) => (
                <div
                  key={pIdx}
                  className="rb-profile-session-thumb"
                  onClick={() => setLightboxPhoto(photoUrl)}
                  title="Klik untuk memperbesar"
                >
                  <img
                    src={photoUrl}
                    alt={`${selectedSession.title} - ${pIdx + 1}`}
                    className="rb-profile-session-thumb__img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1519741497674-611481863552?w=800'
                    }}
                  />
                  <span className="rb-profile-session-thumb__zoom">🔍</span>
                </div>
              ))}
            </div>

            <div className="rb-profile-session-modal__footer">
              <Link
                to={`/book?photographer=${cleanUsername}`}
                className="rb-btn rb-btn--primary rb-btn--full"
              >
                Booking Jadwal dengan {photographer.brand_name || photographer.name} &rarr;
              </Link>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ── Lightbox Zoom Single Photo ───────────────────────────── */}
      {lightboxPhoto && (
        <div className="rb-lightbox" onClick={() => setLightboxPhoto(null)}>
          <div className="rb-lightbox__dialog" onClick={(e) => e.stopPropagation()}>
            <div className="rb-lightbox__bar">
              <span className="rb-lightbox__counter">Pratinjau Foto</span>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="rb-lightbox__close"
              >
                ✕
              </button>
            </div>
            <div className="rb-lightbox__media">
              <img src={lightboxPhoto} alt="Pratinjau Foto" className="rb-lightbox__img" />
            </div>
          </div>
        </div>
      )}

      {/* ── Footer Platform Callout (SaaS Promotion) ─────────────── */}
      <footer className="rb-profile-footer">
        <div className="rb-profile-footer__inner">
          <div className="rb-profile-footer__text">
            <strong>Apakah Anda seorang fotografer?</strong>
            <p>
              Dapatkan portal studio pribadi seperti ini dengan domain, sistem booking QRIS,
              dan seleksi foto swipe untuk klien Anda.
            </p>
          </div>
          <Link to="/register" className="rb-btn rb-btn--primary">
            Daftar Studio Anda Gratis &rarr;
          </Link>
        </div>
      </footer>
    </div>
  )
}

const STARTER_PORTFOLIO = [
  {
    id: 'starter-port-1',
    title: 'Golden Hour Botanical Engagement',
    description: 'Sesi foto prewedding hangat di tengah kebun raya saat cahaya sore keemasan (golden hour).',
    category: 'prewedding',
    cover_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop',
    thumbnail_path: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1000&auto=format&fit=crop',
    ],
    photo_count: 4,
    is_featured: true,
  },
  {
    id: 'starter-port-2',
    title: 'The Elegant Akad & Intimate Celebration',
    description: 'Dokumentasi prosesi sakral janji suci dan kehangatan tawa keluarga dalam nuansa modern warm.',
    category: 'wedding',
    cover_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1000&auto=format&fit=crop',
    thumbnail_path: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1000&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1000&auto=format&fit=crop',
    ],
    photo_count: 4,
    is_featured: true,
  },
  {
    id: 'starter-port-3',
    title: 'Studio Editorial & Natural Light Portrait',
    description: 'Eksplorasi ekspresi dan kepribadian autentik dengan pencahayaan alami studio yang lembut.',
    category: 'portrait',
    cover_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop',
    thumbnail_path: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1000&auto=format&fit=crop',
    ],
    photo_count: 3,
    is_featured: false,
  },
]

const STARTER_PACKAGES = [
  {
    id: 'starter-pkg-1',
    name: 'Sesi Personal & Portrait',
    description: 'Cocok untuk foto profil profesional, wisuda, personal branding, atau portrait santai outdoor.',
    duration_hours: 1,
    photo_quota: 15,
    price: 750000,
    dp_amount: 250000,
  },
  {
    id: 'starter-pkg-2',
    name: 'Sesi Prewedding & Intimate',
    description: 'Dokumentasi momen hangat dan autentik pasangan dengan konsep editorial elegan di lokasi outdoor maupun indoor.',
    duration_hours: 3,
    photo_quota: 35,
    price: 2500000,
    dp_amount: 750000,
  },
  {
    id: 'starter-pkg-3',
    name: 'Sesi Intimate Wedding & Akad',
    description: 'Liputan dokumentasi sakral akad nikah atau resepsi intim bersama keluarga terdekat.',
    duration_hours: 4,
    photo_quota: 50,
    price: 3500000,
    dp_amount: 1000000,
  },
]
