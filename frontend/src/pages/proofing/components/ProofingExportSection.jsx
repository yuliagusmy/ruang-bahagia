import { useState } from 'react'
import Button from '../../../components/ui/Button'

const RAW_EXTS = ['ASLI', 'CR3', 'CR2', 'ARW', 'NEF', 'DNG', 'JPG']

export default function ProofingExportSection({ selectedPhotos, session, bookingId }) {
  const [copiedMode, setCopiedMode] = useState('')
  const [targetExt, setTargetExt] = useState('ASLI')

  const transformFilename = (filename, ext) => {
    if (ext === 'ASLI') return filename
    const dotIndex = filename.lastIndexOf('.')
    const base = dotIndex !== -1 ? filename.slice(0, dotIndex) : filename
    return `${base}.${ext}`
  }

  const copyLightroomFilter = () => {
    // Adobe Lightroom Library Filter uses space-delimited basenames or filenames
    const text = selectedPhotos
      .map((p) => {
        const dotIndex = p.original_filename.lastIndexOf('.')
        return dotIndex !== -1 ? p.original_filename.slice(0, dotIndex) : p.original_filename
      })
      .join(' ')
    navigator.clipboard?.writeText(text)
    setCopiedMode('lr')
    setTimeout(() => setCopiedMode(''), 2200)
  }

  const copyRawList = () => {
    const list = selectedPhotos
      .map((p) => transformFilename(p.original_filename, targetExt))
      .join(', ')
    navigator.clipboard?.writeText(list)
    setCopiedMode('raw')
    setTimeout(() => setCopiedMode(''), 2200)
  }

  const exportSelectedTxt = () => {
    if (selectedPhotos.length === 0) return
    const refTitle = session?.display_title || session?.title || (session?.booking_code ? `#${session.booking_code}` : (bookingId ? `#${bookingId}` : 'Sesi Mandiri'))
    const clientName = session?.display_client_name || session?.client_name || '-'
    const content =
      `DAFTAR FOTO TERPILIH KLIEN\nSesi: ${refTitle}\nKlien: ${clientName}\nTotal Foto: ${selectedPhotos.length}\nTanggal: ${new Date().toLocaleDateString('id-ID')}\nFormat: ${targetExt}\n\n` +
      selectedPhotos
        .map((p, i) => `${i + 1}. ${transformFilename(p.original_filename, targetExt)}`)
        .join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `foto_terpilih_${session?.slug || bookingId}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <section className="rb-detail-card">
      <div className="rb-detail-card__header">
        <div>
          <h3 className="rb-detail-card__section-title">
            Foto Dipilih Klien ({selectedPhotos.length})
          </h3>
          <p className="rb-detail-card__hint">
            {selectedPhotos.length > 0
              ? 'Salin nama file foto untuk langsung dicari dan difilter di Adobe Lightroom atau salin berkas RAW.'
              : 'Klien belum menyelesaikan pemilihan foto.'}
          </p>
        </div>
      </div>

      {selectedPhotos.length > 0 && (
        <div className="rb-proofing-toolbar">
          <div className="rb-proofing-toolbar__row">
            <span className="rb-proofing-toolbar__label">Ekstensi RAW:</span>
            <div className="rb-proofing-ext-pills">
              {RAW_EXTS.map((ext) => (
                <button
                  key={ext}
                  type="button"
                  className={`rb-ext-pill ${targetExt === ext ? 'rb-ext-pill--active' : ''}`}
                  onClick={() => setTargetExt(ext)}
                >
                  .{ext}
                </button>
              ))}
            </div>
          </div>

          <div className="rb-proofing-export-actions">
            <Button size="sm" onClick={copyLightroomFilter} variant="primary">
              {copiedMode === 'lr' ? '✓ Filter Tersalin!' : '⚡ Salin Filter Lightroom'}
            </Button>
            <Button size="sm" onClick={copyRawList} variant="secondary">
              {copiedMode === 'raw' ? '✓ Daftar Tersalin!' : `Salin Nama .${targetExt}`}
            </Button>
            <button
              type="button"
              className="rb-btn rb-btn--ghost rb-btn--sm"
              onClick={exportSelectedTxt}
              title="Unduh daftar file .txt"
            >
              Unduh .TXT
            </button>
          </div>
        </div>
      )}

      {selectedPhotos.length === 0 ? (
        <div className="rb-proofing-admin__empty">
          <span>📸</span>
          <p>Belum ada foto yang dipilih. Bagikan link proofing dan PIN ke WhatsApp klien.</p>
        </div>
      ) : (
        <div className="rb-proofing-admin__selected-grid">
          {selectedPhotos.map((p) => (
            <div key={p.id} className="rb-proofing-thumb rb-proofing-thumb--selected">
              <img src={p.watermarked_url} alt={p.original_filename} loading="lazy" />
              <span className="rb-proofing-thumb__badge">✓ Terpilih</span>
              <span className="rb-proofing-thumb__name">
                {transformFilename(p.original_filename, targetExt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
