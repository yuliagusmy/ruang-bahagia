import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import packageService from '../../services/package.service'
import scheduleService from '../../services/schedule.service'
import bookingService from '../../services/booking.service'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import './PublicBookingPage.css'

export default function PublicBookingPage() {
  const [searchParams] = useSearchParams()
  const preselectedPkgId = searchParams.get('package')

  const [packages, setPackages] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [error, setError] = useState(null)

  // Tanggal yang dipilih oleh klien untuk melihat jam yang dibuka fotografer
  const [selectedSlotDate, setSelectedSlotDate] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState(null)

  const [form, setForm] = useState({
    package_id: preselectedPkgId || '',
    schedule_id: null,
    name: '',
    phone: '',
    email: '',
    event_date: '',
    event_time: '09:00',
    event_location: '',
    special_requests: '',
  })

  useEffect(() => {
    Promise.allSettled([
      packageService.getPublic(),
      scheduleService.getAvailable(),
    ]).then(([pkgRes, slotRes]) => {
      let activePkgId = ''
      if (pkgRes.status === 'fulfilled') {
        const pkgs = pkgRes.value.data?.data || pkgRes.value.data || []
        setPackages(pkgs)
        const matched = preselectedPkgId && pkgs.find((p) => String(p.id) === String(preselectedPkgId))
        activePkgId = matched ? matched.id : pkgs[0]?.id
        if (activePkgId) setForm((f) => ({ ...f, package_id: activePkgId }))
      }

      if (slotRes.status === 'fulfilled') {
        const slots = slotRes.value.data?.data || slotRes.value.data || []
        setAvailableSlots(slots)

        // Kelompokkan dan set default tanggal slot pertama jika ada
        if (slots.length > 0) {
          const firstDate = slots[0].date?.split('T')[0] || slots[0].date
          setSelectedSlotDate(firstDate)
          setSelectedSlotId(slots[0].id)
          setForm((f) => ({
            ...f,
            schedule_id: slots[0].id,
            event_date: firstDate,
            event_time: slots[0].start_time?.slice(0, 5) || '09:00',
            event_location: slots[0].location || f.event_location,
          }))
        }
      }
      setLoading(false)
    })
  }, [preselectedPkgId])

  // Kelompokkan slot ketersediaan berdasarkan tanggal
  const slotsByDate = useMemo(() => {
    return availableSlots.reduce((acc, slot) => {
      const d = slot.date?.split('T')[0] || slot.date
      if (!acc[d]) acc[d] = []
      acc[d].push(slot)
      return acc
    }, {})
  }, [availableSlots])

  const availableDateList = useMemo(() => {
    return Object.keys(slotsByDate).sort()
  }, [slotsByDate])

  const currentDaySlots = useMemo(() => {
    return selectedSlotDate ? slotsByDate[selectedSlotDate] || [] : []
  }, [slotsByDate, selectedSlotDate])

  const handleSelectDate = (dateStr) => {
    setSelectedSlotDate(dateStr)
    const daySlots = slotsByDate[dateStr] || []
    if (daySlots.length > 0) {
      const firstSlot = daySlots[0]
      setSelectedSlotId(firstSlot.id)
      setForm((f) => ({
        ...f,
        schedule_id: firstSlot.id,
        event_date: dateStr,
        event_time: firstSlot.start_time?.slice(0, 5) || '09:00',
        event_location: firstSlot.location || f.event_location,
      }))
    } else {
      setSelectedSlotId(null)
      setForm((f) => ({ ...f, event_date: dateStr, schedule_id: null }))
    }
  }

  const handleSelectSlot = (slot) => {
    setSelectedSlotId(slot.id)
    setForm((f) => ({
      ...f,
      schedule_id: slot.id,
      event_date: slot.date?.split('T')[0] || slot.date,
      event_time: slot.start_time?.slice(0, 5) || f.event_time,
      event_location: slot.location || f.event_location,
    }))
  }

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await bookingService.requestPublic(form)
      setSuccessData(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim permintaan booking. Periksa kembali formulir Anda.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPkg = packages.find((p) => String(p.id) === String(form.package_id))
  const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0)

  // URL WhatsApp untuk konfirmasi pembayaran DP via QRIS
  const getWhatsAppUrl = () => {
    if (!successData) return '#'
    const rawPhone = successData.whatsapp || '6281234567890'
    const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '62')
    const dp = formatRp(successData.dp_amount || selectedPkg?.dp_amount)
    const brand = successData.brand_name || 'Ruang Bahagia Studio'

    const message = `Halo ${brand}!\n\nSaya ingin konfirmasi pemesanan sesi foto:\n` +
      `• Kode Booking: #${successData.booking_code}\n` +
      `• Nama: ${form.name}\n` +
      `• Paket: ${selectedPkg?.name || '-'}\n` +
      `• Jadwal: ${form.event_date} (${form.event_time})\n` +
      `• Lokasi: ${form.event_location || 'Sesuai kesepakatan'}\n` +
      `• Nominal DP: ${dp}\n\n` +
      `Saya telah menyelesaikan pembayaran uang muka (DP) melalui QRIS. Berikut saya lampirkan bukti transfer pembayarannya. Mohon konfirmasinya ya, terima kasih!`

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
  }

  // ── Layar Berhasil Booking + Instruksi Pembayaran QRIS & Tombol WA ────
  if (successData) {
    const dpNominal = formatRp(successData.dp_amount || selectedPkg?.dp_amount)

    return (
      <div className="rb-public-book rb-public-book--success">
        <div className="rb-public-book__success-card">
          <div className="rb-public-book__check-icon" aria-hidden="true">✓</div>
          <span className="rb-public-book__badge">Reservasi Diterima</span>
          <h2 className="rb-public-book__title">Terima Kasih, {form.name}!</h2>
          <p className="rb-public-book__sub">
            Permintaan jadwal sesi foto Anda telah berhasil dibuat. Silakan selesaikan pembayaran DP melalui QRIS di bawah ini.
          </p>

          <div className="rb-public-book__code-box">
            <span className="rb-public-book__code-label">Kode Booking Anda:</span>
            <span className="rb-public-book__code-val">#{successData.booking_code}</span>
          </div>

          <div className="rb-public-book__info-box">
            <div className="rb-info-row">
              <span>Paket Foto:</span>
              <strong>{selectedPkg?.name}</strong>
            </div>
            <div className="rb-info-row">
              <span>Jadwal Sesi:</span>
              <strong>{form.event_date} &bull; {form.event_time} WIB</strong>
            </div>
            {form.event_location && (
              <div className="rb-info-row">
                <span>Lokasi:</span>
                <strong>{form.event_location}</strong>
              </div>
            )}
            <div className="rb-info-row rb-info-row--highlight">
              <span>Uang Muka (DP) Wajib:</span>
              <strong className="rb-price-highlight">{dpNominal}</strong>
            </div>
          </div>

          {/* ── Box Pembayaran QRIS ───────────────────────────── */}
          <div className="rb-qris-card">
            <div className="rb-qris-card__header">
              <span className="rb-qris-card__tag">Pembayaran Resmi</span>
              <h3 className="rb-qris-card__title">Scan QRIS untuk Pembayaran DP</h3>
              <p className="rb-qris-card__desc">
                Scan kode QRIS di bawah ini dengan aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, Dana, ShopeePay).
              </p>
            </div>

            <div className="rb-qris-card__image-wrap">
              <img
                src="/qris.jpg"
                alt="QRIS Ruang Bahagia Studio"
                className="rb-qris-card__image"
              />
            </div>

            <div className="rb-qris-card__amount-bar">
              <span>Jumlah Transfer DP:</span>
              <strong>{dpNominal}</strong>
            </div>
          </div>

          {/* ── Tombol Konfirmasi WhatsApp ──────────────────────── */}
          <div className="rb-public-book__wa-action">
            <p className="rb-public-book__wa-desc">
              Setelah melakukan scan pembayaran, klik tombol di bawah untuk mengirim bukti transfer langsung ke WhatsApp fotografer:
            </p>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="rb-public-book__wa-btn"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>Konfirmasi Pembayaran via WhatsApp</span>
            </a>
          </div>

          <div className="rb-public-book__success-footer">
            <Link to="/" className="rb-public-book__home-link">
              &larr; Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Layar Form Pengisian Pemesanan ──────────────────────────────────
  return (
    <div className="rb-public-book">
      <div className="rb-public-book__hero">
        <span className="rb-public-book__tag">Reservasi Sesi Foto</span>
        <h1 className="rb-public-book__headline">Abadikan Cerita Bahagia Anda</h1>
        <p className="rb-public-book__lead">
          Pilih paket dan slot tanggal yang telah disediakan oleh fotografer.
        </p>
      </div>

      {loading ? (
        <div className="rb-public-book__loading">
          <Skeleton variant="card" height="140px" />
          <Skeleton variant="card" height="140px" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rb-public-book__form">
          {error && <div className="rb-public-book__error" role="alert">{error}</div>}

          <div className="rb-public-book__grid-layout">
            <div className="rb-public-book__col-left">
              {/* Section 1: Pilih Paket */}
              <div className="rb-public-book__section">
                <h3 className="rb-public-book__sec-title">1. Pilih Paket Layanan</h3>
                <div className="rb-public-book__pkg-list">
                  {packages.map((pkg) => {
                    const isSelected = String(form.package_id) === String(pkg.id)
                    return (
                      <label key={pkg.id} className={`rb-pkg-radio ${isSelected ? 'rb-pkg-radio--selected' : ''}`}>
                        <input
                          type="radio"
                          name="package_id"
                          value={pkg.id}
                          checked={isSelected}
                          onChange={handleChange}
                          className="rb-pkg-radio__input"
                        />
                        <div className="rb-pkg-radio__body">
                          <div className="rb-pkg-radio__row">
                            <span className="rb-pkg-radio__name">{pkg.name}</span>
                            <span className="rb-pkg-radio__price">{formatRp(pkg.price)}</span>
                          </div>
                          {pkg.description && <p className="rb-pkg-radio__desc">{pkg.description}</p>}
                          <div className="rb-pkg-radio__specs">
                            <span>⏱️ {pkg.duration_hours || 2} Jam</span>
                            <span>📸 {pkg.photo_quota} Foto</span>
                            <span>DP {formatRp(pkg.dp_amount || pkg.price * 0.3)}</span>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Section 2: Pilih Tanggal & Waktu dari Fotografer */}
              <div className="rb-public-book__section">
                <h3 className="rb-public-book__sec-title">2. Pilih Jadwal yang Disediakan Fotografer</h3>

                {availableDateList.length > 0 ? (
                  <div className="rb-slot-picker">
                    <p className="rb-slot-picker__label">Tanggal yang Tersedia:</p>
                    <div className="rb-slot-picker__dates">
                      {availableDateList.map((dStr) => {
                        const isDateSelected = selectedSlotDate === dStr
                        const count = slotsByDate[dStr]?.length || 0
                        const dateObj = new Date(dStr)
                        const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' })
                        const dayNum = dateObj.getDate()
                        const monthName = dateObj.toLocaleDateString('id-ID', { month: 'short' })

                        return (
                          <button
                            key={dStr}
                            type="button"
                            onClick={() => handleSelectDate(dStr)}
                            className={`rb-date-chip ${isDateSelected ? 'rb-date-chip--selected' : ''}`}
                          >
                            <span className="rb-date-chip__day">{dayName}</span>
                            <span className="rb-date-chip__num">{dayNum}</span>
                            <span className="rb-date-chip__month">{monthName}</span>
                            <span className="rb-date-chip__badge">{count} slot</span>
                          </button>
                        )
                      })}
                    </div>

                    <p className="rb-slot-picker__label rb-slot-picker__label--time">
                      Pilih Jam Sesi ({selectedSlotDate}):
                    </p>

                    <div className="rb-slot-picker__times">
                      {currentDaySlots.map((slot) => {
                        const isSlotSelected = selectedSlotId === slot.id
                        const startTime = slot.start_time?.slice(0, 5)
                        const endTime = slot.end_time?.slice(0, 5)

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => handleSelectSlot(slot)}
                            className={`rb-time-chip ${isSlotSelected ? 'rb-time-chip--selected' : ''}`}
                          >
                            <div className="rb-time-chip__header">
                              <span className="rb-time-chip__clock">🕒 {startTime} - {endTime} WIB</span>
                              {isSlotSelected && <span className="rb-time-chip__check">✓ Terpilih</span>}
                            </div>
                            {slot.location && (
                              <span className="rb-time-chip__loc">📍 {slot.location}</span>
                            )}
                            {slot.notes && (
                              <span className="rb-time-chip__notes">{slot.notes}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rb-slot-picker__fallback">
                    <p className="rb-slot-picker__fallback-note">
                      Fotografer membuka jadwal fleksibel. Silakan pilih tanggal dan jam yang Anda inginkan:
                    </p>
                    <div className="rb-public-book__row-2">
                      <Input
                        label="Tanggal Sesi"
                        type="date"
                        name="event_date"
                        value={form.event_date}
                        onChange={handleChange}
                        required
                      />
                      <Input
                        label="Jam Mulai"
                        type="time"
                        name="event_time"
                        value={form.event_time}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="rb-slot-picker__location-input">
                  <Input
                    label="Rencana Lokasi / Venue Sesi"
                    name="event_location"
                    placeholder="Contoh: Studio Utama Ruang Bahagia / Hutan Kota GBK"
                    value={form.event_location}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="rb-public-book__col-right">
              {/* Section 3: Data Klien */}
              <div className="rb-public-book__section">
                <h3 className="rb-public-book__sec-title">3. Informasi Kontak Anda</h3>
                <Input
                  label="Nama Lengkap"
                  name="name"
                  placeholder="Nama Anda"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="No. WhatsApp Aktif"
                  name="phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={handleChange}
                  helper="Digunakan untuk konfirmasi bukti transfer DP via WhatsApp."
                  required
                />
                <Input
                  label="Email (Opsional)"
                  name="email"
                  type="email"
                  placeholder="email@anda.com"
                  value={form.email}
                  onChange={handleChange}
                />
                <Input
                  label="Catatan / Konsep Foto (Opsional)"
                  name="special_requests"
                  as="textarea"
                  placeholder="Ceritakan gaya foto yang disukai, pakaian, atau jumlah orang."
                  value={form.special_requests}
                  onChange={handleChange}
                />
              </div>

              {/* Rincian Biaya */}
              {selectedPkg && (
                <div className="rb-public-book__summary">
                  <div className="rb-public-book__summary-row">
                    <span>Total Biaya Paket:</span>
                    <strong>{formatRp(selectedPkg.price)}</strong>
                  </div>
                  <div className="rb-public-book__summary-row rb-public-book__summary-row--dp">
                    <span>Uang Muka (DP via QRIS):</span>
                    <strong>{formatRp(selectedPkg.dp_amount || selectedPkg.price * 0.3)}</strong>
                  </div>
                  <p className="rb-public-book__summary-note">
                    * QRIS dan instruksi pembayaran DP akan ditampilkan di langkah berikutnya.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                loading={submitting}
                disabled={!form.package_id || !form.name || !form.phone || !form.event_date}
              >
                Lanjut ke Pembayaran QRIS &rarr;
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
