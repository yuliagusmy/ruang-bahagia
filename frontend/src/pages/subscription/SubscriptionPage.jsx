import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import subscriptionService from '../../services/subscription.service'
import { useAuthStore } from '../../stores/authStore'
import Skeleton from '../../components/ui/Skeleton'
import SubscriptionCheckoutModal from './components/SubscriptionCheckoutModal'
import './SubscriptionPage.css'

export default function SubscriptionPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Billing Cycle: 'monthly' | 'yearly'
  const [billingCycle, setBillingCycle] = useState('yearly')
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)

  const fetchStatus = () => {
    setLoading(true)
    subscriptionService
      .getStatus()
      .then((res) => {
        setData(res.data)
        if (res.data?.is_pro !== user?.is_pro) {
          setUser({ ...user, is_pro: res.data.is_pro, subscription_tier: res.data.tier })
        }
      })
      .catch(() => setError('Gagal memuat informasi langganan studio.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handlePaymentSuccess = (updatedUser) => {
    if (updatedUser) {
      setUser(updatedUser)
    }
    setSuccessMessage('Selamat! Pembayaran berhasil. Akun studio Anda kini berstatus Pro Studio aktif.')
    fetchStatus()
    setTimeout(() => setSuccessMessage(null), 7000)
  }

  const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0)

  const isPro = data?.is_pro || false
  const isTrial = data?.is_trial || false
  const trialDays = data?.trial_days_remaining ?? 10
  const monthlyPrice = 49000
  const yearlyPrice = 490000

  return (
    <div className="page rb-sub-page">
      {/* ── Top Header ───────────────────────────────── */}
      <div className="rb-sub-page__header">
        <div>
          <span className="rb-sub-page__eyebrow">Monetisasi & Kapasitas Studio</span>
          <h2 className="rb-sub-page__title">Paket Berlangganan</h2>
        </div>
      </div>

      {successMessage && (
        <div className="rb-sub-alert rb-sub-alert--success">
          <span className="rb-sub-alert__icon">🎉</span>
          <div className="rb-sub-alert__text">
            <strong>Berhasil!</strong> {successMessage}
          </div>
        </div>
      )}

      {loading ? (
        <div className="rb-sub-page__loading">
          <Skeleton variant="block" height="120px" />
          <Skeleton variant="block" height="200px" />
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button className="rb-btn rb-btn--secondary" onClick={fetchStatus}>
            Coba Lagi
          </button>
        </div>
      ) : (
        <div className="rb-sub-page__body">
          {/* ── Current Active Status Card ─────────────── */}
          <section className={`rb-sub-status-card ${isPro ? 'rb-sub-status-card--pro' : ''}`}>
            <div className="rb-sub-status-card__top">
              <div className="rb-sub-status-card__badge-row">
                <span className={`rb-tier-badge ${isPro ? 'rb-tier-badge--pro' : 'rb-tier-badge--free'}`}>
                  {isTrial ? `Masa Uji Coba Pro (${trialDays} Hari) ✦` : isPro ? 'Pro Studio ✦' : 'Paket Starter (Gratis)'}
                </span>
                {isTrial ? (
                  <span className="rb-sub-status-card__days" style={{ color: 'var(--rb-color-terracotta, #b87357)', fontWeight: '600' }}>
                    Sisa masa uji coba: <strong>{trialDays} hari lagi</strong>
                  </span>
                ) : isPro && data.days_remaining !== null ? (
                  <span className="rb-sub-status-card__days">
                    Masa aktif: <strong>{data.days_remaining} hari lagi</strong>
                  </span>
                ) : null}
              </div>

              <h3 className="rb-sub-status-card__title">
                {isTrial
                  ? 'Uji Coba Gratis 10 Hari Sedang Aktif'
                  : isPro
                  ? 'Studio Anda Beroperasi Tanpa Batas'
                  : 'Tingkatkan Studio Anda ke Level Profesional'}
              </h3>
              <p className="rb-sub-status-card__desc">
                {isTrial
                  ? `Selamat! Anda sedang menikmati seluruh fitur Pro Studio secara gratis selama masa uji coba 10 hari. Buat paket sebanyak yang Anda mau, terima booking tanpa batas, dan gunakan fitur swipe proofing Google Drive secara bebas.`
                  : isPro
                  ? 'Nikmati kebebasan mengelola paket, booking, dan client proofing tanpa batas dengan identitas brand eksklusif.'
                  : 'Akun Starter memiliki batas 2 paket layanan dan 5 booking per bulan. Beralih ke Pro Studio untuk kapasitas tanpa batas.'}
              </p>
            </div>

            {/* Quota Usage Meters */}
            <div className="rb-sub-meters">
              <div className="rb-sub-meter">
                <div className="rb-sub-meter__header">
                  <span className="rb-sub-meter__label">Paket Layanan</span>
                  <span className="rb-sub-meter__val">
                    {data.usage.packages_count} / {isPro ? '∞' : data.usage.packages_limit}
                  </span>
                </div>
                <div className="rb-sub-meter__bar">
                  <div
                    className="rb-sub-meter__fill"
                    style={{
                      width: isPro ? '25%' : `${Math.min(100, (data.usage.packages_count / (data.usage.packages_limit || 2)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rb-sub-meter">
                <div className="rb-sub-meter__header">
                  <span className="rb-sub-meter__label">Booking Bulan Ini</span>
                  <span className="rb-sub-meter__val">
                    {data.usage.bookings_this_month} / {isPro ? '∞' : data.usage.bookings_limit}
                  </span>
                </div>
                <div className="rb-sub-meter__bar">
                  <div
                    className="rb-sub-meter__fill"
                    style={{
                      width: isPro ? '20%' : `${Math.min(100, (data.usage.bookings_this_month / (data.usage.bookings_limit || 5)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rb-sub-meter">
                <div className="rb-sub-meter__header">
                  <span className="rb-sub-meter__label">Sesi Client Proofing</span>
                  <span className="rb-sub-meter__val">
                    {data.usage.proofing_count} / {isPro ? '∞' : data.usage.proofing_limit}
                  </span>
                </div>
                <div className="rb-sub-meter__bar">
                  <div
                    className="rb-sub-meter__fill"
                    style={{
                      width: isPro ? '15%' : `${Math.min(100, (data.usage.proofing_count / (data.usage.proofing_limit || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Billing Cycle Selector ──────────────────── */}
          <div className="rb-sub-billing-toggle">
            <span className="rb-sub-billing-toggle__label">Periode Langganan:</span>
            <div className="rb-sub-billing-toggle__pills">
              <button
                type="button"
                className={`rb-sub-pill ${billingCycle === 'monthly' ? 'rb-sub-pill--active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Bulanan
              </button>
              <button
                type="button"
                className={`rb-sub-pill ${billingCycle === 'yearly' ? 'rb-sub-pill--active' : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                <span>Tahunan</span>
                <span className="rb-sub-pill__badge">Hemat 2 Bulan</span>
              </button>
            </div>
          </div>

          {/* ── Pricing Comparison Cards ────────────────── */}
          <div className="rb-pricing-grid">
            {/* Starter Card */}
            <div className={`rb-price-card ${!isPro ? 'rb-price-card--current' : ''}`}>
              {!isPro && <div className="rb-price-card__ribbon">Paket Aktif</div>}
              <div className="rb-price-card__header">
                <h4 className="rb-price-card__tier">Starter</h4>
                <p className="rb-price-card__target">Untuk fotografer yang baru mulai merintis</p>
                <div className="rb-price-card__cost">
                  <span className="rb-price-card__currency">Rp</span>
                  <span className="rb-price-card__number">0</span>
                  <span className="rb-price-card__period">/selamanya</span>
                </div>
              </div>

              <ul className="rb-price-card__features">
                <li>✓ Link Profil Personal (<code>/@username</code>)</li>
                <li>✓ Maksimal 2 Paket Layanan</li>
                <li>✓ Maksimal 5 Booking per Bulan</li>
                <li>✓ 1 Sesi Client Proofing (50 foto)</li>
                <li>✓ Reservasi Online & Konfirmasi DP</li>
                <li className="rb-price-feature--muted">✗ Watermark Ruang Bahagia Aktif</li>
                <li className="rb-price-feature--muted">✗ Ekspor Data Klien & Laporan</li>
              </ul>

              <div className="rb-price-card__action">
                <button
                  type="button"
                  disabled
                  className="rb-btn rb-btn--ghost rb-btn--full"
                >
                  {!isPro ? 'Paket Aktif Saat Ini' : 'Tingkat Dasar'}
                </button>
              </div>
            </div>

            {/* Pro Studio Card */}
            <div className={`rb-price-card rb-price-card--featured ${isPro ? 'rb-price-card--current-pro' : ''}`}>
              <div className="rb-price-card__ribbon rb-price-card__ribbon--gold">
                {isPro ? 'Paket Aktif Anda' : 'Paling Direkomendasikan ✦'}
              </div>

              <div className="rb-price-card__header">
                <h4 className="rb-price-card__tier">Pro Studio</h4>
                <p className="rb-price-card__target">Untuk fotografer profesional & pemilik studio aktif</p>
                <div className="rb-price-card__cost">
                  <span className="rb-price-card__currency">Rp</span>
                  <span className="rb-price-card__number">
                    {billingCycle === 'yearly' ? '490.000' : '49.000'}
                  </span>
                  <span className="rb-price-card__period">
                    {billingCycle === 'yearly' ? '/tahun (Rp 40rb/bln)' : '/bulan'}
                  </span>
                </div>
              </div>

              <ul className="rb-price-card__features">
                <li>✓ <strong>Unlimited</strong> Paket Layanan</li>
                <li>✓ <strong>Unlimited</strong> Booking & Kalender Jadwal</li>
                <li>✓ <strong>Unlimited</strong> Sesi Client Proofing (Foto Tanpa Batas)</li>
                <li>✓ <strong>Tanpa Watermark</strong> (Full Branding Studio Anda Sendiri)</li>
                <li>✓ <strong>Lencana Studio Terverifikasi Emas ✦</strong></li>
                <li>✓ <strong>Ekspor Rekap Klien & Keuangan</strong> ke Excel</li>
                <li>✓ Prioritas Layanan & Bantuan Operasional</li>
              </ul>

              <div className="rb-price-card__action">
                <button
                  type="button"
                  className="rb-btn rb-btn--primary rb-btn--full"
                  onClick={() => setUpgradeModalOpen(true)}
                >
                  {isPro ? 'Perpanjang Masa Aktif Pro ✦' : 'Upgrade ke Pro Studio Sekarang ✦'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Midtrans Snap Checkout Modal ───────────── */}
      <SubscriptionCheckoutModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        billingCycle={billingCycle}
        price={billingCycle === 'yearly' ? yearlyPrice : monthlyPrice}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
