import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import Badge from '../../components/ui/Badge'
import PlatformGuideModal from '../../components/common/PlatformGuideModal'
import './DashboardPage.css'

/**
 * DashboardPage — halaman utama fotografer
 * Design Read: ENERGY 3, focal point pada greeting + stats cards yang besar
 */
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  const handleCopyProfile = () => {
    const handle = user?.username || 'studio'
    const url = `${window.location.origin}/@${handle}`
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setError('Gagal memuat data dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />
  if (error)   return <DashboardError message={error} />

  const { stats, upcoming, pipeline } = data

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 11) return 'Selamat pagi'
    if (hour < 15) return 'Selamat siang'
    if (hour < 18) return 'Selamat sore'
    return 'Selamat malam'
  })()

  const currentHandle = user?.username || ''
  const publicProfileUrl = currentHandle ? `/@${currentHandle}` : '/'

  return (
    <div className="page dashboard">
      {/* ── Unified Studio Hero Banner ───────────────── */}
      <section className="dashboard__hero">
        <div className="dashboard__hero-card">
          <div className="dashboard__hero-top">
            <div className="dashboard__hero-avatar-wrap">
              {user?.avatar_path ? (
                <img
                  src={user.avatar_path}
                  alt={user?.name || 'Studio'}
                  className="dashboard__hero-avatar"
                />
              ) : (
                <div className="dashboard__hero-avatar dashboard__hero-avatar--initial">
                  {(user?.brand_name || user?.name || 'S').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="dashboard__hero-meta">
              <div className="dashboard__hero-badge-row">
                <span className="dashboard__hero-greeting">{greeting}</span>
                {user?.is_pro ? (
                  <Link to="/subscription" className="dashboard__hero-badge dashboard__hero-badge--gold" title="Akun Pro Studio Aktif">
                    Pro Studio ✦
                  </Link>
                ) : (
                  <Link to="/subscription" className="dashboard__hero-badge dashboard__hero-badge--upgrade" title="Tingkatkan ke Pro Studio">
                    Starter (Upgrade Pro ✦)
                  </Link>
                )}
                {user?.city && <span className="dashboard__hero-city">📍 {user.city}</span>}
              </div>
              <h2 className="dashboard__hero-brand">
                {user?.brand_name || user?.name}
              </h2>
              <div className="dashboard__hero-handle-row">
                <span className="dashboard__hero-handle">
                  ruangbahagia.web.id/@<strong>{currentHandle || 'username'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="dashboard__hero-actions">
            <a
              href={publicProfileUrl}
              target="_blank"
              rel="noreferrer"
              className="dashboard__hero-btn dashboard__hero-btn--primary"
            >
              <span>Buka Profil Publik</span>
              <span className="dashboard__hero-arrow">↗</span>
            </a>

            <button
              type="button"
              onClick={handleCopyProfile}
              className="dashboard__hero-btn dashboard__hero-btn--ghost"
              title="Salin tautan profil portofolio untuk bio media sosial"
            >
              <span>{copied ? '✓ Tautan Tersalin' : 'Salin Tautan'}</span>
            </button>

            <Link
              to="/settings"
              className="dashboard__hero-btn dashboard__hero-btn--settings"
              title="Pengaturan Profil Studio"
            >
              <span>⚙️ Pengaturan</span>
            </Link>

            <Link
              to="/subscription"
              className="dashboard__hero-btn dashboard__hero-btn--ghost"
              title="Kelola Langganan Studio"
            >
              <span>⭐ Langganan</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Cards ───────────────────────────── */}
      <section className="dashboard__stats" aria-label="Ringkasan">
        <StatCard
          label="Booking Bulan Ini"
          value={stats.bookings_this_month}
          accent
        />
        <StatCard
          label="Akan Datang"
          value={stats.upcoming_bookings}
        />
        <StatCard
          label="Klien Aktif"
          value={stats.active_clients}
        />
        <StatCard
          label="Pendapatan"
          value={formatRupiah(stats.revenue_this_month)}
          small
        />
      </section>

      {/* ── Quick Management Shortcuts ────────────── */}
      <section className="dashboard__quick-actions" aria-label="Akses Manajemen Studio">
        <Link to="/bookings" className="dashboard__quick-pill dashboard__quick-pill--highlight" title="Kelola Sesi Seleksi Foto Klien">
          <span className="dashboard__quick-pill-icon">✨</span>
          <span>Sesi Proofing Klien</span>
        </Link>
        <Link to="/packages" className="dashboard__quick-pill">
          <span className="dashboard__quick-pill-icon">📦</span>
          <span>Paket Layanan</span>
        </Link>
        <Link to="/portfolio" className="dashboard__quick-pill">
          <span className="dashboard__quick-pill-icon">🖼️</span>
          <span>Galeri Portofolio</span>
        </Link>
        <Link to="/schedule" className="dashboard__quick-pill">
          <span className="dashboard__quick-pill-icon">📅</span>
          <span>Kalender Jadwal</span>
        </Link>
        <Link to="/clients" className="dashboard__quick-pill">
          <span className="dashboard__quick-pill-icon">👥</span>
          <span>Klien (CRM)</span>
        </Link>
      </section>

      {/* ── Studio Guidance Tip ──────────────────── */}
      <div className="dashboard__guide-tip">
        <div className="dashboard__guide-tip-content">
          <span className="dashboard__guide-tip-icon">💡</span>
          <div>
            <strong className="dashboard__guide-tip-title">Panduan Alur Kerja Studio Ruang Bahagia</strong>
            <p className="dashboard__guide-tip-desc">
              Pelajari alur operasional: dari setting paket & kalender, konfirmasi DP WhatsApp, hingga kirim link client swipe proofing ke klien.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="dashboard__guide-tip-btn"
        >
          <span>Buka Panduan</span>
          <span>✦</span>
        </button>
      </div>

      {/* ── Upcoming Bookings & Pipeline Grid ─────────────────── */}
      <div className="dashboard__grid-2">
        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <h3 className="section-title">Jadwal Mendatang</h3>
            <Link to="/bookings" className="dashboard__see-all">Semua</Link>
          </div>

          {upcoming.length === 0 ? (
            <EmptyState message="Belum ada booking mendatang." />
          ) : (
            <div className="dashboard__upcoming-list">
              {upcoming.map((b) => (
                <UpcomingCard key={b.id} booking={b} />
              ))}
            </div>
          )}
        </section>

        <section className="dashboard__section">
          <h3 className="section-title">Pipeline Klien</h3>
          <PipelineBar pipeline={pipeline} />
        </section>
      </div>

      {/* ── Modal Panduan Platform ──────────────────── */}
      <PlatformGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        defaultTab="photographer"
      />
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────── */

function StatCard({ label, value, accent = false, small = false }) {
  return (
    <div className={`stat-card ${accent ? 'stat-card--accent' : ''}`}>
      <p className="stat-card__label">{label}</p>
      <p className={`stat-card__value ${small ? 'stat-card__value--sm' : ''}`}>{value}</p>
    </div>
  )
}

function UpcomingCard({ booking }) {
  const date = new Date(booking.event_date)
  const day   = date.toLocaleDateString('id-ID', { day: '2-digit' })
  const month = date.toLocaleDateString('id-ID', { month: 'short' })

  return (
    <Link to={`/bookings/${booking.id}`} className="upcoming-card">
      <div className="upcoming-card__date">
        <span className="upcoming-card__day">{day}</span>
        <span className="upcoming-card__month">{month}</span>
      </div>
      <div className="upcoming-card__info">
        <p className="upcoming-card__client">{booking.client?.name}</p>
        <p className="upcoming-card__package">
          {booking.package?.name}
          <span style={{ display: 'inline-block', marginLeft: '6px', fontSize: '11px', color: 'var(--rb-accent)', fontWeight: 600 }}>
            • ✨ Sesi Proofing
          </span>
        </p>
      </div>
      <Badge status={booking.status} size="sm" />
    </Link>
  )
}

function PipelineBar({ pipeline }) {
  const LABELS = {
    inquiry: 'Inquiry', dp_paid: 'DP', shooting: 'Shoot',
    editing: 'Edit', proofing: 'Proofing', completed: 'Selesai',
  }
  const total = Object.values(pipeline).reduce((s, v) => s + v, 0) || 1

  return (
    <div className="pipeline">
      <div className="pipeline__bar">
        {Object.entries(LABELS).map(([key, label]) => {
          const count = pipeline[key] || 0
          const pct   = ((count / total) * 100).toFixed(1)
          return count > 0 ? (
            <div
              key={key}
              className={`pipeline__segment pipeline__segment--${key}`}
              style={{ width: `${pct}%` }}
              title={`${label}: ${count}`}
            />
          ) : null
        })}
      </div>
      <div className="pipeline__legend">
        {Object.entries(LABELS).map(([key, label]) => (
          pipeline[key] > 0 ? (
            <span key={key} className="pipeline__legend-item">
              <span className={`pipeline__dot pipeline__dot--${key}`} />
              {label} ({pipeline[key]})
            </span>
          ) : null
        ))}
      </div>
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <p className="empty-state__text">{message}</p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="page dashboard">
      <div className="skeleton skeleton--greeting" />
      <div className="dashboard__stats">
        {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton--card" />)}
      </div>
      {[1,2].map(i => <div key={i} className="skeleton skeleton--block" />)}
    </div>
  )
}

function DashboardError({ message }) {
  return (
    <div className="page dashboard">
      <div className="error-state">
        <p>{message}</p>
        <button onClick={() => window.location.reload()} className="error-state__retry">
          Coba lagi
        </button>
      </div>
    </div>
  )
}

function formatRupiah(num) {
  if (!num) return 'Rp 0'
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}jt`
  if (num >= 1_000)     return `Rp ${(num / 1_000).toFixed(0)}rb`
  return `Rp ${num}`
}
