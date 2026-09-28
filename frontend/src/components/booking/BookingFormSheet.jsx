import { useState } from 'react'
import BottomSheet from '../ui/BottomSheet'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { usePackages } from '../../hooks/usePackages'
import { useClients } from '../../hooks/useClients'

export default function BookingFormSheet({ isOpen, onClose, onSubmit }) {
  const { packages } = usePackages()
  const { clients } = useClients()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    client_id: '',
    package_id: '',
    event_date: '',
    event_time: '10:00',
    event_location: '',
    special_requests: '',
  })

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(form)
      onClose()
      setForm({
        client_id: '',
        package_id: '',
        event_date: '',
        event_time: '10:00',
        event_location: '',
        special_requests: '',
      })
    } catch {
      // parent handles errors
    } finally {
      setLoading(false)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Buat Booking Baru">
      <form onSubmit={handleSubmit}>
        <div className="rb-field">
          <label htmlFor="client_id" className="rb-field__label">Pilih Klien</label>
          <select
            id="client_id"
            name="client_id"
            value={form.client_id}
            onChange={handleChange}
            className="rb-field__control"
            required
          >
            <option value="">Pilih Klien</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.phone || 'tanpa no'})</option>
            ))}
          </select>
        </div>

        <div className="rb-field">
          <label htmlFor="package_id" className="rb-field__label">Pilih Paket</label>
          <select
            id="package_id"
            name="package_id"
            value={form.package_id}
            onChange={handleChange}
            className="rb-field__control"
            required
          >
            <option value="">Pilih Paket Foto</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>{p.name} - Rp {Number(p.price).toLocaleString('id-ID')}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px' }}>
          <Input
            id="event_date"
            name="event_date"
            type="date"
            label="Tanggal Sesi"
            value={form.event_date}
            onChange={handleChange}
            required
          />

          <Input
            id="event_time"
            name="event_time"
            type="time"
            label="Jam"
            value={form.event_time}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          id="event_location"
          name="event_location"
          label="Lokasi Sesi"
          placeholder="Nama studio, outdoor, atau alamat"
          value={form.event_location}
          onChange={handleChange}
        />

        <Input
          id="special_requests"
          name="special_requests"
          as="textarea"
          label="Catatan Khusus"
          placeholder="Moodboard, konsep warna baju, atau detail lain"
          value={form.special_requests}
          onChange={handleChange}
        />

        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={!form.client_id || !form.package_id || !form.event_date}
        >
          Simpan Booking
        </Button>
      </form>
    </BottomSheet>
  )
}
