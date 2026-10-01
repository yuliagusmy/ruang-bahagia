import './InvoiceReceiptModal.css'

export default function InvoiceReceiptModal({ isOpen, onClose, booking, user }) {
  if (!isOpen || !booking) return null

  const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0)

  const dateFormatted = booking.event_date
    ? new Date(booking.event_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-'

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const totalPrice = Number(booking.total_price) || 0
  const dpAmount = Number(booking.dp_amount) || 0

  // Hitung pembayaran riil
  const payments = booking.payments || []
  const confirmedPayments = payments.filter((p) => p.status === 'confirmed')
  const totalPaid = confirmedPayments.length > 0
    ? confirmedPayments.reduce((acc, p) => acc + Number(p.amount), 0)
    : (booking.dp_paid_at ? dpAmount : 0)

  const remaining = Math.max(0, totalPrice - totalPaid)
  const isPaidOff = remaining === 0 || booking.status === 'completed'
  const isDpPaid = totalPaid > 0 || !!booking.dp_paid_at

  const clientName = booking.client?.name || 'Klien'
  const clientPhone = booking.client?.phone || '-'
  const brandName = user?.brand_name || 'Ruang Bahagia Photography'
  const photographerName = user?.name || 'Fotografer'
  const brandPhone = user?.whatsapp || user?.phone || '-'

  const handlePrint = () => {
    window.print()
  }

  const handleShareWhatsApp = () => {
    const statusText = isPaidOff ? 'LUNAS ✅' : (isDpPaid ? 'DP TERBAYAR 🟡' : 'MENUNGGU DP ⏳')
    const message = `*KWITANSI / INVOICE RESMI* 📄\n*${brandName}*\n\n` +
      `No. Invoice: #INV-${booking.booking_code}\n` +
      `Tanggal: ${todayFormatted}\n` +
      `Nama Klien: ${clientName}\n` +
      `Paket: ${booking.package?.name || 'Dokumentasi'}\n` +
      `Tanggal Sesi: ${dateFormatted}\n\n` +
      `*RINCIAN BIAYA:*\n` +
      `Total Biaya: ${formatRp(totalPrice)}\n` +
      `Total Terbayar: ${formatRp(totalPaid)}\n` +
      `Sisa Tagihan: ${formatRp(remaining)}\n` +
      `Status: *${statusText}*\n\n` +
      `Terima kasih telah mempercayakan momen bahagia Anda bersama ${brandName}! 🙏`

    let phone = clientPhone.replace(/\D/g, '')
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1)
    }

    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`

    window.open(waUrl, '_blank')
  }

  return (
    <div className="rb-invoice-modal-backdrop" onClick={onClose}>
      <div className="rb-invoice-modal" onClick={(e) => e.stopPropagation()}>
        {/* Toolbar (Disembunyikan saat cetak) */}
        <div className="rb-invoice-modal__toolbar">
          <div className="rb-invoice-modal__title-bar">
            <span>📄</span>
            <span>Kwitansi / Invoice Digital #{booking.booking_code}</span>
          </div>
          <div className="rb-invoice-modal__actions">
            <button type="button" className="rb-invoice-btn" onClick={handleShareWhatsApp}>
              📲 Kirim WA
            </button>
            <button type="button" className="rb-invoice-btn rb-invoice-btn--print" onClick={handlePrint}>
              🖨️ Cetak / PDF
            </button>
            <button type="button" className="rb-invoice-btn" onClick={onClose} aria-label="Tutup">
              ✕
            </button>
          </div>
        </div>

        {/* Paper Document */}
        <div className="rb-invoice-paper">
          {/* Header */}
          <div className="rb-invoice-header">
            <div className="rb-invoice-brand">
              <h2>{brandName}</h2>
              <p>Oleh: {photographerName}</p>
              <p>Kontak: {brandPhone}</p>
            </div>
            <div className="rb-invoice-meta">
              <div className="rb-invoice-num">#INV-{booking.booking_code}</div>
              <div className="rb-invoice-date">Diterbitkan: {todayFormatted}</div>
              <div className={`rb-invoice-stamp ${
                isPaidOff
                  ? 'rb-invoice-stamp--paid'
                  : isDpPaid
                  ? 'rb-invoice-stamp--dp'
                  : 'rb-invoice-stamp--unpaid'
              }`}>
                {isPaidOff ? 'LUNAS' : isDpPaid ? 'DP DITERIMA' : 'MENUNGGU DP'}
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="rb-invoice-bill-to">
            <div className="rb-invoice-bill-col">
              <label>Ditujukan Kepada:</label>
              <strong>{clientName}</strong>
              <span>{clientPhone}</span>
              {booking.client?.email && <span>{booking.client.email}</span>}
            </div>
            <div className="rb-invoice-bill-col">
              <label>Rincian Pelaksanaan Sesi:</label>
              <strong>{dateFormatted} ({booking.event_time ? `${booking.event_time} WIB` : 'Sesuai Jadwal'})</strong>
              <span>Lokasi: {booking.event_location || booking.location || 'Studio'}</span>
              <span>Tipe: {booking.event_type || 'Photography Session'}</span>
            </div>
          </div>

          {/* Table */}
          <div className="rb-invoice-table-wrap">
            <table className="rb-invoice-table">
              <thead>
                <tr>
                  <th>Layanan & Deskripsi</th>
                  <th>Keterangan</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>{booking.package?.name || 'Paket Dokumentasi'}</strong>
                    <div style={{ fontSize: 11, color: 'var(--rb-stone-600)', marginTop: 2 }}>
                      {booking.package?.description || 'Dokumentasi foto profesional'}
                    </div>
                  </td>
                  <td>
                    {booking.package?.duration_minutes ? `${booking.package.duration_minutes} Menit` : '1 Sesi'} •{' '}
                    {booking.package?.photo_quota ? `${booking.package.photo_quota} Foto Final` : '-'}
                  </td>
                  <td>{formatRp(totalPrice)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Box */}
          <div className="rb-invoice-summary">
            <div className="rb-invoice-summary-box">
              <div className="rb-invoice-summary-row">
                <span>Subtotal:</span>
                <span>{formatRp(totalPrice)}</span>
              </div>
              <div className="rb-invoice-summary-row">
                <span>Uang Muka (DP):</span>
                <span>{formatRp(dpAmount)}</span>
              </div>
              <div className="rb-invoice-summary-row">
                <span>Total Terbayar:</span>
                <span style={{ color: 'var(--rb-success)', fontWeight: 600 }}>{formatRp(totalPaid)}</span>
              </div>
              <div className="rb-invoice-summary-row rb-invoice-summary-row--total">
                <span>Sisa Tagihan:</span>
                <span className={remaining > 0 ? 'rb-invoice-summary-row--remaining' : ''}>
                  {formatRp(remaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Notes */}
          <div className="rb-invoice-footer">
            <p>
              Dokumen ini merupakan bukti konfirmasi transaksi resmi dari <strong>{brandName}</strong>.
              {remaining > 0 && ' Mohon menyelesaikan sisa pembayaran sebelum atau pada saat serah terima foto final.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
