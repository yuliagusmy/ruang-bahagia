import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import invoiceService from '../../services/invoiceService'
import Skeleton from '../../components/ui/Skeleton'
import './PublicInvoicePage.css'

export default function PublicInvoicePage() {
  const { code } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedBank, setCopiedBank] = useState(false)

  useEffect(() => {
    if (!code) return
    setLoading(true)
    setError(null)

    invoiceService
      .getPublicInvoice(code)
      .then((res) => {
        setInvoice(res.data)
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Invoice atau bukti reservasi tidak ditemukan.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [code])

  const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0)

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const handleCopyAccount = (number) => {
    if (!number) return
    navigator.clipboard?.writeText(number)
    setCopiedBank(true)
    setTimeout(() => setCopiedBank(false), 2000)
  }

  if (loading) {
    return (
      <div className="rb-invoice-page">
        <div className="rb-invoice-container">
          <Skeleton variant="block" height="40px" style={{ marginBottom: '16px' }} />
          <Skeleton variant="block" height="420px" />
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="rb-invoice-page">
        <div className="rb-invoice-container" style={{ textAlign: 'center', paddingTop: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <h2 style={{ fontFamily: 'var(--rb-font-display)', marginBottom: '8px' }}>
            Invoice Tidak Ditemukan
          </h2>
          <p style={{ color: 'var(--rb-text-muted)', marginBottom: '24px' }}>
            {error || 'Pastikan tautan atau kode booking yang Anda akses sudah benar.'}
          </p>
          <Link
            to="/"
            className="rb-btn rb-btn--primary"
            style={{ display: 'inline-flex', padding: '10px 20px', borderRadius: '8px' }}
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  const { client, package: pkg, addons = [], photographer, payments = [] } = invoice
  const isPaidOff = invoice.remaining_amount <= 0 || invoice.status === 'completed'
  const bank = photographer?.bank_info || {}

  const waNumber = (photographer?.whatsapp || photographer?.phone || '').replace(/^0/, '62').replace(/\D/g, '')
  const waConfirmText = encodeURIComponent(
    `Halo Kak ${photographer?.name || ''} ✨\nSaya ingin konfirmasi pembayaran untuk reservasi sesi:\n\n` +
    `🔖 Kode Booking: #${invoice.booking_code}\n` +
    `👤 Nama Klien: ${client?.name}\n` +
    `📦 Paket: ${pkg?.name}\n` +
    `💰 Sisa Tagihan: ${formatRp(invoice.remaining_amount)}\n\n` +
    `Berikut saya lampirkan bukti transfernya ya Kak. Terima kasih! 🙏`
  )

  return (
    <div className="rb-invoice-page">
      <div className="rb-invoice-container">
        {/* Top Bar */}
        <div className="rb-invoice-topbar">
          <Link to={photographer?.username ? `/@${photographer.username}` : '/'} className="rb-invoice-brand-badge">
            <span>←</span>
            <span>{photographer?.brand_name || 'Ruang Bahagia Studio'}</span>
          </Link>
          <button
            type="button"
            className="rb-invoice-print-btn"
            onClick={() => window.print()}
          >
            🖨️ Cetak / Unduh PDF
          </button>
        </div>

        {/* Invoice Card */}
        <div className="rb-invoice-card">
          {/* Studio Header */}
          <div className="rb-invoice-studio-header">
            <div className="rb-invoice-studio-meta">
              {photographer?.avatar_path ? (
                <img
                  src={photographer.avatar_path}
                  alt={photographer.name}
                  className="rb-invoice-studio-avatar"
                />
              ) : (
                <div className="rb-invoice-studio-avatar-placeholder">
                  {(photographer?.brand_name || photographer?.name || 'R').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="rb-invoice-studio-name">
                  {photographer?.brand_name || photographer?.name || 'Studio Foto'}
                </h1>
                <span className="rb-invoice-verified-badge">
                  ✓ Studio Terverifikasi Ruang Bahagia
                </span>
              </div>
            </div>

            <div className="rb-invoice-meta-side">
              <p className="rb-invoice-doc-label">Kwitansi & Tagihan</p>
              <p className="rb-invoice-code">#{invoice.booking_code}</p>
              <span
                className={`rb-invoice-status-pill ${
                  isPaidOff ? 'rb-invoice-status-pill--paid' : 'rb-invoice-status-pill--unpaid'
                }`}
              >
                {isPaidOff ? '✓ LUNAS PENUH' : 'MENUNGGU PELUNASAN'}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="rb-invoice-details-grid">
            <div>
              <p className="rb-invoice-col-title">Tagihan Kepada</p>
              <p className="rb-invoice-col-main">{client?.name || 'Klien'}</p>
              <p className="rb-invoice-col-sub">{client?.phone || '-'}</p>
              {client?.email && <p className="rb-invoice-col-sub">{client.email}</p>}
            </div>

            <div>
              <p className="rb-invoice-col-title">Jadwal Pemotretan</p>
              <p className="rb-invoice-col-main">{formatDate(invoice.event_date)}</p>
              <p className="rb-invoice-col-sub">
                Pukul {invoice.event_time ? `${invoice.event_time} WIB` : 'Sesuai Jadwal'}
              </p>
              <p className="rb-invoice-col-sub">
                Lokasi: {invoice.event_location || 'Studio Fotografer'}
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="rb-invoice-table-wrap">
            <table className="rb-invoice-table">
              <thead>
                <tr>
                  <th>Layanan & Rincian</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <p className="rb-invoice-item-title">{pkg?.name || 'Paket Sesi Foto'}</p>
                    <p className="rb-invoice-item-desc">
                      {pkg?.duration_hours ? `${pkg.duration_hours} Jam Sesi` : ''} • {pkg?.photo_quota || 20} Foto Kuota Pilihan
                    </p>
                  </td>
                  <td>{formatRp(pkg?.price || invoice.total_price)}</td>
                </tr>

                {/* Add-ons line items */}
                {addons && addons.length > 0 && addons.map((addon, idx) => (
                  <tr key={idx}>
                    <td>
                      <p className="rb-invoice-item-title">
                        <span className="rb-invoice-addon-tag">+ Add-on</span>
                        {addon.name}
                      </p>
                      {addon.quantity > 1 && (
                        <p className="rb-invoice-item-desc">Kuantitas: {addon.quantity}x</p>
                      )}
                    </td>
                    <td>{formatRp(addon.subtotal || addon.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Summary */}
          <div className="rb-invoice-calc-box">
            <div className="rb-invoice-calc-row">
              <span>Total Biaya Sesi</span>
              <strong>{formatRp(invoice.total_price)}</strong>
            </div>

            <div className="rb-invoice-calc-row">
              <span style={{ color: 'var(--rb-success)' }}>
                ✓ Uang Muka (DP) / Terbayar
              </span>
              <strong style={{ color: 'var(--rb-success)' }}>
                - {formatRp(invoice.total_paid || invoice.dp_amount)}
              </strong>
            </div>

            <div className="rb-invoice-calc-row rb-invoice-calc-row--highlight">
              <span>Sisa Tagihan yang Harus Dibayar</span>
              <span className={`rb-invoice-due-amount ${isPaidOff ? 'rb-invoice-paid-zero' : ''}`}>
                {isPaidOff ? 'Rp 0 (Lunas)' : formatRp(invoice.remaining_amount)}
              </span>
            </div>
          </div>

          {/* Payment Account Details (if unpaid) */}
          {!isPaidOff && (
            <div className="rb-invoice-payment-box">
              <div className="rb-invoice-payment-title">
                <span>💳 Metode Pembayaran Resmi Studio</span>
              </div>

              {bank.qris_image_url && (
                <div className="rb-invoice-qris-card" style={{ textAlign: 'center', marginBottom: '1.25rem', padding: '1.25rem 1rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2ded8' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--rb-color-terracotta, #b87357)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    📱 Scan Barcode QRIS Studio
                  </span>
                  <div style={{ margin: '0.75rem auto', maxWidth: '240px', background: '#fff', padding: '6px', border: '1px solid #ede8e1', borderRadius: '8px' }}>
                    <img
                      src={bank.qris_image_url}
                      alt="Barcode QRIS Studio"
                      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--rb-color-muted, #7a6e65)' }}>
                    Scan menggunakan m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, Dana, OVO, ShopeePay)
                  </p>
                </div>
              )}

              <div className="rb-invoice-bank-card">
                <div>
                  <span className="rb-invoice-bank-name">Bank {bank.bank_name || 'BCA'}</span>
                  <p className="rb-invoice-bank-number">
                    {bank.bank_account_number || 'Hubungi WhatsApp Studio'}
                  </p>
                  <p className="rb-invoice-bank-holder">
                    A.N. {bank.bank_account_holder || photographer?.name || 'Studio'}
                  </p>
                </div>
                {bank.bank_account_number && (
                  <button
                    type="button"
                    className="rb-invoice-copy-btn"
                    onClick={() => handleCopyAccount(bank.bank_account_number)}
                  >
                    {copiedBank ? '✓ Tersalin!' : '📋 Salin No. Rek'}
                  </button>
                )}
              </div>

              <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: '#f6f3ee', borderRadius: '8px', fontSize: '0.8125rem', color: '#554942', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>ℹ️ Verifikasi Mutasi Manual:</span>
                {bank.payment_notes ||
                  'Setelah melakukan transfer atau scan QRIS, silakan konfirmasikan bukti pembayaran via WhatsApp di bawah agar pembayaran Anda diverifikasi secara manual oleh fotografer.'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="rb-invoice-floating-bar">
        <div className="rb-invoice-floating-inner">
          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}?text=${waConfirmText}`}
              target="_blank"
              rel="noreferrer"
              className="rb-invoice-btn-wa"
            >
              <span>💬 Konfirmasi via WhatsApp</span>
            </a>
          )}
          <button
            type="button"
            className="rb-invoice-btn-share"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Invoice #${invoice.booking_code} - ${photographer?.brand_name || 'Ruang Bahagia'}`,
                  url: window.location.href,
                }).catch(() => {})
              } else {
                navigator.clipboard?.writeText(window.location.href)
                alert('Tautan invoice berhasil disalin!')
              }
            }}
          >
            🔗 Bagikan Tautan
          </button>
        </div>
      </div>
    </div>
  )
}
