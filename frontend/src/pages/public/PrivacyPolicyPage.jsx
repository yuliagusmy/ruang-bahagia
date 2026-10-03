import { Link } from 'react-router-dom'
import './LegalPage.css'

export default function PrivacyPolicyPage() {
  return (
    <div className="rb-legal-page">
      <div className="rb-legal-card">
        <span className="rb-legal-badge">Dokumen Legal</span>
        <h1 className="rb-legal-title">Kebijakan Privasi (Privacy Policy)</h1>
        <p className="rb-legal-updated">Terakhir diperbarui: 3 Oktober 2026</p>

        <div className="rb-legal-content">
          <p>
            Selamat datang di <strong>Ruang Bahagia</strong> (diakses melalui <code>https://ruangbahagia.web.id</code>). 
            Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi seluruh pengguna, baik fotografer maupun klien yang menggunakan layanan kami.
          </p>

          <h2>1. Informasi yang Kami Kumpulkan</h2>
          <p>Kami mengumpulkan data berikut untuk menyediakan layanan:</p>
          <ul>
            <li><strong>Informasi Akun:</strong> Nama lengkap, alamat email, nomor telepon/WhatsApp, dan nama studio fotografi saat Anda mendaftar.</li>
            <li><strong>Data Layanan Fotografi:</strong> Paket foto, jadwal kalender sesi pemotretan, daftar klien, rincian biaya, dan catatan transaksi.</li>
            <li><strong>Informasi Otorisasi Akun Pihak Ketiga (Google OAuth):</strong> Alamat email akun Google dan token otorisasi yang dienkripsi secara aman saat Anda menghubungkan Google Drive.</li>
          </ul>

          <h2>2. Penggunaan Data Google API (Google Drive)</h2>
          <p>
            Ruang Bahagia menyediakan fitur integrasi opsional dengan Google Drive untuk mempermudah alur kerja fotografer dan klien:
          </p>
          <ul>
            <li><strong>Tujuan Akses:</strong> Aplikasi kami hanya mengakses folder dan file gambar yang dipilih secara spesifik oleh fotografer untuk kebutuhan penyiapan sesi kurasi foto (Client Proofing) dan penyerahan hasil foto final (Delivery).</li>
            <li><strong>Penyimpanan:</strong> Token akses Google Drive disimpan dengan enkripsi tingkat tinggi di basis data kami dan tidak pernah dibagikan kepada pihak mana pun.</li>
            <li><strong>Kepatuhan Kebijakan Pengguna Google:</strong> Penggunaan dan transfer data dari Google API ke aplikasi lain oleh Ruang Bahagia sepenuhnya mematuhi <em>Google API Services User Data Policy</em>, termasuk ketentuan <strong>Limited Use</strong>.</li>
            <li><strong>Tidak Ada Penjualan Data:</strong> Kami tidak pernah menjual, menyewakan, atau membagikan data atau foto Google Drive Anda kepada pengiklan atau pihak ketiga mana pun.</li>
          </ul>

          <div className="rb-legal-box">
            <strong>Kontrol Pengguna:</strong> Anda dapat memutus akses integrasi Google Drive kapan saja melalui menu <em>Pengaturan Studio</em> di dalam dashboard Ruang Bahagia, atau mencabut izin secara langsung melalui halaman <em>Google Account Security</em>.
          </div>

          <h2>3. Keamanan Data</h2>
          <p>
            Kami menerapkan langkah-langkah keamanan teknis standar industri untuk melindungi data pribadi dan aset foto Anda dari akses yang tidak sah, pengubahan, atau penghapusan:
          </p>
          <ul>
            <li>Enkripsi HTTPS / TLS di seluruh lalu lintas data.</li>
            <li>Enkripsi token dan autentikasi berlapis (Sanctum & timed-gate PIN).</li>
            <li>PIN akses 6-digit untuk sesi proofing klien demi melindungi privasi galeri foto.</li>
          </ul>

          <h2>4. Hak Anda atas Data Pribadi</h2>
          <p>
            Anda memiliki hak penuh untuk mengakses, memperbarui, atau meminta penghapusan akun serta seluruh data terkait dari sistem kami. Silakan hubungi kami untuk permohonan tersebut.
          </p>

          <h2>5. Kontak Kami</h2>
          <p>
            Jika Anda memiliki pertanyaan seputar Kebijakan Privasi ini, Anda dapat menghubungi kami melalui:
          </p>
          <ul>
            <li><strong>Platform:</strong> Ruang Bahagia</li>
            <li><strong>Situs Resmi:</strong> <a href="https://ruangbahagia.web.id" target="_blank" rel="noreferrer">https://ruangbahagia.web.id</a></li>
            <li><strong>Email Pengembang:</strong> yuliagusmy@gmail.com / admin@ruangbahagia.com</li>
          </ul>
        </div>

        <div className="rb-legal-footer">
          <Link to="/" className="rb-legal-back-link">← Kembali ke Beranda Ruang Bahagia</Link>
          <Link to="/terms" className="rb-legal-back-link">Syarat & Ketentuan Layanan (Terms) →</Link>
        </div>
      </div>
    </div>
  )
}
