import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import './FinancialReportPage.css'

const PERIOD_OPTIONS = [
  { key: 'this_month', label: 'Bulan Ini' },
  { key: 'last_month', label: 'Bulan Lalu' },
  { key: 'this_year', label: 'Tahun Ini' },
  { key: 'all', label: 'Semua Periode' },
  { key: 'custom', label: 'Kustom' },
]

export default function FinancialReportPage() {
  const user = useAuthStore((s) => s.user)
  const [period, setPeriod] = useState('this_month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { period }
      if (period === 'custom') {
        if (startDate) params.start_date = startDate
        if (endDate) params.end_date = endDate
      }
      const res = await api.get('/reports/financial', { params })
      setData(res.data.data)
    } catch {
      setError('Gagal memuat laporan keuangan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [period, startDate, endDate])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const formatRp = (val) => {
    const num = Number(val) || 0
    return 'Rp ' + Math.round(num).toLocaleString('id-ID')
  }

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const params = { period }
      if (period === 'custom') {
        if (startDate) params.start_date = startDate
        if (endDate) params.end_date = endDate
      }

      const res = await api.get('/reports/financial/export-csv', {
        params,
        responseType: 'blob',
      })

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `laporan-keuangan-${data?.period?.key || period}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Gagal mengunduh spreadsheet Excel. Silakan periksa koneksi Anda.')
    } finally {
      setExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const summary = data?.summary || {}
  const margin = summary.profit_margin_percent ?? 0
  const marginVariant = margin >= 50 ? 'success' : margin >= 25 ? 'warning' : 'danger'

  return (
    <div className="financial-page">
      {/* ── Kop Khusus Cetak / PDF ─────────────────────────────────────── */}
      <div className="print-header">
        <div className="print-header__top">
          <div>
            <h1 className="print-header__brand">{user?.brand_name || user?.name || 'Studio Ruang Bahagia'}</h1>
            <p className="print-header__subtitle">Laporan Laba Bersih & Keuangan Operasional Sesi Foto</p>
          </div>
          <div className="print-header__meta">
            <span><strong>Periode:</strong> {data?.period?.label || '-'}</span>
            <span><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="print-header__divider" />
      </div>

      {/* ── Toolbar Atas (Layar Web / Mobile) ─────────────────────────── */}
      <div className="financial-toolbar no-print">
        <div className="financial-toolbar__title-group">
          <h1 className="financial-toolbar__title">Laporan Keuangan & Laba Bersih</h1>
          <p className="financial-toolbar__subtitle">
            Kalkulasi omzet, beban operasional per sesi, dan laba bersih studio secara transparan.
          </p>
        </div>

        <div className="financial-toolbar__actions">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={exporting || loading}
          >
            {exporting ? 'Mengunduh...' : '📥 Unduh Excel (.csv)'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            disabled={loading}
          >
            🖨️ Cetak / Unduh PDF
          </Button>
        </div>
      </div>

      {/* ── Filter Periode ────────────────────────────────────────────── */}
      <div className="financial-filters no-print">
        <div className="financial-filters__pills" role="tablist">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              role="tab"
              aria-selected={period === opt.key}
              className={`financial-filters__pill ${period === opt.key ? 'is-active' : ''}`}
              onClick={() => setPeriod(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="financial-filters__custom">
            <div className="financial-filters__date-group">
              <label>Dari Tanggal:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="financial-filters__input"
              />
            </div>
            <div className="financial-filters__date-group">
              <label>Sampai Tanggal:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="financial-filters__input"
              />
            </div>
            <Button size="sm" onClick={fetchReport}>Terapkan</Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="financial-loading">
          <Skeleton height="120px" borderRadius="12px" />
          <Skeleton height="200px" borderRadius="12px" style={{ marginTop: '16px' }} />
        </div>
      ) : error ? (
        <EmptyState title="Terjadi Kendala" description={error} />
      ) : (
        <>
          {/* ── Ringkasan Eksekutif (KPI Cards) ───────────────────────── */}
          <section className="financial-kpis" aria-label="Ringkasan Eksekutif Keuangan">
            <div className="financial-kpi-card financial-kpi-card--revenue">
              <span className="financial-kpi-card__label">Total Omzet / Penerimaan</span>
              <strong className="financial-kpi-card__val">{formatRp(summary.total_revenue)}</strong>
              <span className="financial-kpi-card__sub">{summary.total_bookings} sesi ({summary.completed_bookings} selesai)</span>
            </div>

            <div className="financial-kpi-card financial-kpi-card--expense">
              <span className="financial-kpi-card__label">Total Biaya Operasional</span>
              <strong className="financial-kpi-card__val">{formatRp(summary.total_expenses)}</strong>
              <span className="financial-kpi-card__sub">Sewa studio, kru, cetak & transport</span>
            </div>

            <div className="financial-kpi-card financial-kpi-card--profit">
              <div className="financial-kpi-card__header">
                <span className="financial-kpi-card__label">Laba Bersih (Net Profit)</span>
                <Badge variant={marginVariant}>
                  {margin}% Margin
                </Badge>
              </div>
              <strong className="financial-kpi-card__val financial-kpi-card__val--highlight">
                {formatRp(summary.net_profit)}
              </strong>
              <span className="financial-kpi-card__sub">
                {margin >= 50 ? '✦ Kinerja Sangat Sehat' : margin >= 25 ? '✦ Kinerja Normal' : '✦ Evaluasi Pengeluaran'}
              </span>
            </div>

            <div className="financial-kpi-card financial-kpi-card--receivable">
              <span className="financial-kpi-card__label">Sisa Piutang Klien</span>
              <strong className="financial-kpi-card__val">{formatRp(summary.total_receivable)}</strong>
              <span className="financial-kpi-card__sub">Pelunasan belum ditagihkan</span>
            </div>
          </section>

          {/* ── Alokasi Pos Pengeluaran ───────────────────────────────── */}
          {data?.expenses_by_category && data.expenses_by_category.some((c) => c.total > 0) && (
            <section className="financial-section">
              <h2 className="financial-section__title">Alokasi Biaya Operasional per Kategori</h2>
              <div className="financial-categories-grid">
                {data.expenses_by_category
                  .filter((c) => c.total > 0)
                  .map((cat) => {
                    const pct = summary.total_expenses > 0 ? Math.round((cat.total / summary.total_expenses) * 100) : 0
                    return (
                      <div key={cat.category} className="financial-cat-item">
                        <div className="financial-cat-item__meta">
                          <span className="financial-cat-item__name">{cat.label} ({cat.count})</span>
                          <strong className="financial-cat-item__amount">{formatRp(cat.total)}</strong>
                        </div>
                        <div className="financial-cat-item__track">
                          <div className="financial-cat-item__bar" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="financial-cat-item__pct">{pct}% dari total beban</span>
                      </div>
                    )
                  })}
              </div>
            </section>
          )}

          {/* ── Tabel Rincian Performa Proyek Sesi Foto ───────────────── */}
          <section className="financial-section">
            <div className="financial-section__header">
              <h2 className="financial-section__title">Rincian Laba per Sesi Booking</h2>
              <span className="financial-section__count">{data?.bookings?.length || 0} Proyek</span>
            </div>

            {(!data?.bookings || data.bookings.length === 0) ? (
              <EmptyState title="Belum Ada Sesi Foto" description="Belum ada transaksi sesi pemotretan pada periode ini." />
            ) : (
              <div className="financial-table-wrapper">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Sesi / Klien</th>
                      <th>Paket</th>
                      <th>Tanggal</th>
                      <th className="text-right">Biaya Kontrak</th>
                      <th className="text-right">Biaya Operasional</th>
                      <th className="text-right">Laba Bersih</th>
                      <th className="text-center">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bookings.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <strong>{b.client_name}</strong>
                          <span className="financial-table__code">#{b.booking_code}</span>
                        </td>
                        <td>{b.package_name}</td>
                        <td>{b.event_date || '-'}</td>
                        <td className="text-right font-mono">{formatRp(b.total_price)}</td>
                        <td className="text-right font-mono text-muted">{formatRp(b.total_expenses)}</td>
                        <td className="text-right font-mono font-bold text-success">
                          {formatRp(b.net_profit)}
                        </td>
                        <td className="text-center">
                          <span className={`financial-table__margin-tag ${b.profit_margin >= 50 ? 'is-good' : ''}`}>
                            {b.profit_margin}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Tabel Pengeluaran Terakhir ────────────────────────────── */}
          {data?.recent_expenses && data.recent_expenses.length > 0 && (
            <section className="financial-section no-print">
              <div className="financial-section__header">
                <h2 className="financial-section__title">Pos Pengeluaran Terakhir</h2>
                <span className="financial-section__count">{data.recent_expenses.length} Catatan</span>
              </div>
              <div className="financial-table-wrapper">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Kategori</th>
                      <th>Keterangan</th>
                      <th className="text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_expenses.map((e) => (
                      <tr key={e.id}>
                        <td>{e.expense_date || '-'}</td>
                        <td>
                          <Badge variant="outline">{e.category}</Badge>
                        </td>
                        <td>
                          <strong>{e.title}</strong>
                          {e.notes && <p className="financial-table__note">{e.notes}</p>}
                        </td>
                        <td className="text-right font-mono">{formatRp(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── Tanda Tangan Cetak ────────────────────────────────────── */}
          <div className="print-footer">
            <div className="print-footer__disclaimer">
              Laporan ini dicetak secara otomatis dari sistem operasional studio Ruang Bahagia pada{' '}
              {new Date().toLocaleString('id-ID')}.
            </div>
            <div className="print-footer__signature-box">
              <span className="print-footer__sig-label">Penanggung Jawab Studio</span>
              <div className="print-footer__sig-line" />
              <strong>{user?.name || 'Fotografer'}</strong>
              <small>{user?.brand_name || 'Ruang Bahagia'}</small>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
