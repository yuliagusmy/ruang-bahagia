import { useState } from 'react'
import BottomSheet from '../ui/BottomSheet'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function ClientFormSheet({ isOpen, onClose, onSubmit }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    notes: '',
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
      setForm({ name: '', email: '', phone: '', instagram: '', notes: '' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Tambah Klien Baru">
      <form onSubmit={handleSubmit}>
        <Input
          id="name"
          name="name"
          label="Nama Klien"
          placeholder="Contoh: Anisa Putri / Dimas Prasetyo"
          value={form.name}
          onChange={handleChange}
          required
        />

        <Input
          id="phone"
          name="phone"
          type="tel"
          label="No WhatsApp"
          placeholder="Contoh: 081234567890"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <Input
          id="email"
          name="email"
          type="email"
          label="Email (opsional)"
          placeholder="Contoh: anisa.dimas@gmail.com"
          value={form.email}
          onChange={handleChange}
        />

        <Input
          id="instagram"
          name="instagram"
          label="Instagram (opsional)"
          placeholder="Contoh: @anisaputri"
          value={form.instagram}
          onChange={handleChange}
        />

        <Input
          id="notes"
          name="notes"
          as="textarea"
          label="Catatan Klien"
          placeholder="Contoh: Suka tone warna warm earthy, rencana foto outdoor di dekat pepohonan hijau."
          value={form.notes}
          onChange={handleChange}
        />

        <Button type="submit" fullWidth loading={loading} disabled={!form.name || !form.phone}>
          Simpan Klien
        </Button>
      </form>
    </BottomSheet>
  )
}
