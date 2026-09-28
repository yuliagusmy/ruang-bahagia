# Ruang Bahagia

> **Headless Mobile-First PWA & Studio CRM untuk Fotografer Freelance Perorangan**  
> Mengelola booking, pembayaran QRIS, seleksi foto interaktif klien (swipe-style), galeri portofolio, dan jadwal dalam satu ekosistem web modern.

---

## 🌟 Fitur Utama

### 1. Portal Klien & Pengunjung Publik
- **Landing Page Interaktif:** Desain hangat bergaya editorial, responsif dari layar smartphone (375px) hingga layar desktop ultra-lebar.
- **Galeri Portofolio Bersesi:** Foto dikelompokkan rapi per sesi (Wedding, Prewedding, Wisuda, Editorial). Dilengkapi indikator jumlah foto (`📷 6 Foto`), deep link URL (`?session=id`), dan Fullscreen Lightbox viewer.
- **Reservasi Mandiri (Self-Service Booking):** Calon klien memilih paket, mengecek slot jadwal fotografer yang tersedia, melakukan transfer pembayaran via **QRIS**, dan langsung konfirmasi ke WhatsApp fotografer dengan template pesan otomatis.
- **Client Photo Proofing (Tinder-Style Swipe):** Klien masuk dengan PIN keamanan unik, melakukan swipe kanan (*suka*) atau swipe kiri (*skip*) pada foto ber-watermark untuk menentukan foto final sesuai kuota paket.

### 2. Dashboard & CRM Fotografer
- **Statistik & Ringkasan Keuangan:** Pantau total pendapatan bulan ini, sisa piutang klien, jadwal sesi mendatang, dan status pipeline klien secara real-time.
- **Manajemen Booking & Pembayaran:** Catat pelunasan DP / pembayaran penuh, kelola status sesi (*pending* &rarr; *confirmed* &rarr; *in progress* &rarr; *editing* &rarr; *completed*).
- **Kalender & Pengaturan Jadwal:** Kunci jadwal libur, atur ketersediaan slot sesi per hari.
- **Katalog Paket & Layanan:** Atur harga, besaran DP, durasi pemotretan, dan kuota foto final.
- **Manajemen Portofolio:** Upload dan atur foto sesi yang tampil di profil publik.

---

## 🛠️ Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Frontend** | React 19 + Vite | Mobile-First Progressive Web App (PWA) |
| **PWA Engine** | `vite-plugin-pwa` + Workbox | Offline caching, standalone app installable di Android/iOS |
| **Styling** | Vanilla CSS + Design Tokens | Zero Tailwind bloat, 100% konsisten mengacu pada `DESIGN.md` |
| **State Management** | Zustand | Persisted auth token & notification store |
| **Backend API** | Laravel REST API (PHP 8.2+) | Headless architecture, decoupled API endpoints |
| **Authentication** | Laravel Sanctum | Bearer token authentication |
| **Database** | SQLite (Default Dev) / MySQL | Zero setup untuk local run & portable deployment |

---

## 📁 Struktur Repositori

```
ruang-bahagia/
├── backend/                  # Laravel API (Headless)
│   ├── app/
│   │   ├── Http/Controllers/Api/   # REST Controllers
│   │   ├── Models/                 # Eloquent Models (Soft Deletes)
│   │   └── Services/               # Business Logic Services
│   ├── database/migrations/       # Skema database relasional
│   ├── database/seeders/          # Dummy data realistis untuk pengujian
│   └── routes/api.php             # Rute publik & private Sanctum
│
├── frontend/                 # React + Vite PWA
│   ├── src/
│   │   ├── components/            # Komponen UI reusable (< 150 baris)
│   │   ├── pages/                 # Halaman utama (Public, Dashboard, CRM, Proofing)
│   │   ├── layouts/               # AppLayout (Fotografer) & ClientLayout
│   │   ├── services/              # Axios instance terpusat
│   │   ├── stores/                # Zustand global state
│   │   └── styles/                # tokens.css, base.css, index.css
│   ├── public/                    # PWA icons (192px, 512px, apple-touch), logo, QRIS
│   └── vite.config.js             # PWA manifest & development proxy
│
├── AGENTS.md                 # Rules & coding guidelines untuk AI Coding Agents
├── ARCHITECTURE.md           # Dokumentasi arsitektur data & fase roadmap
└── DESIGN.md                 # Design system tokens, warna hangat, dan tipografi
```

---

## 🚀 Panduan Menjalankan Secara Lokal

### Prasyarat
- PHP >= 8.1 dengan ekstensi SQLite / PDO
- Composer
- Node.js >= 18 & npm

### 1. Menjalankan Backend (Laravel)
```bash
cd backend

# Salin environment file
cp .env.example .env

# Pasang dependencies
composer install

# Generate application key
php artisan key:generate

# Migrasi dan isi data percontohan (seeder)
php artisan migrate --seed

# Jalankan server API (port 8000)
php artisan serve
```

### 2. Menjalankan Frontend (React PWA)
Buka terminal baru:
```bash
cd frontend

# Pasang dependencies
npm install

# Jalankan dev server (port 5173)
npm run dev
```

Buka browser di **`http://localhost:5173`**.

---

## 🔐 Akun & URL Percontohan (Demo)

### Portal Fotografer
- **URL Login:** `http://localhost:5173/login`
- **Email:** `fotografer@ruangbahagia.com`
- **Password:** `password123`

### Halaman Publik & Klien
- **Landing Page:** `http://localhost:5173/`
- **Reservasi Jadwal & QRIS:** `http://localhost:5173/book`
- **Galeri Karya Sesi:** `http://localhost:5173/portfolio`
- **Demo Client Photo Proofing:** `http://localhost:5173/proof/demo-wisuda` (PIN: `1234`)

---

## 🌐 Panduan Deployment

### 1. Frontend (Vercel / Netlify)
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables:
  - `VITE_API_URL`: `https://api-domain-backend-anda.com/api`
- *Catatan: File `vercel.json` dan `_redirects` sudah disertakan untuk mencegah error 404 pada single-page navigation.*

### 2. Backend (Railway / Render / VPS / Shared Hosting)
- Set Environment Variables:
  - `APP_ENV=production`
  - `APP_DEBUG=false`
  - `APP_URL=https://api-domain-backend-anda.com`
  - `DB_CONNECTION=sqlite` (atau gunakan database MySQL Anda)
- Jalankan `php artisan migrate --force` dan `php artisan db:seed --force` untuk database baru.

---

## 🗺️ Roadmap & Fitur Mendatang (Tahap 4)
- [ ] **Integrasi Google Drive API OAuth 2.0:** Auto-upload foto mentah dan delivery link otomatis.
- [ ] **WatermarkService Otomatis:** Resize background processing dengan logo transparan diagonal.
- [ ] **Laravel Cron Jobs:** Pembersihan file delivery setelah 14 hari dan refresh token otomatis.
- [ ] **WhatsApp Webhook Bot:** Notifikasi status pesanan langsung ke nomor handphone klien.

---

## 📄 Lisensi
Hak Cipta © 2026 Ruang Bahagia. Dikembangkan khusus untuk fotografer profesional independen.
