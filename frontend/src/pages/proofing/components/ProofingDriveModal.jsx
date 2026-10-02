import { useState, useEffect } from 'react'
import BottomSheet from '../../../components/ui/BottomSheet'
import Button from '../../../components/ui/Button'
import { useDrive } from '../../../hooks/useDrive'

export default function ProofingDriveModal({ isOpen, onClose, onImport, currentPath }) {
  const { status, loading: driveLoading, actionLoading, connect, fetchFolders } = useDrive()
  const [folderInput, setFolderInput] = useState('')
  const [folders, setFolders] = useState([])
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [importing, setImporting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const redirectTarget = currentPath || window.location.pathname

  useEffect(() => {
    if (isOpen && status?.connected) {
      setLoadingFolders(true)
      fetchFolders()
        .then((fList) => setFolders(fList || []))
        .catch(() => {})
        .finally(() => setLoadingFolders(false))
    }
  }, [isOpen, status?.connected])

  const handleConnectDrive = () => {
    connect(redirectTarget)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!folderInput.trim()) return

    setImporting(true)
    setErrorMsg('')
    try {
      await onImport(folderInput.trim())
      setFolderInput('')
      onClose()
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal mengimpor foto dari Google Drive.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Import Galeri dari Google Drive">
      <div className="rb-drive-modal">
        {/* Status Koneksi Google Drive */}
        {!status?.connected ? (
          <div className="rb-drive-connect-card">
            <div className="rb-drive-connect-card__header">
              <div className="rb-drive-logo" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M7.71 3.5L1.15 15L4.58 21L11.13 9.5L7.71 3.5Z" fill="#0FA958" />
                  <path d="M16.29 3.5L22.85 15H15.97L9.42 3.5H16.29Z" fill="#4285F4" />
                  <path d="M4.58 21L7.97 15H22.85L19.42 21H4.58Z" fill="#FBBC04" />
                </svg>
              </div>
              <div className="rb-drive-connect-card__text">
                <h4 className="rb-drive-connect-card__title">Integrasikan Google Drive</h4>
                <p className="rb-drive-connect-card__desc">
                  Hubungkan akun Google Drive studio untuk langsung memilih folder foto tanpa perlu mengatur link publik.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={handleConnectDrive}
              loading={actionLoading}
              fullWidth
              style={{ minHeight: '44px' }}
            >
              🔗 Hubungkan Akun Google Drive (1-Klik)
            </Button>
          </div>
        ) : (
          <div className="rb-drive-status-banner">
            <div className="rb-drive-status-banner__left">
              <span className="rb-drive-dot--on" />
              <div>
                <span className="rb-drive-status-label">Google Drive Terhubung</span>
                <strong className="rb-drive-status-email">{status.gdrive_email}</strong>
              </div>
            </div>
            <button
              type="button"
              className="rb-drive-reconnect-btn"
              onClick={handleConnectDrive}
              disabled={actionLoading}
              title="Ganti akun Google Drive"
            >
              Ganti Akun
            </button>
          </div>
        )}

        <div className="rb-drive-modal__info">
          <p className="rb-drive-modal__desc">
            Nama file asli kamera (misal <code>_DSC0123.JPG / .RAW</code>) akan dipertahankan agar hasil seleksi klien dapat langsung diekspor ke Lightroom.
          </p>
        </div>

        {errorMsg && (
          <div className="rb-settings-alert rb-settings-alert--error" role="alert">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {status?.connected && (
          <div className="rb-drive-modal__picker">
            <label className="rb-field__label">
              Pilih dari Folder Drive Anda:
              {loadingFolders && <span className="rb-drive-loading-text"> (Memuat folder...)</span>}
            </label>
            {folders.length > 0 ? (
              <div className="rb-drive-modal__folder-chips">
                {folders.slice(0, 8).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`rb-drive-chip ${folderInput === f.id ? 'rb-drive-chip--active' : ''}`}
                    onClick={() => setFolderInput(f.id)}
                  >
                    📁 {f.name}
                  </button>
                ))}
              </div>
            ) : !loadingFolders ? (
              <p className="rb-drive-empty-folders">Tidak ditemukan folder foto di root Google Drive.</p>
            ) : null}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rb-drive-modal__form">
          <div className="rb-field">
            <label className="rb-field__label">
              {status?.connected
                ? 'Atau Tautan Folder / ID Google Drive'
                : 'Tautan Folder / ID Google Drive Publik'}{' '}
              <span className="rb-form-req">*</span>
            </label>
            <input
              type="text"
              placeholder="https://drive.google.com/drive/folders/... atau ID folder"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              className="rb-field__control"
              required
            />
            <small className="rb-field__hint">
              {status?.connected
                ? 'Bisa paste link folder dari Drive yang terhubung atau folder Drive lain.'
                : 'Pastikan akses folder disetel ke "Siapa saja yang memiliki tautan dapat melihat" jika belum menghubungkan akun.'}
            </small>
          </div>

          <div className="rb-drive-modal__actions">
            <Button type="submit" loading={importing} fullWidth style={{ minHeight: '44px' }}>
              {importing ? 'Mengimpor Foto...' : 'Tarik Semua Foto dari Drive'}
            </Button>
          </div>
        </form>
      </div>
    </BottomSheet>
  )
}
