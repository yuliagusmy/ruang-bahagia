import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomSheet from '../ui/BottomSheet'
import './PlatformGuideModal.css'

/**
 * PlatformGuideModal
 * Komponen modal interaktif penjelasan platform & panduan alur kerja Ruang Bahagia
 * Mendukung tab ganda: Calon Pengantin / Klien vs Fotografer / Studio
 */
export default function PlatformGuideModal({
  isOpen,
  onClose,
  defaultTab = 'client',
}) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  const handleAction = (path) => {
    onClose?.()
    navigate(path)
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Panduan & Cara Kerja Platform"
      className="rb-sheet--wide"
    >
      <div className="rb-guide">
        {/* ── Tab Switcher ──────────────────────────────── */}
        <div className="rb-guide__tabs" role="tablist" aria-label="Target Panduan">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'client'}
            className={`rb-guide__tab-btn ${activeTab === 'client' ? 'rb-guide__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('client')}
          >
            <span className="rb-guide__tab-icon">💑</span>
            <span>Untuk Klien & Pasangan</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'photographer'}
            className={`rb-guide__tab-btn ${activeTab === 'photographer' ? 'rb-guide__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('photographer')}
          >
            <span className="rb-guide__tab-icon">📸</span>
            <span>Untuk Fotografer & Studio</span>
          </button>
        </div>

        {/* ── Content: Untuk Klien ─────────────────────── */}
        {activeTab === 'client' && (
          <div className="rb-guide__pane">
            <div className="rb-guide__intro-banner">
              <span className="rb-guide__intro-tag">Pengalaman Klien</span>
              <h4 className="rb-guide__intro-title">Reservasi Mandiri & Seleksi Foto Cepat</h4>
              <p className="rb-guide__intro-lead">
                Dapatkan pengalaman booking dokumentasi momen bahagia yang transparan, mudah, dan menyenangkan langsung dari smartphone Anda.
              </p>
            </div>

            <div className="rb-guide__steps">
              <div className="rb-guide-step">
                <div className="rb-guide-step__marker">
                  <span className="rb-guide-step__num">01</span>
                </div>
                <div className="rb-guide-step__body">
                  <div className="rb-guide-step__header">
                    <span className="rb-guide-step__icon">🖼️</span>
                    <h5 className="rb-guide-step__title">Jelajahi Portofolio & Pilih Paket</h5>
                  </div>
                  <p className="rb-guide-step__desc">
                    Lihat hasil karya asli fotografer, rincian harga, durasi sesi, dan kuota foto final secara transparan tanpa biaya tersembunyi.
                  </p>
                </div>
              </div>

              <div className="rb-guide-step">
                <div className="rb-guide-step__marker">
                  <span className="rb-guide-step__num">02</span>
                </div>
                <div className="rb-guide-step__body">
                  <div className="rb-guide-step__header">
                    <span className="rb-guide-step__icon">📅</span>
                    <h5 className="rb-guide-step__title">Pilih Jadwal & Bayar DP QRIS</h5>
                  </div>
                  <p className="rb-guide-step__desc">
                    Pilih tanggal dan slot waktu kosong di kalender studio secara real-time. Amankan jadwal sesi Anda dengan transfer DP instan via QRIS.
                  </p>
                </div>
              </div>

              <div className="rb-guide-step">
                <div className="rb-guide-step__marker">
                  <span className="rb-guide-step__num">03</span>
                </div>
                <div className="rb-guide-step__body">
                  <div className="rb-guide-step__header">
                    <span className="rb-guide-step__icon">💬</span>
                    <h5 className="rb-guide-step__title">Konfirmasi WhatsApp Otomatis</h5>
                  </div>
                  <p className="rb-guide-step__desc">
                    Terima bukti reservasi dan tautan kontak langsung ke WhatsApp fotografer untuk koordinasi konsep dan briefing lokasi sebelum hari pemotretan.
                  </p>
                </div>
              </div>

              <div className="rb-guide-step">
                <div className="rb-guide-step__marker">
                  <span className="rb-guide-step__num">04</span>
                </div>
                <div className="rb-guide-step__body">
                  <div className="rb-guide-step__header">
                    <span className="rb-guide-step__icon">✨</span>
                    <h5 className="rb-guide-step__title">Swipe Proofing Foto dari HP</h5>
                  </div>
                  <p className="rb-guide-step__desc">
                    Setelah sesi foto selesai, Anda akan menerima link portal seleksi. Cukup geser kanan foto yang Anda sukai dan kiri untuk lewati, semudah bermain medsos.
                  </p>
                </div>
              </div>

              <div className="rb-guide-step">
                <div className="rb-guide-step__marker">
                  <span className="rb-guide-step__num">05</span>
                </div>
                <div className="rb-guide-step__body">
                  <div className="rb-guide-step__header">
                    <span className="rb-guide-step__icon">📥</span>
                    <h5 className="rb-guide-step__title">Unduh Koleksi Foto Final Hi-Res</h5>
                  </div>
                  <p className="rb-guide-step__desc">
                    Foto pilihan Anda akan diproses edit oleh fotografer dan siap diunduh dalam kualitas resolusi tinggi untuk dicetak atau dibagikan.
                  </p>
                </div>
              </div>
            </div>

            <div className="rb-guide__footer">
              <button
                type="button"
                className="rb-guide__cta-btn rb-guide__cta-btn--primary"
                onClick={() => handleAction('/book')}
              >
                <span>Mulai Reservasi Jadwal Sesi</span>
                <span className="rb-guide__arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Content: Untuk Fotografer ────────────────── */}
        {activeTab === 'photographer' && (
          <div className="rb-guide__pane">
            <div className="rb-guide__intro-banner rb-guide__intro-banner--studio">
              <span className="rb-guide__intro-tag rb-guide__intro-tag--studio">Portal Studio</span>
              <h4 className="rb-guide__intro-title">Sistem Operasional All-in-One Fotografer</h4>
              <p className="rb-guide__intro-lead">
                Ubah cara mengelola studio fotografi Anda dari pencatatan manual menjadi serba otomatis, terstruktur, dan tampak profesional di mata klien.
              </p>
            </div>

            <div className="rb-guide__steps">
              <div className="rb-guide-step">
                <div className="rb-guide-step__marker">
                  <span className="rb-guide-step__num">01</span>
                </div>
                <div className="rb-guide-step__body">
                  <div className="rb-guide-step__header">
                    <span className="rb-guide-step__icon">🌐</span>
                    <h5 className="rb-guide-step__title">Profil & Portofolio Personal (@username)</h5>
                  </div>
                  <p className="rb-guide-step__desc">
                    Miliki alamat web khusus (contoh: <code>ruangbahagia.web.id/@namastudio</code>) untuk dipasang di link bio Instagram dan TikTok sebagai etalase karya digital Anda.
                  </p>
                </div>
              </div>

              <div className="rb-guide-step">
                <div className="rb-guide-step__marker">
                  <span className="rb-guide-step__num">02</span>
                </div>
                <div className="rb-guide-step__body">
                  <div className="rb-guide-step__header">
                    <span className="rb-guide-step__icon">📦</span>
                    <h5 className="rb-guide-step__title">Atur Paket & Kalender Anti-Bentrok</h5>
                  </div>
                  <p className="rb-guide-step__desc">
                    Tentukan rincian paket, nominal DP, dan batasan durasi. Kalender jadwal otomatis mengunci tanggal yang sudah di-booking sehingga terhindar dari jadwal ganda.
                  </p>
                </div>
              </div>

              <div className="rb-guide-step">
                <div className="rb-guide-step__marker">
                  <span className="rb-guide-step__num">03</span>
                </div>
                <div className="rb-guide-step__body">
                  <div className="rb-guide-step__header">
                    <span className="rb-guide-step__icon">👥</span>
                    <h5 className="rb-guide-step__title">Mini CRM & Verifikasi Pembayaran 1-Klik</h5>
                  </div>
                  <p className="rb-guide-step__desc">
                    Pantau tahapan setiap klien dari booking masuk, konfirmasi DP, jadwal pemotretan, sesi proofing, hingga pelunasan tanpa perlu buku catatan manual.
                  </p>
                </div>
              </div>

              <div className="rb-guide-step">
                <div className="rb-guide-step__marker">
                  <span className="rb-guide-step__num">04</span>
                </div>
                <div className="rb-guide-step__body">
                  <div className="rb-guide-step__header">
                    <span className="rb-guide-step__icon">📱</span>
                    <h5 className="rb-guide-step__title">Client Proofing Digital Tanpa Ribet</h5>
                  </div>
                  <p className="rb-guide-step__desc">
                    Tidak perlu lagi meminta klien mencatat nomor file foto di chat WhatsApp. Cukup kirimkan link proofing sesi, klien memilih dengan swipe di HP, dan Anda langsung menerima rekap daftar foto terpilih.
                  </p>
                </div>
              </div>

              <div className="rb-guide-step">
                <div className="rb-guide-step__marker">
                  <span className="rb-guide-step__num">05</span>
                </div>
                <div className="rb-guide-step__body">
                  <div className="rb-guide-step__header">
                    <span className="rb-guide-step__icon">⚡</span>
                    <h5 className="rb-guide-step__title">PWA Ringan & Tanpa Instal Aplikasi</h5>
                  </div>
                  <p className="rb-guide-step__desc">
                    Platform berjalan sebagai Progressive Web App yang langsung terbuka di browser ponsel pintar klien tanpa memerlukan unduhan aplikasi terpisah.
                  </p>
                </div>
              </div>
            </div>

            <div className="rb-guide__footer">
              <button
                type="button"
                className="rb-guide__cta-btn rb-guide__cta-btn--studio"
                onClick={() => handleAction('/register')}
              >
                <span>Daftar Akun Studio Sekarang</span>
                <span className="rb-guide__arrow">→</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
