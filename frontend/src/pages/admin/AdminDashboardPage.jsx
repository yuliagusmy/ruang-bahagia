import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import adminService from '../../services/adminService'
import Button from '../../components/ui/Button'
import BottomSheet from '../../components/ui/BottomSheet'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import './AdminDashboardPage.css'

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [photographers, setPhotographers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Search
  const [activeTab, setActiveTab] = useState('all') // all | pro | trial | expired
  const [search, setSearch] = useState('')

  // Adjust Subscription Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPg, setSelectedPg] = useState(null)
  const [adjustAction, setAdjustAction] = useState('grant_pro')
  const [adjustDays, setAdjustDays] = useState(30)
  const [submitting, setSubmitting] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [resSummary, resPhotographers] = await Promise.all([
        adminService.getSummary(),
        adminService.getPhotographers({ filter: activeTab, search }),
      ])
      setMetrics(resSummary.data?.data || null)
      setPhotographers(resPhotographers.data?.data?.items || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data Super Admin.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadData()
  }

  const handleOpenAdjust = (pg) => {
    setSelectedPg(pg)
    setAdjustAction('grant_pro')
    setAdjustDays(30)
    setModalOpen(true)
  }

  const handleAdjustSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPg) return

    setSubmitting(true)
    try {
      const res = await adminService.adjustSubscription(selectedPg.id, {
        action: adjustAction,
        days: adjustAction === 'revoke_pro' ? undefined : adjustDays,
      })
      setToastMsg(`✓ ${res.data?.message || 'Status langganan fotografer berhasil diperbarui.'}`)
      setModalOpen(false)
      loadData()
      setTimeout(() => setToastMsg(''), 4000)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui status langganan.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0)

  return (
    <div className="rb-admin-page">
      {/* ── Top Header ────────────────────────────────────────── */}
      <header className="rb-admin-header">
        <div>
          <div className="rb-admin-badge">
            <span>👑 KONTROL PLATFORM</span>
          </div>
          <h1 className="rb-admin-title">Super Admin Dashboard</h1>
          <p className="rb-admin-subtitle">
            Pantau pertumbuhan omzet SaaS platform Ruang Bahagia, aktivitas fotografer terhubung, dan volume adopsi klien.
          </p>
        </div>
        <div className="rb-admin-header-actions">
          <Button variant="secondary" size="sm" onClick={loadData} loading={loading}>
            ↻ Segarkan Data
          </Button>
        </div>
      </header>

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="rb-admin-toast" role="status">
          <span>{toastMsg}</span>
        </div>
      )}

      {error && (
        <div className="rb-admin-alert rb-admin-alert--error" role="alert">
          <span>⚠️ {error}</span>
          <Button size="sm" variant="ghost" onClick={loadData}>Coba Lagi</Button>
        </div>
      )}

      {/* ── 1. Executive Metrics Cards ───────────────────────── */}
      <section className="rb-admin-metrics-grid">
        {/* Metric 1: Total Pendapatan SaaS */}
        <div className="rb-admin-card rb-admin-card--revenue">
          <div className="rb-admin-card__head">
            <span className="rb-admin-card__icon">💰</span>
            <span className="rb-admin-card__tag">Pendapatan SaaS</span>
          </div>
          <strong className="rb-admin-card__val">
            {metrics ? formatRp(metrics.saas_metrics?.total_revenue) : 'Rp 0'}
          </strong>
          <span className="rb-admin-card__desc">
            Bulan ini:{' '}
            <strong>{metrics ? formatRp(metrics.saas_metrics?.revenue_this_month) : 'Rp 0'}</strong>
          </span>
        </div>

        {/* Metric 2: Fotografer Terhubung */}
        <div className="rb-admin-card">
          <div className="rb-admin-card__head">
            <span className="rb-admin-card__icon">📸</span>
            <span className="rb-admin-card__tag">Fotografer Terdaftar</span>
          </div>
          <strong className="rb-admin-card__val">
            {metrics ? metrics.photographer_metrics?.total_registered : 0} FG
          </strong>
          <div className="rb-admin-subtags">
            <span className="rb-subtag rb-subtag--pro">
              ✦ {metrics?.photographer_metrics?.pro_active || 0} Pro
            </span>
            <span className="rb-subtag rb-subtag--trial">
              ⏳ {metrics?.photographer_metrics?.trial_active || 0} Trial
            </span>
          </div>
        </div>

        {/* Metric 3: Klien di Seluruh Ekosistem */}
        <div className="rb-admin-card">
          <div className="rb-admin-card__head">
            <span className="rb-admin-card__icon">👥</span>
            <span className="rb-admin-card__tag">Database Klien Platform</span>
          </div>
          <strong className="rb-admin-card__val">
            {metrics ? metrics.ecosystem_metrics?.total_clients : 0} Klien
          </strong>
          <span className="rb-admin-card__desc">
            Terhubung di seluruh CRM fotografer
          </span>
        </div>

        {/* Metric 4: Sesi Booking & Proofing */}
        <div className="rb-admin-card">
          <div className="rb-admin-card__head">
            <span className="rb-admin-card__icon">📅</span>
            <span className="rb-admin-card__tag">Aktivitas Sesi Foto</span>
          </div>
          <strong className="rb-admin-card__val">
            {metrics ? metrics.ecosystem_metrics?.total_bookings : 0} Booking
          </strong>
          <span className="rb-admin-card__desc">
            {metrics?.ecosystem_metrics?.total_proofing_sessions || 0} sesi swipe proofing
          </span>
        </div>
      </section>

      {/* ── 2. Direktori Fotografer & Metrik Klien ──────────── */}
      <section className="rb-admin-section">
        <div className="rb-admin-section__header">
          <div>
            <h2 className="rb-admin-section__title">Direktori Fotografer Terhubung</h2>
            <p className="rb-admin-section__sub">
              Daftar fotografer freelance terdaftar, jumlah klien yang mereka kelola, serta status masa aktif Pro Studio mereka.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="rb-admin-search-form">
            <input
              type="text"
              placeholder="Cari fotografer, studio, email, atau kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rb-admin-search-input"
            />
            <Button type="submit" size="sm" variant="secondary">Cari</Button>
          </form>
        </div>

        {/* Tabs Filter */}
        <div className="rb-admin-tabs">
          {[
            { id: 'all', label: 'Semua Fotografer' },
            { id: 'pro', label: '✦ Pro Aktif' },
            { id: 'trial', label: '⏳ Masa Trial (20 Hari)' },
            { id: 'expired', label: '✕ Expired' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`rb-admin-tab ${activeTab === tab.id ? 'rb-admin-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List / Table of Photographers */}
        {loading ? (
          <div className="rb-admin-loading-list">
            <Skeleton variant="card" height="90px" />
            <Skeleton variant="card" height="90px" />
            <Skeleton variant="card" height="90px" />
          </div>
        ) : photographers.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Tidak Ada Fotografer"
            description="Tidak ditemukan fotografer dengan kriteria pencarian atau filter yang dipilih."
          />
        ) : (
          <div className="rb-admin-table-wrap">
            <table className="rb-admin-table">
              <thead>
                <tr>
                  <th>Fotografer & Studio</th>
                  <th>Kontak & Kota</th>
                  <th>Jumlah Klien</th>
                  <th>Booking & Sesi</th>
                  <th>Paket Langganan</th>
                  <th>Aksi Kontrol</th>
                </tr>
              </thead>
              <tbody>
                {photographers.map((pg) => {
                  const isPro = pg.is_pro || pg.subscription_tier === 'pro'
                  const isTrial = pg.is_trial
                  const publicProfileUrl = `/@${pg.username || 'user'}`

                  return (
                    <tr key={pg.id}>
                      {/* Nama & Studio */}
                      <td>
                        <div className="rb-admin-user-cell">
                          {pg.avatar_path ? (
                            <img src={pg.avatar_path} alt={pg.name} className="rb-admin-avatar" />
                          ) : (
                            <div className="rb-admin-avatar rb-admin-avatar--initial">
                              {(pg.brand_name || pg.name || 'P').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <strong className="rb-admin-user-name">
                              {pg.brand_name || pg.name}
                            </strong>
                            <div className="rb-admin-user-sub">
                              <span>{pg.name}</span>
                              <Link to={publicProfileUrl} target="_blank" className="rb-admin-handle-link">
                                @{pg.username} ↗
                              </Link>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kontak & Domisili */}
                      <td>
                        <div className="rb-admin-contact-cell">
                          <span className="rb-admin-email">{pg.email}</span>
                          <span className="rb-admin-city">📍 {pg.city || 'Indonesia'}</span>
                          {pg.phone && <span className="rb-admin-phone">📞 {pg.phone}</span>}
                        </div>
                      </td>

                      {/* Jumlah Klien */}
                      <td>
                        <div className="rb-admin-count-badge rb-admin-count-badge--clients">
                          <strong>{pg.clients_count || 0}</strong> Klien
                        </div>
                      </td>

                      {/* Booking & Proofing */}
                      <td>
                        <div className="rb-admin-activity-cell">
                          <span>{pg.bookings_count || 0} Booking</span>
                          <small>{pg.proofing_sessions_count || 0} Sesi Proofing</small>
                        </div>
                      </td>

                      {/* Status Langganan */}
                      <td>
                        {isPro ? (
                          <div className="rb-status-pill rb-status-pill--pro">
                            <span>✦ PRO STUDIO</span>
                            <small>
                              {pg.subscription_expires_at
                                ? `Hingga ${new Date(pg.subscription_expires_at).toLocaleDateString('id-ID')}`
                                : 'Aktif'}
                            </small>
                          </div>
                        ) : isTrial ? (
                          <div className="rb-status-pill rb-status-pill--trial">
                            <span>⏳ TRIAL 20 HARI</span>
                            <small>Sisa {pg.trial_days_remaining ?? 20} hari</small>
                          </div>
                        ) : (
                          <div className="rb-status-pill rb-status-pill--expired">
                            <span>✕ EXPIRED</span>
                            <small>Paket Free</small>
                          </div>
                        )}
                      </td>

                      {/* Aksi Super Admin */}
                      <td>
                        <div className="rb-admin-actions-cell">
                          <button
                            type="button"
                            onClick={() => handleOpenAdjust(pg)}
                            className="rb-admin-btn-adjust"
                            title="Atur masa aktif paket Pro fotografer"
                          >
                            ✦ Atur Pro
                          </button>
                          <Link
                            to={publicProfileUrl}
                            target="_blank"
                            className="rb-admin-btn-view"
                            title="Buka halaman portofolio publik fotografer"
                          >
                            Portofolio ↗
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Modal Atur Langganan Fotografer ─────────────────── */}
      <BottomSheet
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Atur Langganan: ${selectedPg?.brand_name || selectedPg?.name || 'Fotografer'}`}
      >
        {selectedPg && (
          <form onSubmit={handleAdjustSubmit} className="rb-admin-modal-form">
            <div className="rb-admin-modal-info">
              <p>
                Email: <strong>{selectedPg.email}</strong> • Handle: <strong>@{selectedPg.username}</strong>
              </p>
              <p>
                Status Saat Ini:{' '}
                <strong>
                  {selectedPg.is_pro
                    ? 'Pro Studio'
                    : selectedPg.is_trial
                    ? `Trial (${selectedPg.trial_days_remaining} hari tersisa)`
                    : 'Expired'}
                </strong>
              </p>
            </div>

            <div className="rb-field">
              <label className="rb-field__label">Tindakan Otorisasi</label>
              <select
                value={adjustAction}
                onChange={(e) => setAdjustAction(e.target.value)}
                className="rb-field__control"
              >
                <option value="grant_pro">Aktifkan Pro Studio Baru</option>
                <option value="extend_days">Tambah Perpanjangan Masa Pro</option>
                <option value="revoke_pro">Cabut Status Pro (Kembalikan ke Free)</option>
              </select>
            </div>

            {adjustAction !== 'revoke_pro' && (
              <div className="rb-field">
                <label className="rb-field__label">Durasi Hari Tambahan</label>
                <div className="rb-admin-days-picker">
                  {[30, 90, 180, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`rb-admin-day-chip ${adjustDays === d ? 'rb-admin-day-chip--active' : ''}`}
                      onClick={() => setAdjustDays(d)}
                    >
                      +{d} Hari {d === 365 ? '(1 Tahun)' : ''}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={adjustDays}
                  onChange={(e) => setAdjustDays(parseInt(e.target.value, 10) || 1)}
                  className="rb-field__control"
                  style={{ marginTop: 'var(--rb-space-2)' }}
                />
              </div>
            )}

            <div className="rb-admin-modal-actions">
              <Button type="submit" loading={submitting} fullWidth style={{ minHeight: '44px' }}>
                Simpan Perubahan Langganan
              </Button>
            </div>
          </form>
        )}
      </BottomSheet>
    </div>
  )
}
