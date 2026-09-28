# AGENTS.md — Ruang Bahagia
> Rules wajib untuk semua AI coding agent yang bekerja di repo ini.
> Baca file ini SEBELUM menulis kode apapun.

---

## 1. Identitas Proyek

**Nama:** Ruang Bahagia
**Deskripsi:** PWA headless untuk fotografer freelance perorangan. Fitur utama: booking, payment, mini CRM, client proofing (swipe-style), dan portfolio.
**Arsitektur:** Laravel REST API (backend) + React + Vite (frontend)
**Pendekatan desain:** Mobile-First, antislop aktif, DESIGN.md sebagai sumber kebenaran visual.

---

## 2. Struktur Folder

```
ruang-bahagia/
├── backend/                  # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/Api/   # Semua controller di sini
│   │   ├── Models/                 # Satu file per model
│   │   └── Services/               # Business logic yang kompleks
│   ├── database/migrations/
│   ├── routes/api.php
│   └── .env
│
└── frontend/                 # React + Vite PWA
    ├── src/
    │   ├── components/       # Komponen reusable (Button, Card, dll)
    │   ├── pages/            # Halaman utama (Dashboard, Booking, dll)
    │   ├── layouts/          # Layout wrapper (AppLayout, ClientLayout)
    │   ├── hooks/            # Custom hooks (useBooking, useSchedule, dll)
    │   ├── services/         # API calls (axios instance + per-resource)
    │   ├── stores/           # State management (Zustand)
    │   └── assets/           # Gambar, font, ikon
    ├── public/
    └── vite.config.js
```

---

## 3. Aturan Koding Backend (Laravel)

- **Satu Controller = Satu Resource.** Jangan campur logika dua resource dalam satu controller.
- **Validasi di Controller, logika di Service.** Proses kompleks (misal: konfirmasi DP + lock jadwal + update status klien) wajib dipindah ke `App\Services\`.
- **Semua response JSON** menggunakan format konsisten:
  ```json
  { "data": {}, "message": "..." }   // sukses
  { "message": "...", "errors": {} } // error validasi (Laravel default)
  ```
- **Soft delete** untuk: Client, Package, Booking, PortfolioItem.
- **Jangan expose sensitive field:** `password`, `remember_token`, `access_token`, `refresh_token`.
- Endpoint publik (tanpa auth): `packages/public`, `schedules/available`, `bookings/request`.
- Semua endpoint privat wajib `middleware('auth:sanctum')`.

---

## 4. Aturan Koding Frontend (React)

- **Mobile-First wajib.** Desain dari layar 375px ke atas. Desktop adalah bonus.
- **Bottom navigation** untuk navigasi utama (maks 5 item).
- **Bottom sheet** (bukan modal full-screen) untuk form pendek dan detail.
- **Komponen kecil.** Satu komponen < 150 baris. Jika lebih, pecah.
- **Custom hook** untuk semua data fetching. Jangan fetch langsung di komponen page.
- **Zustand** untuk global state (auth, notifikasi).
- **Axios instance** terpusat di `src/services/api.js` dengan base URL dan interceptor token.
- **Jangan hardcode warna/font.** Semua dari design token di `src/styles/tokens.css`.

---

## 5. Aturan UI/UX (Antislop)

- Baca `DESIGN.md` sebelum build komponen apapun.
- **Dilarang keras:**
  - Em dash di teks UI
  - Tombol/link yang tidak melakukan apapun
  - Statistik/testimonial palsu
  - Navbar link ke halaman yang belum ada
  - Komponen tanpa empty state + loading state + error state
- **Wajib:**
  - Setiap keputusan visual punya alasan satu kalimat (R-31)
  - Tap target minimum 44px
  - Contrast ratio WCAG AA

---

## 6. Naming Conventions

| Konteks | Convention | Contoh |
|---|---|---|
| PHP Class/Model | PascalCase | `ProofingSession` |
| PHP method/variable | camelCase | `totalPaid()` |
| DB column | snake_case | `booking_code` |
| React component | PascalCase | `BookingCard` |
| React hook | camelCase prefix `use` | `useBooking` |
| CSS variable | `--rb-` prefix | `--rb-color-warm` |
| API endpoint | kebab-case | `/bookings/upcoming` |

---

## 7. Alur Pengerjaan

- Tahap 1: Database Schema + Migration (SELESAI)
- Tahap 2: Laravel API Endpoints (SELESAI)
- Tahap 3: Frontend React PWA (Mobile-First UI & Antislop) (SELESAI)
- Tahap 4: Integrasi API + GDrive OAuth + Cron Jobs (ROADMAP / FUTURE FEATURE)

---

## 8. Yang Tidak Boleh Dilakukan AI

- Membuat migration baru tanpa konfirmasi jika ada data yang bisa hilang.
- Mengubah `routes/api.php` tanpa menjelaskan dampaknya ke endpoint yang sudah ada.
- Menambahkan package/library baru tanpa menyebut alternatif dan alasan pilihan.
- Membuat UI tanpa mengacu ke `DESIGN.md`.
- Menghapus file tanpa konfirmasi eksplisit.
