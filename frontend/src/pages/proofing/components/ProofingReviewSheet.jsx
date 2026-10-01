import BottomSheet from '../../../components/ui/BottomSheet'
import Button from '../../../components/ui/Button'

export default function ProofingReviewSheet({
  isOpen,
  onClose,
  selectedPhotos = [],
  onRemovePhoto,
  onSubmit,
  submitting,
  quota = 20,
}) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Foto Terpilih (${selectedPhotos.length} / ${quota})`}
    >
      <div className="rb-review-sheet">
        <p className="rb-review-sheet__desc">
          Periksa kembali foto-foto pilihan Anda sebelum dikirimkan ke fotografer untuk proses editing.
        </p>

        {selectedPhotos.length === 0 ? (
          <div className="rb-review-sheet__empty">
            <span>📷</span>
            <p>Belum ada foto yang dipilih. Geser ke kanan atau tekan tombol ♥ untuk memilih foto.</p>
          </div>
        ) : (
          <div className="rb-review-sheet__grid">
            {selectedPhotos.map((photo) => (
              <div key={photo.id} className="rb-review-sheet__item">
                <img
                  src={photo.watermarked_url || photo.file_url}
                  alt={photo.original_filename || 'Foto'}
                  loading="lazy"
                />
                <button
                  type="button"
                  className="rb-review-sheet__remove"
                  onClick={() => onRemovePhoto(photo.id)}
                  title="Batalkan pilihan foto ini"
                  aria-label="Hapus dari pilihan"
                >
                  ✕
                </button>
                <span className="rb-review-sheet__name">
                  {photo.original_filename || photo.display_filename}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="rb-review-sheet__actions">
          <Button
            onClick={onSubmit}
            loading={submitting}
            disabled={selectedPhotos.length === 0}
            fullWidth
          >
            ✓ Kirim {selectedPhotos.length} Foto Pilihan
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            fullWidth
            style={{ marginTop: 'var(--rb-space-2)' }}
          >
            ← Lanjut Memilih Foto Lain
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
