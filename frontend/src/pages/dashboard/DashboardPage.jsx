import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import Badge from '../../components/ui/Badge'
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
      {/* ── Greeting ─────────────────────────────── */}
      <section className="dashboard__greeting">
        <p className="dashboard__greeting-sub">{greeting},</p>
        <h2 className="dashboard__greeting-name">
          {user?.brand_name || user?.name}
        </h2>
      </section>

      {/* ── Studio Public Portal Card ────────────── */}
      <section className="dashboard__studio-card">
        <div className="dashboard__studio-card-left">
          <div className="dashboard__studio-avatar">
            {user?.avatar_path ? (
              <img src={user.avatar_path} alt={user.name} />
            ) : (
              <span>{(user?.brand_name || user?.name || 'S').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="dashboard__studio-meta-row">
              <span className="dashboard__studio-badge">Portal Publik Anda</span>
              {user?.city && <span className="dashboard__studio-city">📍 {user.city}</span>}
            </div>
            <h3 className="dashboard__studio-brand">{user?.brand_name || user?.name}</h3>
            <p className="dashboard__studio-url">
              ruangbahagia.web.id/@<strong>{currentHandle || 'username'}</strong>
            </p>
          </div>
        </div>

        <div className="dashboard__studio-actions">
          <button
            type="button"
            onClick={handleCopyProfile}
            className="rb-btn rb-btn--ghost rb-btn--sm"
            title="Salin link portofolio untuk bio Instagram"
          >
            {copied ? '✓ Tautan Tersalin' : 'Salin Tautan'}
          </button>
          <a
            href={publicProfileUrl}
            target="_blank"
            rel="noreferrer"
            className="rb-btn rb-btn--primary rb-btn--sm"
          >
            Buka Profil Publik ↗
          </a>
          <Link to="/settings" className="rb-btn rb-btn--secondary rb-btn--sm">
            ⚙️ Edit Profil Studio
          </Link>
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

      {/* ── Quick Actions Studio ───────────────────── */}
      <section className="dashboard__quick-actions" aria-label="Akses Cepat Studio">
        <Link to="/packages" className="dashboard__quick-pill">
          <span className="dashboard__quick-pill-icon">📦</span>
          <span>Paket Layanan</span>
        </Link>
        <Link to="/portfolio" className="dashboard__quick-pill">
          <span className="dashboard__quick-pill-icon">🖼️</span>
          <span>Galeri Portofolio</span>
        </Link>
        <Link to="/" className="dashboard__quick-pill">
          <span className="dashboard__quick-pill-icon">🌐</span>
          <span>Web Klien</span>
        </Link>
        <Link to="/book" className="dashboard__quick-pill">
          <span className="dashboard__quick-pill-icon">🔗</span>
          <span>Link Reservasi</span>
        </Link>
      </section>

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
        <p className="upcoming-card__package">{booking.package?.name}</p>
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
