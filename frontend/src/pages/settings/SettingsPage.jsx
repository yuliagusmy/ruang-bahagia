import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import ThemeSwitcher from '../../components/ui/ThemeSwitcher'
import { useDrive } from '../../hooks/useDrive'
import { notificationService } from '../../services/notificationService'
import testimonialService from '../../services/testimonialService'
import usePwaInstall from '../../hooks/usePwaInstall'
import './SettingsPage.css'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const isPro = Boolean(user?.is_pro || user?.subscription_tier === 'pro' || user?.subscription_plan === 'pro')
  const { isInstallable, isInstalled, isIos, promptInstall } = usePwaInstall()

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
    // WhatsApp Gateway
    wa_gateway_provider: notif.wa_gateway_provider || 'fonnte',
    wa_gateway_token: notif.wa_gateway_token || '',
    wablas_server_url: notif.wablas_server_url || '',
    // Automation Toggles
    wa_auto_dp_confirmed: notif.wa_auto_dp_confirmed !== false,
    wa_auto_h1_reminder: notif.wa_auto_h1_reminder !== false,
    wa_auto_final_delivery: notif.wa_auto_final_delivery !== false,
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
        // WhatsApp Gateway
        wa_gateway_provider: n.wa_gateway_provider || 'fonnte',
        wa_gateway_token: n.wa_gateway_token || '',
        wablas_server_url: n.wablas_server_url || '',
        // Automation Toggles
        wa_auto_dp_confirmed: n.wa_auto_dp_confirmed !== false,
        wa_auto_h1_reminder: n.wa_auto_h1_reminder !== false,
        wa_auto_final_delivery: n.wa_auto_final_delivery !== false,
      })
    }
  }, [user])

  const [testWaPhone, setTestWaPhone] = useState('')
  const [testingWa, setTestingWa] = useState(false)
  const [testWaResult, setTestWaResult] = useState(null)

  const handleTestWhatsApp = async () => {
    const targetPhone = testWaPhone || form.whatsapp
    if (!targetPhone) {
      setTestWaResult({
        success: false,
        message: 'Masukkan nomor WhatsApp tujuan uji coba terlebih dahulu.',
      })
      return
    }
    setTestingWa(true)
    setTestWaResult(null)
    try {
      const res = await notificationService.testWhatsApp(targetPhone)
      setTestWaResult({
        success: true,
        message: res.data?.message || 'Pesan uji coba WhatsApp berhasil dikirim!',
      })
    } catch (err) {
      setTestWaResult({
        success: false,
        message: err.response?.data?.message || 'Gagal mengirim pesan uji coba. Pastikan token API Gateway terisi benar.',
      })
    } finally {
      setTestingWa(false)
    }
  }

  // Review & Testimonial Moderation States
  const [reviewsList, setReviewsList] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  useEffect(() => {
    setLoadingReviews(true)
    testimonialService
      .getAll()
      .then((res) => {
        setReviewsList(res.data?.data || [])
      })
      .catch((err) => {
        console.warn('Gagal memuat ulasan fotografer:', err)
      })
      .finally(() => setLoadingReviews(false))
  }, [])

  const handleToggleFeaturedReview = async (id) => {
    try {
      const res = await testimonialService.toggleFeatured(id)
      const updated = res.data?.data
      setReviewsList((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_featured: updated.is_featured } : r))
      )
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status sorotan ulasan.')
    }
  }

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Yakin ingin menghapus ulasan ini secara permanen?')) return
    try {
      await testimonialService.deleteReview(id)
      setReviewsList((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus ulasan.')
    }
  }

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

        {/* ── WhatsApp Gateway Integration ─────────────────────── */}
        <div className="rb-settings-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <div>
              <h2 className="rb-settings-sec-title" style={{ margin: 0 }}>Integrasi WhatsApp Gateway</h2>
              <p className="rb-settings-sec-desc" style={{ margin: 0, marginTop: '2px' }}>
                Aktifkan pengiriman notifikasi WhatsApp otomatis ke klien saat DP dikonfirmasi, sesi H-1, dan foto final siap.
                Gunakan Fonnte atau Wablas sebagai gateway.
              </p>
            </div>
          </div>

          <div className="rb-settings-wa-info" style={{
            background: 'var(--rb-accent-subtle, #FDF4E3)',
            border: '1px solid var(--rb-accent, #C8862A)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--rb-text-secondary)',
          }}>
            <strong>Cara Kerja:</strong> Daftarkan nomor WhatsApp di{' '}
            <a href="https://fonnte.com" target="_blank" rel="noreferrer" style={{ color: 'var(--rb-accent)' }}>fonnte.com</a>
            {' '}atau{' '}
            <a href="https://wablas.com" target="_blank" rel="noreferrer" style={{ color: 'var(--rb-accent)' }}>wablas.com</a>.
            Salin API Token dari dashboard gateway tersebut dan tempel di field di bawah. Tanpa token, notifikasi berjalan dalam mode simulasi (pesan dicatat di log server).
          </div>

          <div className="rb-form-grid">
            <div className="rb-form-group">
              <label htmlFor="wa_gateway_provider" className="rb-form-label">
                Provider Gateway
              </label>
              <select
                id="wa_gateway_provider"
                name="wa_gateway_provider"
                value={notifForm.wa_gateway_provider}
                onChange={handleNotifChange}
                className="rb-form-input"
              >
                <option value="fonnte">Fonnte</option>
                <option value="wablas">Wablas</option>
              </select>
              <small className="rb-form-hint">Pilih platform WhatsApp Gateway yang Anda gunakan.</small>
            </div>

            <div className="rb-form-group">
              <label htmlFor="wa_gateway_token" className="rb-form-label">
                API Token Gateway
              </label>
              <input
                id="wa_gateway_token"
                name="wa_gateway_token"
                type="password"
                value={notifForm.wa_gateway_token}
                onChange={handleNotifChange}
                placeholder="Paste API Token dari dashboard gateway Anda"
                className="rb-form-input"
                autoComplete="off"
              />
              <small className="rb-form-hint">Token ini disimpan terenkripsi dan tidak pernah ditampilkan ke klien.</small>
            </div>

            {notifForm.wa_gateway_provider === 'wablas' && (
              <div className="rb-form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="wablas_server_url" className="rb-form-label">
                  Wablas Server URL
                </label>
                <input
                  id="wablas_server_url"
                  name="wablas_server_url"
                  type="url"
                  value={notifForm.wablas_server_url}
                  onChange={handleNotifChange}
                  placeholder="Contoh: https://jakarta.wablas.com"
                  className="rb-form-input"
                />
              </div>
            )}
          </div>

          {/* Automation Toggles */}
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className="rb-form-label" style={{ margin: 0 }}>Otomatisasi Pengiriman Pesan:</p>

            {[
              { key: 'wa_auto_dp_confirmed', label: 'Kirim konfirmasi otomatis saat DP diterima', emoji: '✅' },
              { key: 'wa_auto_h1_reminder', label: 'Kirim pengingat jadwal sesi H-1 otomatis (09:00)', emoji: '📅' },
              { key: 'wa_auto_final_delivery', label: 'Kirim notifikasi saat link unduh foto final diterbitkan', emoji: '📦' },
            ].map(({ key, label, emoji }) => (
              <label
                key={key}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--rb-text-primary)' }}
              >
                <input
                  type="checkbox"
                  checked={!!notifForm[key]}
                  onChange={(e) => setNotifForm((f) => ({ ...f, [key]: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--rb-accent)' }}
                />
                <span>{emoji} {label}</span>
              </label>
            ))}
          </div>

          {/* Uji Coba Kirim WhatsApp Gateway */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px dashed var(--rb-border)',
              backgroundColor: 'var(--rb-bg-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.875rem', color: 'var(--rb-text-primary)' }}>
                🧪 Uji Coba Pengiriman Pesan WhatsApp
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--rb-text-muted)' }}>
                Pastikan token API sudah tersimpan sebelum uji coba
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="tel"
                placeholder={form.whatsapp || '081234567890'}
                value={testWaPhone}
                onChange={(e) => setTestWaPhone(e.target.value)}
                className="rb-form-input"
                style={{ flex: 1, minWidth: '200px', fontSize: '0.8125rem' }}
              />
              <button
                type="button"
                className="rb-btn rb-btn--secondary rb-btn--sm"
                onClick={handleTestWhatsApp}
                disabled={testingWa}
              >
                {testingWa ? 'Mengirim Pesan Uji Coba...' : 'Kirim Pesan Tes 📲'}
              </button>
            </div>

            {testWaResult && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  backgroundColor: testWaResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: testWaResult.success ? '#065f46' : '#991b1b',
                  border: `1px solid ${testWaResult.success ? '#10b981' : '#ef4444'}`,
                }}
              >
                {testWaResult.success ? '✅ ' : '⚠️ '}
                {testWaResult.message}
              </div>
            )}
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

      {/* ── Moderasi Ulasan & Testimoni Klien ───────────────── */}
      <div className="rb-settings-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🌟</span>
            <div>
              <h2 className="rb-settings-sec-title" style={{ margin: 0 }}>Moderasi Ulasan Klien</h2>
              <p className="rb-settings-sec-desc" style={{ margin: 0, marginTop: '2px' }}>
                Kelola ulasan masuk dari tautan delivery foto final. Tandai ulasan terbaik untuk disorot di profil publik Anda.
              </p>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--rb-text-muted)', background: 'var(--rb-bg-secondary)', padding: '4px 10px', borderRadius: '20px' }}>
            {reviewsList.length} Ulasan Masuk
          </span>
        </div>

        {loadingReviews ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--rb-text-muted)', textAlign: 'center', padding: '1rem 0' }}>
            Memuat daftar ulasan...
          </p>
        ) : reviewsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--rb-bg-secondary)', borderRadius: '8px' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>💌</span>
            <strong style={{ fontSize: '0.9375rem', color: 'var(--rb-text-primary)', display: 'block', marginBottom: '0.25rem' }}>
              Belum Ada Ulasan Masuk
            </strong>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--rb-text-muted)', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.4' }}>
              Klien dapat memberikan rating 1–5 bintang dan testimoni secara langsung setelah membuka tautan unduhan foto final mereka.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
            {reviewsList.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--rb-border)',
                  background: r.is_featured ? 'color-mix(in srgb, var(--rb-accent-subtle, #fdf4e3) 40%, var(--rb-bg-page))' : 'var(--rb-bg-page)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.875rem', color: 'var(--rb-text-primary)' }}>
                      {r.client_name}
                    </strong>
                    {r.booking?.package?.name && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--rb-text-muted)', marginLeft: '8px' }}>
                        • {r.booking.package.name}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} style={{ color: s <= r.rating ? '#f59e0b' : '#d1d5db', fontSize: '1rem' }}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.875rem', color: 'var(--rb-text-secondary)', lineHeight: '1.4' }}>
                  "{r.comment}"
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed var(--rb-border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--rb-text-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="rb-btn rb-btn--ghost rb-btn--sm"
                      style={{ fontSize: '0.75rem', color: r.is_featured ? 'var(--rb-accent)' : 'inherit', fontWeight: r.is_featured ? 700 : 500 }}
                      onClick={() => handleToggleFeaturedReview(r.id)}
                    >
                      {r.is_featured ? '★ Sorotan Aktif' : '☆ Jadikan Sorotan'}
                    </button>
                    <button
                      type="button"
                      className="rb-btn rb-btn--ghost rb-btn--sm"
                      style={{ fontSize: '0.75rem', color: 'var(--rb-error, #ef4444)' }}
                      onClick={() => handleDeleteReview(r.id)}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PWA Application Installation ────────────────────── */}
      <div className="rb-settings-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>📲</span>
          <div>
            <h2 className="rb-settings-sec-title" style={{ margin: 0 }}>Pasang Aplikasi (PWA)</h2>
            <p className="rb-settings-sec-desc" style={{ margin: 0, marginTop: '2px' }}>
              Pasang Ruang Bahagia di layar utama smartphone atau laptop Anda untuk akses instan dan notifikasi real-time tanpa perlu browser.
            </p>
          </div>
        </div>

        {isInstalled ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#065f46', fontSize: '0.875rem' }}>
            <span>✓</span>
            <strong>Aplikasi Ruang Bahagia telah terpasang di perangkat ini.</strong>
          </div>
        ) : isInstallable ? (
          <div>
            <Button onClick={promptInstall} size="md">
              📲 Pasang Aplikasi ke Layar Utama
            </Button>
          </div>
        ) : isIos ? (
          <div style={{ background: 'var(--rb-bg-secondary)', padding: '0.875rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', color: 'var(--rb-text-secondary)', lineHeight: '1.5' }}>
            <strong>Pengguna iPhone / iPad (iOS Safari):</strong>
            <p style={{ margin: '4px 0 0' }}>
              Tekan ikon <strong>Bagikan (Share)</strong> ⎋ di bagian bawah browser Safari, lalu gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
            </p>
          </div>
        ) : (
          <div style={{ background: 'var(--rb-bg-secondary)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', color: 'var(--rb-text-muted)' }}>
            Aplikasi siap dipasang. Jika tombol instal belum muncul, Anda dapat memilih menu browser (tiga titik di kanan atas) &rarr; "Pasang Aplikasi" / "Install Ruang Bahagia".
          </div>
        )}
      </div>
    </div>
  )
}
