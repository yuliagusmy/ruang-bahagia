import { Link } from 'react-router-dom'
import './LegalPage.css'

export default function TermsOfServicePage() {
  return (
    <div className="rb-legal-page">
      <div className="rb-legal-card">
        <span className="rb-legal-badge">Dokumen Legal</span>
        <h1 className="rb-legal-title">Syarat & Ketentuan Layanan (Terms of Service)</h1>
        <p className="rb-legal-updated">Terakhir diperbarui: 3 Oktober 2026</p>

        <div className="rb-legal-content">
          <p>
            Selamat datang di <strong>Ruang Bahagia</strong>. Syarat & Ketentuan ini mengatur penggunaan platform Ruang Bahagia (<code>https://ruangbahagia.web.id</code>). 
            Dengan mendaftar, mengakses, atau menggunakan layanan kami, Anda menyetujui untuk terikat oleh ketentuan di bawah ini.
          </p>

          <h2>1. Deskripsi Layanan</h2>
          <p>
            Ruang Bahagia adalah platform SaaS (Software-as-a-Service) yang dirancang khusus untuk fotografer profesional dalam mengelola pemesanan jadwal sesi foto (booking), katalog paket, mini CRM klien, galeri kurasi foto (Client Proofing swipe), serta laporan keuangan studio.
          </p>

          <h2>2. Akun Pengguna</h2>
          <ul>
            <li>Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda (email, kata sandi, dan token akses).</li>
            <li>Informasi yang Anda berikan saat pendaftaran harus akurat, lengkap, dan terkini.</li>
            <li>Anda dilarang menggunakan platform untuk tujuan yang melanggar hukum atau merugikan pihak lain.</li>
          </ul>

          <h2>3. Hak Kekayaan Intelektual & Konten Foto</h2>
          <ul>
            <li><strong>Hak Cipta Fotografer:</strong> Hak cipta atas seluruh foto, portofolio, dan materi visual yang diunggah ke Ruang Bahagia sepenuhnya tetap menjadi milik fotografer atau pemegang hak cipta yang sah.</li>
            <li><strong>Tidak Mengklaim Kepemilikan:</strong> Ruang Bahagia tidak mengklaim kepemilikan atas foto apa pun yang diunggah atau dihubungkan melalui Google Drive Anda.</li>
            <li>Fotografer bertanggung jawab penuh memastikan memiliki izin dan hak cipta yang diperlukan untuk mempublikasikan dan membagikan foto klien.</li>
          </ul>

          <h2>4. Pembayaran & Langganan</h2>
          <ul>
            <li>Fitur pro dan paket langganan studio diproses melalui gateway pembayaran resmi (Midtrans) dengan metode pembayaran yang didukung seperti QRIS dan Transfer Bank.</li>
            <li>Biaya langganan bersifat transparan sesuai dengan paket yang dipilih di halaman Langganan.</li>
          </ul>

          <h2>5. Pembatasan Tanggung Jawab</h2>
          <p>
            Ruang Bahagia disediakan berdasarkan prinsip &quot;sebagaimana adanya&quot; (as-is). Kami senantiasa berusaha menjaga ketersediaan layanan 24/7 dan integritas data terbaik, namun tidak bertanggung jawab atas kerugian tidak langsung yang timbul akibat gangguan jaringan internet pihak ketiga atau kelalaian pengguna.
          </p>

          <h2>6. Perubahan Ketentuan</h2>
          <p>
            Kami dapat memperbarui Syarat & Ketentuan ini dari waktu ke waktu. Setiap perubahan akan diumumkan melalui pembaruan tanggal di bagian atas halaman ini.
          </p>

          <h2>7. Kontak</h2>
          <p>
            Untuk pertanyaan terkait Syarat & Ketentuan ini, silakan hubungi tim kami melalui email <strong>yuliagusmy@gmail.com</strong> atau <strong>admin@ruangbahagia.com</strong>.
          </p>
        </div>

        <div className="rb-legal-footer">
          <Link to="/" className="rb-legal-back-link">← Kembali ke Beranda Ruang Bahagia</Link>
          <Link to="/privacy" className="rb-legal-back-link">Kebijakan Privasi (Privacy Policy) →</Link>
        </div>
      </div>
    </div>
  )
}
