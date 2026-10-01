import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import ThemeSwitcher from '../../components/ui/ThemeSwitcher'
import { useDrive } from '../../hooks/useDrive'
import './SettingsPage.css'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const isPro = Boolean(user?.is_pro || user?.subscription_tier === 'pro' || user?.subscription_plan === 'pro')

  const [form, setForm] = useState({
    name: user?.name || '',
    brand_name: user?.brand_name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    city: user?.city || '',
    avatar_path: user?.avatar_path || '',
    whatsapp: user?.whatsapp || user?.phone || '',
    phone: user?.phone || '',
    instagram: user?.instagram || '',
  })

  const notif = user?.notification_settings || {}
  const [notifForm, setNotifForm] = useState({
    bank_name: notif.bank_name || 'BCA',
    bank_account_number: notif.bank_account_number || '',
    bank_account_holder: notif.bank_account_holder || user?.name || '',
    qris_image_url: notif.qris_image_url || '',
    h1_reminder_notes: notif.h1_reminder_notes || '',
    payment_reminder_notes: notif.payment_reminder_notes || '',
  })

  useEffect(() => {
    if (user?.notification_settings) {
      const n = user.notification_settings
      setNotifForm({
        bank_name: n.bank_name || 'BCA',
        bank_account_number: n.bank_account_number || '',
        bank_account_holder: n.bank_account_holder || user.name || '',
        qris_image_url: n.qris_image_url || '',
        h1_reminder_notes: n.h1_reminder_notes || '',
        payment_reminder_notes: n.payment_reminder_notes || '',
      })
    }
  }, [user])

  // Handler unggah gambar QRIS dari file perangkat dengan optimasi canvas
  const handleQrisFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Format berkas harus berupa gambar (JPG, PNG, atau WEBP).')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_DIM = 800
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width
            width = MAX_DIM
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height
            height = MAX_DIM
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
        setNotifForm((prev) => ({ ...prev, qris_image_url: dataUrl }))
        setSuccessMsg('Gambar QRIS berhasil dimuat! Klik Simpan Pengaturan di bawah untuk menyimpan.')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveQris = () => {
    setNotifForm((prev) => ({ ...prev, qris_image_url: '' }))
    setSuccessMsg('Gambar QRIS dihapus. Klik Simpan Pengaturan untuk memperbarui.')
  }

  const { status: driveStatus, loading: driveLoading, error: driveError,
          actionLoading: driveActionLoading, connect: connectDrive,
          disconnect: disconnectDrive, refetch: refetchDrive } = useDrive()

  const [searchParams, setSearchParams] = useSearchParams()
  const [driveMsg, setDriveMsg] = useState('')

  // Handle callback redirect dari Google OAuth
  useEffect(() => {
    const gdriveParam = searchParams.get('gdrive')
    if (gdriveParam === 'success') {
      setDriveMsg('success')
      refetchDrive()
      setSearchParams({}, { replace: true })
    } else if (gdriveParam === 'error') {
      setDriveMsg('error')
      setSearchParams({}, { replace: true })
    }
  }, [])

  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const handleChange = (e) => {
    let { name, value } = e.target
    if (name === 'username') {
      value = value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    }
    setForm((f) => ({ ...f, [name]: value }))
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handleNotifChange = (e) => {
    const { name, value } = e.target
    setNotifForm((f) => ({ ...f, [name]: value }))
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handleCopyLink = () => {
    const handle = form.username || user?.username || 'studio'
    const fullUrl = `${window.location.origin}/@${handle}`
    navigator.clipboard?.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const payload = {
        ...form,
        notification_settings: notifForm,
      }
      const { data } = await api.patch('/auth/profile', payload)
      setUser(data)
      setSuccessMsg('Pengaturan profil & template reminder studio berhasil disimpan.')
    } catch (err) {
      const res = err.response?.data
      if (res?.errors) {
        const firstKey = Object.keys(res.errors)[0]
        setErrorMsg(res.errors[firstKey][0])
      } else {
        setErrorMsg(res?.message || 'Gagal menyimpan perubahan profil studio.')
      }
    } finally {
      setLoading(false)
    }
  }

  const currentHandle = form.username || user?.username || ''
  const publicProfileUrl = currentHandle ? `/@${currentHandle}` : '/'

  return (
    <div className="rb-settings-page">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="rb-settings-header">
        <div>
          <span className="rb-settings-badge">Identitas & Branding</span>
          <h1 className="rb-settings-title">Pengaturan Profil Studio</h1>
          <p className="rb-settings-sub">
            Kelola profil publik, handle username (@handle), dan kontak reservasi klien Anda.
          </p>
        </div>
      </div>

      {/* ── Public Profile Card Banner ─────────────────────── */}
      <div className="rb-settings-preview-card">
        <div className="rb-settings-preview-card__main">
          <div className="rb-settings-preview-avatar">
            {form.avatar_path ? (
              <img
                src={form.avatar_path}
                alt="Logo Studio"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <span>{(form.brand_name || form.name || 'S').charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="rb-settings-preview-info">
            <div className="rb-settings-preview-top">
              <span className="rb-settings-preview-badge">Link Profil Publik Anda</span>
              {form.city && <span className="rb-settings-preview-city">📍 {form.city}</span>}
            </div>
            <h3 className="rb-settings-preview-name">
              {form.brand_name || form.name || 'Nama Studio'}
            </h3>
            <p className="rb-settings-preview-url">
              <span>ruangbahagia.web.id/@</span>
              <strong>{currentHandle || 'username'}</strong>
            </p>
          </div>
        </div>

        <div className="rb-settings-preview-actions">
          <button
            type="button"
            onClick={handleCopyLink}
            className="rb-btn rb-btn--ghost rb-btn--sm"
          >
            {copied ? '✓ Tautan Tersalin' : 'Salin Tautan'}
          </button>
          <a
            href={publicProfileUrl}
            target="_blank"
            rel="noreferrer"
            className="rb-btn rb-btn--primary rb-btn--sm"
          >
            Buka Profil Publik ↗
          </a>
        </div>
      </div>

      {/* ── Alerts ─────────────────────────────────────────── */}
      {successMsg && (
        <div className="rb-settings-alert rb-settings-alert--success" role="status">
          <span>✓ {successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rb-settings-alert rb-settings-alert--error" role="alert">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* ── Settings Form ──────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="rb-settings-form" noValidate>
        {/* Seksi 1: Branding & Identitas */}
        <div className="rb-settings-card">
          <h2 className="rb-settings-sec-title">1. Branding & Identitas Studio</h2>
          <p className="rb-settings-sec-desc">
            Informasi ini akan ditampilkan di halaman portofolio publik yang dilihat calon klien.
          </p>

          <div className="rb-form-row">
            <div className="rb-form-group">
              <label htmlFor="brand_name" className="rb-form-label">
                Nama Brand / Studio <span className="rb-form-req">*</span>
              </label>
              <input
                id="brand_name"
                name="brand_name"
                type="text"
                value={form.brand_name}
                onChange={handleChange}
                placeholder="Contoh: Ruang Bahagia Photography"
                className="rb-form-input"
                required
              />
            </div>

            <div className="rb-form-group">
              <label htmlFor="name" className="rb-form-label">
                Nama Lengkap Pemilik <span className="rb-form-req">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Contoh: Yulian Agus"
                className="rb-form-input"
                required
              />
            </div>
          </div>

          <div className="rb-form-row">
            <div className="rb-form-group">
              <label htmlFor="username" className="rb-form-label">
                Handle Username Publik (@handle) <span className="rb-form-req">*</span>
              </label>
              <div className="rb-handle-input-wrap">
                <span className="rb-handle-prefix">@</span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoCapitalize="none"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="yuliagus"
                  className="rb-form-input rb-handle-input"
                  required
                />
              </div>
              <small className="rb-form-hint">
                Tautan profil Anda: ruangbahagia.web.id/@{form.username || 'username'}
              </small>
            </div>

            <div className="rb-form-group">
              <label htmlFor="city" className="rb-form-label">
                Kota Domisili Studio
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={handleChange}
                placeholder="Contoh: Yogyakarta / Jakarta Selatan"
                className="rb-form-input"
              />
            </div>
          </div>

          <div className="rb-form-group">
            <label htmlFor="bio" className="rb-form-label">
              Bio / Filosofi Fotografi
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              value={form.bio}
              onChange={handleChange}
              placeholder="Ceritakan sedikit tentang gaya foto Anda, spesialisasi momen, atau cerita studio Anda..."
              className="rb-form-textarea"
            />
          </div>

          <div className="rb-form-group">
            <label htmlFor="avatar_path" className="rb-form-label">
              URL Avatar / Logo Studio
            </label>
            <input
              id="avatar_path"
              name="avatar_path"
              type="url"
              value={form.avatar_path}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/... atau link gambar logo"
              className="rb-form-input"
            />
            <small className="rb-form-hint">
              Tempelkan URL langsung gambar logo studio Anda untuk ditampilkan di profil publik.
            </small>
          </div>
        </div>

        {/* Seksi 2: Kontak & Notifikasi Booking */}
        <div className="rb-settings-card">
          <h2 className="rb-settings-sec-title">2. Kontak & Konfirmasi WhatsApp DP</h2>
          <p className="rb-settings-sec-desc">
            Nomor ini digunakan calon klien untuk mengirim bukti transfer DP via QRIS secara langsung ke WhatsApp Anda.
          </p>

          <div className="rb-form-row">
            <div className="rb-form-group">
              <label htmlFor="whatsapp" className="rb-form-label">
                Nomor WhatsApp Konfirmasi Booking <span className="rb-form-req">*</span>
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="Contoh: 081234567890"
                className="rb-form-input"
                required
              />
              <small className="rb-form-hint">
                Klien yang melakukan reservasi akan langsung diarahkan konfirmasi bukti pembayaran ke nomor ini.
              </small>
            </div>

            <div className="rb-form-group">
              <label htmlFor="instagram" className="rb-form-label">
                Akun Instagram
              </label>
              <input
                id="instagram"
                name="instagram"
                type="text"
                value={form.instagram}
                onChange={handleChange}
                placeholder="Contoh: @ruangbahagia.studio"
                className="rb-form-input"
              />
              <small className="rb-form-hint">
                Ditampilkan sebagai tombol tautan sosial media di profil portofolio Anda.
              </small>
            </div>
          </div>
        </div>

        {/* ── Rekening Bank & Smart Reminder WhatsApp ───────── */}
        <div className="rb-settings-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--rb-space-2)' }}>
            <h2 className="rb-settings-sec-title" style={{ margin: 0 }}>
              🏦 Rekening Bank & Template WhatsApp Smart Reminder
            </h2>
          </div>
          <p className="rb-settings-sec-desc">
            Informasi rekening pembayaran dan catatan briefing otomatis untuk pengingat jadwal H-1 serta penagihan sisa pelunasan via WhatsApp dan Kwitansi/Invoice Digital.
          </p>

          <div className="rb-form-grid">
            <div className="rb-form-group">
              <label htmlFor="bank_name" className="rb-form-label">
                Nama Bank / E-Wallet
              </label>
              <select
                id="bank_name"
                name="bank_name"
                value={notifForm.bank_name}
                onChange={handleNotifChange}
                className="rb-form-input"
              >
                <option value="BCA">BCA (Bank Central Asia)</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                <option value="BNI">BNI (Bank Negara Indonesia)</option>
                <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                <option value="CIMB Niaga">CIMB Niaga</option>
                <option value="SeaBank">SeaBank</option>
                <option value="Bank Jago">Bank Jago</option>
                <option value="DANA">DANA</option>
                <option value="GoPay">GoPay</option>
                <option value="OVO">OVO</option>
              </select>
            </div>

            <div className="rb-form-group">
              <label htmlFor="bank_account_number" className="rb-form-label">
                Nomor Rekening / E-Wallet
              </label>
              <input
                id="bank_account_number"
                name="bank_account_number"
                type="text"
                value={notifForm.bank_account_number}
                onChange={handleNotifChange}
                placeholder="Contoh: 1234567890"
                className="rb-form-input"
              />
            </div>
          </div>

          <div className="rb-form-group">
            <label htmlFor="bank_account_holder" className="rb-form-label">
              Nama Pemilik Rekening (Atas Nama)
            </label>
            <input
              id="bank_account_holder"
              name="bank_account_holder"
              type="text"
              value={notifForm.bank_account_holder}
              onChange={handleNotifChange}
              placeholder="Contoh: Yuli Agus / Ruang Bahagia Studio"
              className="rb-form-input"
            />
          </div>

          {/* ── QRIS Pembayaran Studio ────────────────────────── */}
          <div className="rb-qris-settings-block" style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--rb-color-border, #ede8e1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <label className="rb-form-label" style={{ margin: 0, fontWeight: 600 }}>
                📱 Barcode QRIS Pembayaran Studio
              </label>
              {notifForm.qris_image_url && (
                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, background: 'rgba(22, 163, 74, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                  ✓ QRIS Terpasang
                </span>
              )}
            </div>
            <p className="rb-form-hint" style={{ marginTop: '0.25rem', marginBottom: '0.875rem', fontSize: '0.8125rem', color: 'var(--rb-color-muted, #7a6e65)' }}>
              Unggah gambar barcode QRIS studio Anda (BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay, dll). Barcode ini akan langsung ditampilkan kepada klien saat reservasi DP dan di kwitansi/invoice digital. Anda dapat mengecek pembayaran masuk secara manual melalui mutasi rekening Anda.
            </p>

            <div className="rb-qris-upload-box">
              {notifForm.qris_image_url ? (
                <div className="rb-qris-preview-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid var(--rb-color-border, #ede8e1)' }}>
                  <div style={{ width: '130px', height: '130px', flexShrink: 0, background: '#fff', border: '1px solid #e2ded8', borderRadius: '8px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={notifForm.qris_image_url}
                      alt="QRIS Studio Preview"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: '0.9375rem', color: 'var(--rb-color-text, #2c2523)', display: 'block' }}>
                      QRIS Studio Siap Digunakan
                    </strong>
                    <p style={{ margin: '0.25rem 0 0.75rem', fontSize: '0.75rem', color: 'var(--rb-color-muted, #7a6e65)', lineHeight: 1.4 }}>
                      Klien akan melihat barcode ini dan dapat langsung scan menggunakan seluruh aplikasi mobile banking atau e-wallet.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <label className="rb-btn rb-btn--ghost rb-btn--sm" style={{ cursor: 'pointer', margin: 0 }}>
                        <span>Ganti Gambar</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrisFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveQris}
                        className="rb-btn rb-btn--danger rb-btn--sm"
                      >
                        Hapus QRIS
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rb-qris-dropzone" style={{ border: '2px dashed var(--rb-color-border, #ede8e1)', borderRadius: '10px', padding: '1.5rem', textAlign: 'center', background: '#fdfbf9' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
                  <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--rb-color-text, #2c2523)', marginBottom: '0.25rem' }}>
                    Belum Ada Gambar QRIS yang Diunggah
                  </strong>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: 'var(--rb-color-muted, #7a6e65)', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Pilih screenshot atau foto QRIS dari galeri HP atau komputer Anda. Klien akan scan QRIS ini saat pembayaran DP.
                  </p>
                  <label className="rb-btn rb-btn--primary rb-btn--sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                    <span>+ Pilih Foto Gambar QRIS</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrisFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}

              {/* URL alternatif */}
              <div style={{ marginTop: '0.75rem' }}>
                <label htmlFor="qris_image_url_input" className="rb-form-label" style={{ fontSize: '0.75rem', color: 'var(--rb-color-muted, #7a6e65)' }}>
                  Atau masukkan URL gambar QRIS langsung (Opsional):
                </label>
                <input
                  id="qris_image_url_input"
                  name="qris_image_url"
                  type="url"
                  value={notifForm.qris_image_url}
                  onChange={handleNotifChange}
                  placeholder="https://.../qris.jpg"
                  className="rb-form-input"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>
            </div>
          </div>

          <div className="rb-form-group">
            <label htmlFor="h1_reminder_notes" className="rb-form-label">
              Catatan Briefing Sesi (Disisipkan ke Pengingat H-1 WhatsApp)
            </label>
            <textarea
              id="h1_reminder_notes"
              name="h1_reminder_notes"
              rows={3}
              value={notifForm.h1_reminder_notes}
              onChange={handleNotifChange}
              placeholder="Contoh: Harap hadir 15 menit lebih awal untuk persiapan outfit/makeup. Studio menyediakan ruang ganti & perlengkapan makeup dasar."
              className="rb-form-input"
              style={{ resize: 'vertical' }}
            />
            <small className="rb-form-hint">
              Pesan ini otomatis disisipkan pada template WhatsApp pengingat H-1 ke klien.
            </small>
          </div>

          <div className="rb-form-group">
            <label htmlFor="payment_reminder_notes" className="rb-form-label">
              Catatan Khusus Pelunasan Tagihan & Kwitansi Digital
            </label>
            <textarea
              id="payment_reminder_notes"
              name="payment_reminder_notes"
              rows={2}
              value={notifForm.payment_reminder_notes}
              onChange={handleNotifChange}
              placeholder="Contoh: Harap konfirmasi bukti transfer sebelum jam 20.00 WIB untuk pemrosesan berkas di hari yang sama."
              className="rb-form-input"
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Action Submit */}
        <div className="rb-settings-submit-bar">
          <Button
            type="submit"
            loading={loading}
            disabled={!form.name || !form.username}
          >
            Simpan Perubahan Studio
          </Button>
        </div>
      </form>

      {/* ── Theme & Appearance ───────────────────────────────── */}
      <div className="rb-settings-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--rb-space-2)' }}>
          <h2 className="rb-settings-sec-title" style={{ margin: 0 }}>Tema & Tampilan Studio</h2>
          {isPro ? (
            <span className="rb-settings-badge" style={{ margin: 0, background: 'var(--rb-accent)', color: 'var(--rb-accent-text)' }}>✦ PRO AKTIF</span>
          ) : (
            <span className="rb-settings-badge" style={{ margin: 0 }}>Fitur Pro</span>
          )}
        </div>
        <p className="rb-settings-sec-desc">
          Sesuaikan tema visual portal studio dan halaman portofolio Anda. Fotografer Pro dapat memilih preset tema eksklusif.
        </p>
        <ThemeSwitcher />
      </div>

      {/* ── Google Drive Integration ──────────────────────────── */}
      <div className="rb-settings-card rb-settings-card--drive">
        <div className="rb-settings-drive-header">
          <div className="rb-settings-drive-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.71 3.5L1.15 15L4.58 21L11.13 9.5L7.71 3.5Z" fill="#0FA958"/>
              <path d="M16.29 3.5L22.85 15H15.97L9.42 3.5H16.29Z" fill="#4285F4"/>
              <path d="M4.58 21L7.97 15H22.85L19.42 21H4.58Z" fill="#FBBC04"/>
            </svg>
          </div>
          <div>
            <h2 className="rb-settings-sec-title" style={{ marginBottom: '2px' }}>
              Integrasi Google Drive
            </h2>
            <p className="rb-settings-sec-desc" style={{ marginBottom: 0 }}>
              Hubungkan akun Google Drive untuk otomasi upload foto hasil sesi ke folder klien.
            </p>
          </div>
        </div>

        {/* Feedback dari OAuth callback */}
        {driveMsg === 'success' && (
          <div className="rb-settings-alert rb-settings-alert--success" role="status">
            <span>✓ Google Drive berhasil terhubung!</span>
          </div>
        )}
        {driveMsg === 'error' && (
          <div className="rb-settings-alert rb-settings-alert--error" role="alert">
            <span>⚠️ Gagal menghubungkan Google Drive. Coba lagi.</span>
          </div>
        )}
        {driveError && (
          <div className="rb-settings-alert rb-settings-alert--error" role="alert">
            <span>⚠️ {driveError}</span>
          </div>
        )}

        {driveLoading ? (
          <div className="rb-settings-drive-loading">
            <div className="rb-spinner" aria-label="Memeriksa status Google Drive..." />
            <span>Memeriksa koneksi Drive...</span>
          </div>
        ) : driveStatus?.connected ? (
          <div className="rb-settings-drive-connected">
            <div className="rb-settings-drive-status">
              <span className="rb-settings-drive-dot rb-settings-drive-dot--on" />
              <span className="rb-settings-drive-status-text">Terhubung</span>
              <span className="rb-settings-drive-email">{driveStatus.gdrive_email}</span>
            </div>
            <button
              type="button"
              onClick={disconnectDrive}
              disabled={driveActionLoading}
              className="rb-btn rb-btn--ghost rb-btn--sm rb-settings-drive-disconnect"
            >
              {driveActionLoading ? 'Memutus...' : 'Putuskan'}
            </button>
          </div>
        ) : (
          <div className="rb-settings-drive-disconnected">
            <div className="rb-settings-drive-status">
              <span className="rb-settings-drive-dot rb-settings-drive-dot--off" />
              <span className="rb-settings-drive-status-text">Belum terhubung</span>
            </div>
            <button
              type="button"
              onClick={connectDrive}
              disabled={driveActionLoading}
              className="rb-btn rb-btn--primary rb-btn--sm"
            >
              {driveActionLoading ? 'Mengarahkan...' : 'Hubungkan Google Drive'}
            </button>
          </div>
        )}

        <div className="rb-settings-drive-note">
          <p>
            <strong>Cara kerja:</strong> Setelah terhubung, foto hasil sesi akan otomatis diupload
            ke folder <code>Ruang Bahagia / {'{Nama Klien}_{Tanggal}'}</code> di Google Drive kamu.
            File delivery akan otomatis dihapus setelah 14 hari.
          </p>
        </div>
      </div>
    </div>
  )
}
