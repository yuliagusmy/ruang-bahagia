import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProofingList } from '../../hooks/useProofing'
import { useDrive } from '../../hooks/useDrive'
import { useAuthStore } from '../../stores/authStore'
import Button from '../../components/ui/Button'
import BottomSheet from '../../components/ui/BottomSheet'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import './ProofingListPage.css'

export default function ProofingListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { sessions, loading, error, refetch, createStandalone, deleteSession } = useProofingList()
  const {
    status: driveStatus,
    folders: driveFolders,
    fetchFolders,
    connect: connectDrive,
    actionLoading: driveActionLoading,
  } = useDrive()

  // Filters & Search
  const [activeTab, setActiveTab] = useState('all') // all | active | completed | standalone
  const [search, setSearch] = useState('')

  // Create Modal State
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    client_name: '',
    client_phone: '',
    selection_quota: 20,
    gdrive_folder_url: '',
  })

  // Share & WhatsApp Modal
  const [shareSheetOpen, setShareSheetOpen] = useState(false)
  const [activeShareSession, setActiveShareSession] = useState(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedWaText, setCopiedWaText] = useState(false)

  const handleOpenCreate = () => {
    setCreateForm({
      title: '',
      client_name: '',
      client_phone: '',
      selection_quota: 20,
      gdrive_folder_url: '',
    })
    setCreateSheetOpen(true)
    if (driveStatus?.connected) {
      fetchFolders().catch(() => {})
    }
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!createForm.title.trim()) return

    setCreating(true)
    try {
      const newSession = await createStandalone({
        title: createForm.title.trim(),
        client_name: createForm.client_name.trim() || undefined,
        client_phone: createForm.client_phone.trim() || undefined,
        selection_quota: parseInt(createForm.selection_quota, 10) || 20,
        gdrive_folder_url: createForm.gdrive_folder_url.trim() || undefined,
      })

      setCreateSheetOpen(false)
      if (newSession?.id) {
        navigate(`/proofing/${newSession.id}`)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat sesi proofing.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Hapus sesi proofing "${title}"? Data seleksi klien akan ikut terhapus.`)) return
    try {
      await deleteSession(id)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus sesi proofing.')
    }
  }

  // Open Share Dialog
  const handleOpenShare = (session) => {
    setActiveShareSession(session)
    setShareSheetOpen(true)
    setCopiedLink(false)
    setCopiedWaText(false)
  }

  // Filtered Sessions
  const filtered = sessions.filter((s) => {
    // Tab filter
    if (activeTab === 'active' && s.status !== 'active') return false
    if (activeTab === 'completed' && s.status !== 'completed') return false
    if (activeTab === 'standalone' && !s.is_standalone) return false

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchTitle = (s.title || s.display_title || '').toLowerCase().includes(q)
      const matchClient = (s.client_name || '').toLowerCase().includes(q)
      const matchSlug = (s.slug || '').toLowerCase().includes(q)
      const matchBooking = (s.booking_code || '').toLowerCase().includes(q)
      return matchTitle || matchClient || matchSlug || matchBooking
    }

    return true
  })

  // Format WhatsApp Message for Client
  const getShareUrl = (session) => {
    const origin = window.location.origin
    return `${origin}/proof/${session?.slug}`
  }

  const getWaMessage = (session) => {
    if (!session) return ''
    const clientName = session.client_name || 'Kak'
    const brandName = user?.brand_name || user?.name || 'Studio Fotografi'
    const shareUrl = getShareUrl(session)
    const pin = session.pin || '••••••'
    const quota = session.selection_quota || 20

    return (
`Halo Kak ${clientName} ✨

Foto-foto dari sesi pemotretan bersama ${brandName} sudah siap untuk dipilih!
Kakak bisa langsung memilih foto favorit dari smartphone dengan pengalaman swipe yang nyaman melalui tautan di bawah ini:

🔗 Tautan Seleksi: ${shareUrl}
🔑 PIN Akses: ${pin}
📷 Kuota Foto: ${quota} foto pilihan

Cukup geser kanan untuk foto yang disukai. Setelah selesai, kami akan langsung memproses editing foto pilihan Kakak. Selamat memilih! 🎉`
    )
  }

  return (
    <div className="page rb-proofing-list-page">
      {/* ── Top Header ────────────────────────────────────── */}
      <div className="rb-proofing-list__top">
        <div className="rb-proofing-list__header-text">
          <div className="rb-proofing-list__badge">Tools Fotografer Studio</div>
          <h2 className="rb-proofing-list__title">Sesi Client Proofing (Swipe)</h2>
          <p className="rb-proofing-list__sub">
            Buat galeri seleksi foto swipe untuk klien langsung dari Google Drive. Klien memilih foto favorit di smartphone, hasil pilihan siap diekspor ke Adobe Lightroom.
          </p>
        </div>

        <div className="rb-proofing-list__top-actions">
          <Button onClick={handleOpenCreate} variant="primary">
            + Buat Sesi Proofing Baru
          </Button>
        </div>
      </div>

      {/* ── Google Drive Connectivity Banner ──────────────── */}
      {!driveStatus?.connected && (
        <div className="rb-proofing-gdrive-banner">
          <div className="rb-proofing-gdrive-banner__content">
            <span className="rb-proofing-gdrive-banner__icon">📁</span>
            <div>
              <strong>Koneksikan Akun Google Drive Anda</strong>
              <p>Hubungkan Google Drive agar sistem dapat menarik foto sesi pemotretan secara otomatis hanya dengan menempelkan tautan folder.</p>
            </div>
          </div>
          <Link to="/settings" className="rb-btn rb-btn--secondary rb-btn--sm">
            Hubungkan di Pengaturan ↗
          </Link>
        </div>
      )}

      {/* ── Search & Filter Controls ──────────────────────── */}
      <div className="rb-proofing-list__controls">
        <div className="rb-proofing-list__search-wrap">
          <span className="rb-proofing-list__search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Cari sesi foto, nama klien, atau kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-proofing-list__search-input"
          />
        </div>

        <div className="rb-proofing-list__tabs" role="tablist">
          {[
            { id: 'all', label: 'Semua Sesi' },
            { id: 'active', label: 'Menunggu Klien' },
            { id: 'completed', label: 'Selesai Dipilih ✨' },
            { id: 'standalone', label: 'Tools Mandiri' },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`rb-proofing-tab ${activeTab === tab.id ? 'rb-proofing-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Grid / List ───────────────────────────── */}
      <div className="rb-proofing-list__content">
        {loading ? (
          <div className="rb-proofing-list__loading">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="card" height="130px" />
            ))}
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <Button size="sm" onClick={() => refetch()} variant="secondary">Coba Lagi</Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'Sesi Proofing Tidak Ditemukan' : 'Belum Ada Sesi Proofing'}
            message={
              search
                ? 'Tidak ditemukan sesi proofing yang sesuai dengan kata kunci pencarian.'
                : 'Mulai buat sesi proofing pertama Anda. Masukkan link Google Drive dan bagikan link swipe ke klien.'
            }
            actionLabel="+ Buat Sesi Proofing Cepat"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="rb-proofing-grid">
            {filtered.map((item) => {
              const shareUrl = getShareUrl(item)
              const isCompleted = item.status === 'completed'
              const selectedCount = item.selected_count || 0
              const quota = item.selection_quota || 20

              return (
                <div key={item.id} className="rb-proofing-card">
                  <div className="rb-proofing-card__header">
                    <div className="rb-proofing-card__title-wrap">
                      <div className="rb-proofing-card__tags">
                        <span className={`rb-proofing-pill rb-proofing-pill--${item.status}`}>
                          {item.status === 'completed'
                            ? 'Selesai Dipilih'
                            : item.status === 'active'
                            ? 'Aktif'
                            : 'Draft'}
                        </span>
                        {item.is_standalone ? (
                          <span className="rb-proofing-badge-standalone">Tools Mandiri</span>
                        ) : (
                          <span className="rb-proofing-badge-booking">#{item.booking_code}</span>
                        )}
                      </div>
                      <h3 className="rb-proofing-card__title">
                        {item.display_title || item.title || 'Sesi Pemotretan'}
                      </h3>
                      <p className="rb-proofing-card__client">
                        Klien: <strong>{item.client_name || 'Klien'}</strong>
                        {item.created_at && <span> • {item.created_at}</span>}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="rb-proofing-card__btn-delete"
                      onClick={() => handleDelete(item.id, item.display_title || item.title)}
                      title="Hapus sesi proofing"
                      aria-label="Hapus sesi"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Summary Stats */}
                  <div className="rb-proofing-card__stats">
                    <div className="rb-proofing-card__stat">
                      <span className="rb-proofing-card__stat-label">Foto Terpilih:</span>
                      <strong className={`rb-proofing-card__stat-val ${isCompleted ? 'rb-text-success' : ''}`}>
                        {selectedCount} / {quota} Foto
                      </strong>
                    </div>

                    <div className="rb-proofing-card__stat">
                      <span className="rb-proofing-card__stat-label">Total Foto Sesi:</span>
                      <strong className="rb-proofing-card__stat-val">
                        {item.total_photos || 0} Foto
                      </strong>
                    </div>

                    <div className="rb-proofing-card__stat">
                      <span className="rb-proofing-card__stat-label">PIN Klien:</span>
                      <code className="rb-proofing-card__pin">{item.pin}</code>
                    </div>
                  </div>

                  {/* Quick Actions Footer */}
                  <div className="rb-proofing-card__actions">
                    <button
                      type="button"
                      className="rb-btn rb-btn--ghost rb-btn--sm"
                      onClick={() => {
                        navigator.clipboard?.writeText(`${shareUrl}?pin=${item.pin}`)
                        alert('Tautan seleksi foto & PIN berhasil disalin!')
                      }}
                    >
                      📋 Salin Link & PIN
                    </button>

                    <button
                      type="button"
                      className="rb-btn rb-btn--secondary rb-btn--sm"
                      onClick={() => handleOpenShare(item)}
                    >
                      💬 Kirim WA Klien
                    </button>

                    <Link
                      to={`/proofing/${item.id}`}
                      className="rb-btn rb-btn--primary rb-btn--sm"
                    >
                      Kelola Sesi & Hasil ↗
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal Bottom Sheet: Buat Sesi Proofing Mandiri ── */}
      <BottomSheet
        isOpen={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        title="Buat Sesi Proofing (Tools Cepat)"
      >
        <form onSubmit={handleCreateSubmit} className="rb-proofing-create-form">
          <p className="rb-proofing-create-form__hint">
            Masukkan judul sesi dan tautan folder Google Drive. Anda tidak perlu membuat data reservasi booking atau klien terlebih dahulu.
          </p>

          <div className="rb-field">
            <label className="rb-field__label">
              Judul Sesi Pemotretan <span className="rb-form-req">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Prewedding Dimas & Dinda / Wisuda UI 2026"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="rb-field__control"
            />
          </div>

          <div className="rb-field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="rb-field">
              <label className="rb-field__label">Nama Klien (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Dimas & Dinda"
                value={createForm.client_name}
                onChange={(e) => setCreateForm({ ...createForm, client_name: e.target.value })}
                className="rb-field__control"
              />
            </div>

            <div className="rb-field">
              <label className="rb-field__label">No. WhatsApp (Opsional)</label>
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={createForm.client_phone}
                onChange={(e) => setCreateForm({ ...createForm, client_phone: e.target.value })}
                className="rb-field__control"
              />
            </div>
          </div>

          <div className="rb-field">
            <label className="rb-field__label">
              Kuota Foto yang Boleh Dipilih Klien
            </label>
            <input
              type="number"
              min="1"
              max="500"
              required
              placeholder="Contoh: 30"
              value={createForm.selection_quota}
              onChange={(e) => setCreateForm({ ...createForm, selection_quota: e.target.value })}
              className="rb-field__control"
            />
            <small className="rb-field__hint">
              Klien tidak dapat memilih melebihi kuota ini saat sesi proofing berlangsung.
            </small>
          </div>

          <div className="rb-field">
            <label className="rb-field__label">
              Tautan Folder Google Drive (Opsional)
            </label>
            <input
              type="text"
              placeholder="https://drive.google.com/drive/folders/... atau ID folder"
              value={createForm.gdrive_folder_url}
              onChange={(e) => setCreateForm({ ...createForm, gdrive_folder_url: e.target.value })}
              className="rb-field__control"
            />
            <small className="rb-field__hint">
              {driveStatus?.connected
                ? '✓ Akun Google Drive terhubung. Foto-foto di folder ini akan otomatis ditarik.'
                : 'Bisa diisi sekarang atau diimpor nanti setelah sesi selesai dibuat.'}
            </small>
            {!driveStatus?.connected && (
              <div style={{ marginTop: 'var(--rb-space-2)' }}>
                <button
                  type="button"
                  onClick={() => connectDrive(window.location.pathname)}
                  disabled={driveActionLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--rb-primary)',
                    fontSize: 'var(--rb-text-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  {driveActionLoading ? 'Mengarahkan...' : '🔗 Hubungkan Akun Google Drive Studio Sekarang ↗'}
                </button>
              </div>
            )}
          </div>

          {/* Quick Picker from connected Drive Folders */}
          {driveStatus?.connected && driveFolders?.length > 0 && (
            <div className="rb-drive-picker-block">
              <label className="rb-field__label" style={{ fontSize: '0.75rem' }}>
                Atau pilih folder dari Google Drive Anda:
              </label>
              <div className="rb-drive-picker-chips">
                {driveFolders.slice(0, 5).map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    className={`rb-drive-chip ${createForm.gdrive_folder_url === folder.id ? 'rb-drive-chip--active' : ''}`}
                    onClick={() => setCreateForm({ ...createForm, gdrive_folder_url: folder.id })}
                  >
                    📁 {folder.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rb-proofing-create-form__actions">
            <Button type="submit" loading={creating} fullWidth>
              {creating ? 'Menyiapkan Sesi...' : 'Buat Sesi Proofing ↗'}
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* ── Modal Bottom Sheet: Bagikan ke Klien via WhatsApp ── */}
      <BottomSheet
        isOpen={shareSheetOpen}
        onClose={() => setShareSheetOpen(false)}
        title="Kirim Sesi Proofing ke Klien"
      >
        {activeShareSession && (
          <div className="rb-proofing-share-sheet">
            <div className="rb-proofing-share-sheet__header">
              <span className="rb-proofing-share-target">
                Tujuan: <strong>{activeShareSession.client_name || 'Klien'}</strong>
                {activeShareSession.client_phone && ` (${activeShareSession.client_phone})`}
              </span>
            </div>

            <div className="rb-field">
              <label className="rb-field__label">Teks Pesan WhatsApp Siap Kirim:</label>
              <textarea
                className="rb-field__control"
                rows={9}
                readOnly
                value={getWaMessage(activeShareSession)}
              />
            </div>

            <div className="rb-proofing-share-sheet__actions">
              {activeShareSession.client_phone ? (
                <a
                  href={`https://wa.me/${activeShareSession.client_phone.replace(/^0/, '62').replace(/\D/g, '')}?text=${encodeURIComponent(getWaMessage(activeShareSession))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rb-btn rb-btn--primary rb-btn--full"
                  style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#fff' }}
                  onClick={() => setShareSheetOpen(false)}
                >
                  <span>Kirim Langsung via WhatsApp (wa.me) ↗</span>
                </a>
              ) : (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getWaMessage(activeShareSession))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rb-btn rb-btn--primary rb-btn--full"
                  style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#fff' }}
                  onClick={() => setShareSheetOpen(false)}
                >
                  <span>Buka WhatsApp & Pilih Kontak Klien ↗</span>
                </a>
              )}

              <button
                type="button"
                className="rb-btn rb-btn--secondary rb-btn--full"
                onClick={() => {
                  navigator.clipboard?.writeText(getWaMessage(activeShareSession))
                  setCopiedWaText(true)
                  setTimeout(() => setCopiedWaText(false), 2000)
                }}
              >
                {copiedWaText ? '✓ Teks Berhasil Disalin!' : 'Salin Seluruh Teks Pesan'}
              </button>

              <button
                type="button"
                className="rb-btn rb-btn--ghost rb-btn--full"
                onClick={() => {
                  navigator.clipboard?.writeText(`${getShareUrl(activeShareSession)}?pin=${activeShareSession.pin}`)
                  setCopiedLink(true)
                  setTimeout(() => setCopiedLink(false), 2000)
                }}
              >
                {copiedLink ? '✓ Tautan & PIN Tersalin!' : 'Hanya Salin Tautan & PIN'}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
