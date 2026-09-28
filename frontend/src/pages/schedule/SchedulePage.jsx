import { useState } from 'react'
import { useSchedules } from '../../hooks/useSchedules'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import BottomSheet from '../../components/ui/BottomSheet'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import './SchedulePage.css'

export default function SchedulePage() {
  const { schedules, loading, error, refetch, createSchedule, deleteSchedule } = useSchedules()
  const [selectedDate] = useState(new Date().toISOString().split('T')[0])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    date: '',
    start_time: '09:00',
    end_time: '12:00',
    status: 'available',
    location: '',
    notes: '',
  })

  const openSheetForDate = (date, status = 'available') => {
    setForm({
      date: date || selectedDate,
      start_time: '09:00',
      end_time: '12:00',
      status,
      location: '',
      notes: '',
    })
    setSheetOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createSchedule(form)
      setSheetOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  // Group schedules by date or display chronological list
  const sorted = [...schedules].sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="page rb-schedule-page">
      <div className="rb-schedule-page__top">
        <div>
          <h2 className="rb-schedule-page__title">Kalender Kerja & Slot</h2>
          <p className="rb-schedule-page__sub">
            Atur tanggal dan jam yang ingin ditampilkan di halaman booking klien.
          </p>
        </div>
        <div className="rb-schedule-page__actions">
          <Button size="sm" onClick={() => openSheetForDate(selectedDate, 'available')}>
            + Buka Slot Sesi
          </Button>
          <Button size="sm" variant="secondary" onClick={() => openSheetForDate(selectedDate, 'blocked')}>
            Tandai Libur
          </Button>
        </div>
      </div>

      <div className="rb-schedule-page__legend">
        <span className="rb-schedule-page__legend-item">
          <span className="rb-dot rb-dot--available" /> Tersedia di Web Klien
        </span>
        <span className="rb-schedule-page__legend-item">
          <span className="rb-dot rb-dot--booked" /> Terisi Booking
        </span>
        <span className="rb-schedule-page__legend-item">
          <span className="rb-dot rb-dot--blocked" /> Libur / Tutup
        </span>
      </div>

      <div className="rb-schedule-page__content">
        {loading ? (
          <div className="rb-schedule-page__loading">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="block" height="80px" />
            ))}
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <Button size="sm" onClick={refetch} variant="secondary">Coba Lagi</Button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="rb-schedule-page__empty">
            <p>Belum ada slot waktu yang dibuka.</p>
            <p className="rb-schedule-page__empty-sub">
              Tambahkan tanggal dan jam ketersediaan Anda agar calon klien dapat memilih jadwal saat melakukan booking.
            </p>
            <Button size="sm" onClick={() => openSheetForDate(selectedDate, 'available')} className="rb-schedule-page__empty-btn">
              + Buka Slot Sesi Pertama
            </Button>
          </div>
        ) : (
          <div className="rb-schedule-page__list">
            {sorted.map((item) => {
              const d = new Date(item.date)
              const formatted = d.toLocaleDateString('id-ID', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
              })

              return (
                <div key={item.id} className="rb-schedule-card">
                  <div className="rb-schedule-card__left">
                    <div className="rb-schedule-card__header">
                      <p className="rb-schedule-card__date">{formatted}</p>
                      <span className="rb-schedule-card__time">
                        {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                      </span>
                    </div>
                    {item.location && (
                      <p className="rb-schedule-card__loc">📍 {item.location}</p>
                    )}
                    {item.notes && <p className="rb-schedule-card__note">{item.notes}</p>}
                  </div>
                  <div className="rb-schedule-card__right">
                    <Badge status={item.status} size="sm" />
                    <button
                      className="rb-schedule-card__del"
                      onClick={() => deleteSchedule(item.id)}
                      aria-label="Hapus slot jadwal"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={form.status === 'available' ? 'Buka Slot Sesi Foto' : 'Tandai Tanggal Libur'}
      >
        <form onSubmit={handleSubmit} className="rb-schedule-form">
          <Input
            type="date"
            label="Tanggal Sesi"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />

          <div className="rb-schedule-form__row">
            <Input
              type="time"
              label="Jam Mulai"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              required
            />
            <Input
              type="time"
              label="Jam Selesai"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              required
            />
          </div>

          <div className="rb-field">
            <label className="rb-field__label">Status Ketersediaan</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="rb-field__control"
            >
              <option value="available">Tersedia (Bisa dipilih klien di Web)</option>
              <option value="blocked">Libur / Tutup (Tidak bisa dipilih)</option>
            </select>
          </div>

          <Input
            label="Lokasi Sesi (Opsional)"
            placeholder="Contoh: Studio Utama / Outdoor Area"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />

          <Input
            label="Catatan Slot (Opsional)"
            placeholder="Contoh: Slot pagi golden hour, bawa 2 outfit"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <Button type="submit" fullWidth loading={submitting}>
            Simpan Slot Jadwal
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
