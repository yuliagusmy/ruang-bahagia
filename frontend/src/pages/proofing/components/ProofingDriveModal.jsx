import { useState, useEffect } from 'react'
import BottomSheet from '../../../components/ui/BottomSheet'
import Button from '../../../components/ui/Button'
import { useDrive } from '../../../hooks/useDrive'

export default function ProofingDriveModal({ isOpen, onClose, onImport }) {
  const { status, loading: driveLoading, fetchFolders } = useDrive()
  const [folderInput, setFolderInput] = useState('')
  const [folders, setFolders] = useState([])
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [importing, setImporting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isOpen && status?.connected) {
      setLoadingFolders(true)
      fetchFolders()
        .then((fList) => setFolders(fList || []))
        .catch(() => {})
        .finally(() => setLoadingFolders(false))
    }
  }, [isOpen, status?.connected])

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
        <p className="rb-drive-modal__desc">
          Tarik otomatis semua foto dari folder Google Drive Anda. Nama file asli kamera (RAW/JPG) akan dipertahankan untuk kebutuhan ekspor ke Lightroom.
        </p>

        {errorMsg && (
          <div className="rb-settings-alert rb-settings-alert--error" role="alert">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {status?.connected && folders.length > 0 && (
          <div className="rb-drive-modal__picker">
            <label className="rb-field__label">Pilih dari Folder Drive Anda:</label>
            <div className="rb-drive-modal__folder-chips">
              {folders.slice(0, 6).map((f) => (
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
          </div>
        )}

        <form onSubmit={handleSubmit} className="rb-drive-modal__form">
          <div className="rb-field">
            <label className="rb-field__label">
              Tautan Folder / ID Google Drive <span className="rb-form-req">*</span>
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
              Pastikan akses folder Google Drive disetel ke &quot;Siapa saja yang memiliki tautan dapat melihat&quot; atau akun Google Drive sudah terhubung.
            </small>
          </div>

          <div className="rb-drive-modal__actions">
            <Button type="submit" loading={importing} fullWidth>
              {importing ? 'Mengimpor Foto...' : 'Tarik Semua Foto dari Drive'}
            </Button>
          </div>
        </form>
      </div>
    </BottomSheet>
  )
}
