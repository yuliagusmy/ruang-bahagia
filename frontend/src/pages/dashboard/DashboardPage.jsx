import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import Badge from '../../components/ui/Badge'
import PlatformGuideModal from '../../components/common/PlatformGuideModal'
import './DashboardPage.css'

/**
 * DashboardPage — Halaman utama operasional fotografer
 * Desain: Warm editorial, rapi, bebas redundansi tombol navigasi, mobile-first hingga desktop.
 */
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [guideDismissed, setGuideDismissed] = useState(() => {
    try {
      return localStorage.getItem('rb_guide_dismissed') === '1'
    } catch {
      return false
    }
  })

  const handleDismissGuide = () => {
    setGuideDismissed(true)
    try {
      localStorage.setItem('rb_guide_dismissed', '1')
    } catch {
      // ignore
    }
  }

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
  if (error) return <DashboardError message={error} />

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
      {/* ── 1. Unified Studio Hero Banner ────────────────────────────── */}
      <section className="dashboard__hero">
        <div className="dashboard__hero-card">
          <div className="dashboard__hero-header">
            <div className="dashboard__hero-profile">
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

              <div className="dashboard__hero-info">
                <div className="dashboard__hero-badge-row">
                  <span className="dashboard__hero-greeting">{greeting},</span>
                  <span className="dashboard__hero-owner-name">{user?.name}</span>
                  {user?.is_pro ? (
                    <span className="dashboard__hero-badge dashboard__hero-badge--gold" title="Akun Pro Studio Aktif">
                      {user?.is_trial ? `Pro Studio (Trial ${user?.trial_days_remaining ?? 10} Hari) ✦` : 'Pro Studio ✦'}
                    </span>
                  ) : (
                    <span className="dashboard__hero-badge dashboard__hero-badge--starter" title="Paket Starter">
                      Starter
                    </span>
                  )}
                  {user?.city && <span className="dashboard__hero-city">📍 {user.city}</span>}
                </div>

                <h1 className="dashboard__hero-brand">
                  {user?.brand_name || user?.name}
                </h1>

                <div className="dashboard__hero-url-bar">
                  <span className="dashboard__hero-url-text">
                    ruangbahagia.web.id/@<strong>{currentHandle || 'username'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyProfile}
                    className="dashboard__hero-copy-pill"
                    title="Salin tautan profil portofolio"
                  >
                    {copied ? '✓ Tersalin' : '📋 Salin'}
                  </button>
                  <a
                    href={publicProfileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="dashboard__hero-view-link"
                    title="Buka profil publik di tab baru"
                  >
                    Buka ↗
                  </a>
                </div>
              </div>
            </div>

            <div className="dashboard__hero-cta-group">
              <Link
                to="/bookings?new=1"
                className="dashboard__hero-btn dashboard__hero-btn--booking"
                title="Catat reservasi sesi baru"
              >
                <span className="dashboard__hero-btn-icon">+</span>
                <span>Catat Booking</span>
              </Link>

              <a
                href={publicProfileUrl}
                target="_blank"
                rel="noreferrer"
                className="dashboard__hero-btn dashboard__hero-btn--primary"
                title="Lihat halaman profil portofolio publik Anda di tab baru"
              >
                <span>Lihat Profil Publik</span>
                <span className="dashboard__hero-arrow">↗</span>
              </a>
            </div>
          </div>

          <div className="dashboard__hero-shortcuts">
            <span className="dashboard__shortcuts-label">Akses Cepat:</span>
            <div className="dashboard__shortcuts-list">
              <Link
                to="/proofing"
                className="dashboard__shortcut-pill dashboard__shortcut-pill--featured"
                title="Tools Proofing: Kelola sesi swipe foto klien mandiri maupun terikat booking"
              >
                <span className="dashboard__shortcut-icon">✨</span>
                <span>Tools Proofing (Portal Swipe Klien)</span>
                <span className="dashboard__shortcut-arrow" style={{ fontSize: '0.75rem', opacity: 0.7 }}>↗</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Key Metrics Summary (Stats Cards) ────────────────────── */}
      <section className="dashboard__stats" aria-label="Ringkasan Kinerja Studio">
        <StatCard
          label="Booking Bulan Ini"
          value={stats.bookings_this_month}
          subtitle="Sesi terkonfirmasi"
          accent
        />
        <StatCard
          label="Sesi Mendatang"
          value={stats.upcoming_bookings}
          subtitle="Dalam agenda terdekat"
        />
        <StatCard
          label="Klien Aktif"
          value={stats.active_clients}
          subtitle="Database CRM"
        />
        <StatCard
          label="Pendapatan Bulan Ini"
          value={formatRupiah(stats.revenue_this_month)}
          subtitle="Lihat Laporan & Laba ↗"
          to="/reports"
          small
        />
      </section>

      {/* ── 3. Studio Workflow Guide Tip (Compact & Dismissible) ────── */}
      {!guideDismissed && (
        <div className="dashboard__guide-tip">
          <div className="dashboard__guide-tip-content">
            <span className="dashboard__guide-tip-icon">💡</span>
            <div className="dashboard__guide-tip-body">
              <strong className="dashboard__guide-tip-title">Panduan Alur Kerja Studio Ruang Bahagia</strong>
              <p className="dashboard__guide-tip-desc">
                Pelajari alur operasional: dari setting paket & kalender, konfirmasi DP WhatsApp, hingga kirim tautan client swipe proofing ke klien.
              </p>
            </div>
          </div>
          <div className="dashboard__guide-tip-actions">
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="dashboard__guide-tip-btn"
            >
              <span>Buka Panduan ✦</span>
            </button>
            <button
              type="button"
              onClick={handleDismissGuide}
              className="dashboard__guide-tip-close"
              title="Sembunyikan panduan ini"
              aria-label="Tutup panduan"
            >
              <span>Tutup ✕</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 4. Main Two-Column Editorial Grid ────────────────────────── */}
      <div className="dashboard__grid-2">
        {/* Kolom 1: Jadwal Pemotretan Mendatang */}
        <div className="dashboard__card dashboard__card--upcoming">
          <div className="dashboard__card-header">
            <div>
              <h3 className="dashboard__card-title">Jadwal Pemotretan Mendatang</h3>
              <p className="dashboard__card-subtitle">
                {upcoming.length > 0 ? `${upcoming.length} sesi terdekat dalam agenda` : 'Agenda pemotretan studio Anda'}
              </p>
            </div>
            <Link to="/bookings" className="dashboard__card-action">
              <span>Semua Reservasi</span>
              <span className="dashboard__card-action-arrow">→</span>
            </Link>
          </div>

          <div className="dashboard__card-body">
            {upcoming.length === 0 ? (
              <div className="dashboard__empty-agenda">
                <div className="dashboard__empty-icon">🗓️</div>
                <h4 className="dashboard__empty-title">Belum Ada Jadwal Terdekat</h4>
                <p className="dashboard__empty-desc">
                  Reservasi sesi pemotretan klien yang terkonfirmasi akan otomatis tertata rapi di sini.
                </p>
                <Link to="/bookings?new=1" className="dashboard__empty-cta">
                  <span>+ Catat Reservasi Baru</span>
                </Link>
              </div>
            ) : (
              <div className="dashboard__upcoming-list">
                {upcoming.map((b) => (
                  <UpcomingCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom 2: Pipeline Status Sesi Foto */}
        <div className="dashboard__card dashboard__card--pipeline">
          <div className="dashboard__card-header">
            <div>
              <h3 className="dashboard__card-title">Pipeline Status Sesi</h3>
              <p className="dashboard__card-subtitle">
                Tahapan pengerjaan proyek dari inquiry hingga selesai
              </p>
            </div>
            <Link to="/clients" className="dashboard__card-action">
              <span>Data Klien</span>
              <span className="dashboard__card-action-arrow">→</span>
            </Link>
          </div>

          <div className="dashboard__card-body">
            <PipelineSection pipeline={pipeline} />
          </div>
        </div>
      </div>

      {/* ── 5. Platform Guide Modal ──────────────────────────────────── */}
      <PlatformGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        defaultTab="photographer"
      />
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

function StatCard({ label, value, subtitle, accent = false, small = false, to = null }) {
  const inner = (
    <div className={`stat-card ${accent ? 'stat-card--accent' : ''} ${to ? 'stat-card--link' : ''}`}>
      <div className="stat-card__top">
        <p className="stat-card__label">{label}</p>
        {accent && <span className="stat-card__indicator" />}
        {to && <span className="stat-card__arrow" style={{ fontSize: '0.75rem', opacity: 0.65 }}>↗</span>}
      </div>
      <p className={`stat-card__value ${small ? 'stat-card__value--sm' : ''}`}>{value}</p>
      {subtitle && <p className="stat-card__subtitle">{subtitle}</p>}
    </div>
  )

  return to ? (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
      {inner}
    </Link>
  ) : (
    inner
  )
}

function UpcomingCard({ booking }) {
  const date = new Date(booking.event_date)
  const day = date.toLocaleDateString('id-ID', { day: '2-digit' })
  const month = date.toLocaleDateString('id-ID', { month: 'short' })
  const timeFormatted = booking.event_time ? `${booking.event_time} WIB` : null

  return (
    <Link to={`/bookings/${booking.id}`} className="upcoming-card">
      <div className="upcoming-card__date">
        <span className="upcoming-card__day">{day}</span>
        <span className="upcoming-card__month">{month}</span>
      </div>
      <div className="upcoming-card__info">
        <div className="upcoming-card__client-row">
          <p className="upcoming-card__client">{booking.client?.name || 'Klien'}</p>
          {timeFormatted && <span className="upcoming-card__time">🕒 {timeFormatted}</span>}
        </div>
        <p className="upcoming-card__package">
          {booking.package?.name || 'Paket Foto'}
          {booking.event_location && (
            <span className="upcoming-card__location">
              {' '}• 📍 {booking.event_location}
            </span>
          )}
        </p>
      </div>
      <Badge status={booking.status} size="sm" />
    </Link>
  )
}

function PipelineSection({ pipeline }) {
  const STAGES = [
    { key: 'inquiry', label: 'Inquiry Baru', tab: 'pending', color: '#3b82f6', bg: '#eff6ff' },
    { key: 'dp_paid', label: 'DP Terbayar', tab: 'dp_paid', color: '#f59e0b', bg: '#fffbeb' },
    { key: 'shooting', label: 'Sesi Foto', tab: 'all', color: '#b87357', bg: '#faf5f2' },
    { key: 'editing', label: 'Editing & Retouch', tab: 'editing', color: '#8b5cf6', bg: '#f5f3ff' },
    { key: 'proofing', label: 'Proofing Klien', tab: 'all', color: '#0ea5e9', bg: '#f0f9ff' },
    { key: 'completed', label: 'Proyek Selesai', tab: 'completed', color: '#10b981', bg: '#ecfdf5' },
  ]

  const total = Object.values(pipeline).reduce((s, v) => s + v, 0) || 0

  return (
    <div className="pipeline-container">
      {/* Progress Bar */}
      <div className="pipeline__bar" title={`Total ${total} sesi terdata`}>
        {total === 0 ? (
          <div className="pipeline__segment pipeline__segment--empty" style={{ width: '100%' }} />
        ) : (
          STAGES.map(({ key, color }) => {
            const count = pipeline[key] || 0
            if (count === 0) return null
            const pct = ((count / total) * 100).toFixed(1)
            return (
              <div
                key={key}
                className="pipeline__segment"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            )
          })
        )}
      </div>

      {/* Grid of stages */}
      <div className="pipeline__stage-grid">
        {STAGES.map(({ key, label, tab, color, bg }) => {
          const count = pipeline[key] || 0
          return (
            <Link
              key={key}
              to={`/bookings?tab=${tab}`}
              className="pipeline__stage-item"
              title={`Klik untuk melihat sesi di tahap ${label}`}
            >
              <div className="pipeline__stage-left">
                <span className="pipeline__stage-dot" style={{ backgroundColor: color }} />
                <span className="pipeline__stage-name">{label}</span>
              </div>
              <span
                className="pipeline__stage-badge"
                style={{
                  backgroundColor: count > 0 ? bg : 'var(--rb-bg-secondary)',
                  color: count > 0 ? color : 'var(--rb-text-muted)',
                  fontWeight: count > 0 ? 700 : 500,
                }}
              >
                {count}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="page dashboard">
      <div className="skeleton skeleton--greeting" />
      <div className="dashboard__stats">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton--card" />)}
      </div>
      <div className="dashboard__grid-2">
        {[1, 2].map(i => <div key={i} className="skeleton skeleton--block" />)}
      </div>
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
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)}rb`
  return `Rp ${num}`
}
