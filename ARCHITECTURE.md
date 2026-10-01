# ARCHITECTURE.md — Ruang Bahagia

> Referensi struktur dan alur data proyek. Baca sebelum menambah fitur baru.

---

## Stack

| Layer | Teknologi |
|---|---|
| Backend API | Laravel 9, PHP 8.0, MySQL |
| Auth | Laravel Sanctum (token-based) |
| Frontend | React 18 + Vite, PWA (vite-plugin-pwa) |
| Styling | Vanilla CSS (design tokens) |
| State | Zustand |
| HTTP Client | Axios |
| Storage | Google Drive API via OAuth 2.0 |
| Scheduler | Laravel Cron Jobs |

---

## Struktur Folder Backend

```
backend/app/
├── Http/
│   ├── Controllers/Api/
│   │   ├── AuthController.php
│   │   ├── BookingController.php
│   │   ├── ClientController.php
│   │   ├── DashboardController.php
│   │   ├── PackageController.php
│   │   ├── PaymentController.php
│   │   └── ScheduleController.php
│   └── Middleware/
├── Models/
│   ├── Booking.php
│   ├── Client.php
│   ├── Delivery.php
│   ├── GoogleDriveToken.php
│   ├── Notification.php
│   ├── Package.php
│   ├── Payment.php
│   ├── PortfolioItem.php
│   ├── ProofingPhoto.php
│   ├── ProofingSelection.php
│   ├── ProofingSession.php
│   ├── Schedule.php
│   └── User.php
└── Services/               # Business logic kompleks (dibuat Tahap 4)
    ├── GoogleDriveService.php
    ├── WatermarkService.php
    └── DeliveryService.php
```

---

## Struktur Folder Frontend

```
frontend/src/
├── assets/
│   └── fonts/
├── components/
│   ├── ui/               # Primitif: Button, Badge, Avatar, Input
│   ├── booking/          # BookingCard, BookingForm, BookingStatus
│   ├── calendar/         # CalendarGrid, SlotPicker
│   ├── client/           # ClientCard, ClientPipeline
│   ├── payment/          # PaymentForm, InvoiceCard
│   ├── proofing/         # PhotoSwipeCard, SelectionCounter
│   ├── portfolio/        # GalleryGrid, PhotoCard
│   └── layout/           # BottomNav, BottomSheet, AppHeader
├── hooks/
│   ├── useAuth.js
│   ├── useBookings.js
│   ├── useClients.js
│   ├── useSchedules.js
│   ├── usePackages.js
│   └── useProofing.js
├── layouts/
│   ├── AppLayout.jsx     # Layout fotografer (bottom nav + header)
│   └── ClientLayout.jsx  # Layout klien (proofing + download)
├── pages/
│   ├── auth/
│   │   └── LoginPage.jsx
│   ├── dashboard/
│   │   └── DashboardPage.jsx
│   ├── bookings/
│   │   ├── BookingListPage.jsx
│   │   └── BookingDetailPage.jsx
│   ├── clients/
│   │   ├── ClientListPage.jsx
│   │   └── ClientDetailPage.jsx
│   ├── schedule/
│   │   └── SchedulePage.jsx
│   ├── packages/
│   │   └── PackagePage.jsx
│   ├── proofing/
│   │   ├── ProofingPage.jsx      # View fotografer
│   │   └── ClientProofingPage.jsx # View klien (public)
│   └── portfolio/
│       └── PortfolioPage.jsx
├── services/
│   ├── api.js            # Axios instance + interceptor
│   ├── auth.service.js
│   ├── booking.service.js
│   ├── client.service.js
│   ├── schedule.service.js
│   └── package.service.js
├── stores/
│   ├── authStore.js      # Token + user data
│   └── notifStore.js     # Unread notifications count
└── styles/
    ├── tokens.css         # Design tokens (--rb-*)
    ├── base.css           # Reset + global base
    └── index.css          # Import semua
```

---

## Alur Data Utama

### 1. Booking Flow

```
Klien isi form (public) → POST /bookings/request
  → Booking status: pending
  → Fotografer konfirmasi → status: confirmed
  → Klien bayar DP → POST /bookings/{id}/payments (type: dp)
  → status: dp_paid → Schedule.status = booked
  → Hari H shooting → status: in_progress
  → Proses edit → status: editing
  → Upload proofing → ProofingSession dibuat
  → Klien seleksi → status: proofing
  → Upload final → Delivery dibuat
  → Klien download → status: completed
  → 14 hari kemudian → Cron job hapus file GDrive
```

### 2. Proofing Flow

```
Fotografer upload foto mentah
  → Backend resize ke low-res + tambah watermark (WatermarkService)
  → Upload ke GDrive (GoogleDriveService)
  → ProofingPhoto.status = ready
  → Fotografer set ProofingSession.status = active
  → Kirim link + PIN ke klien

Klien buka URL /proof/{slug}
  → Masukkan PIN
  → Swipe kanan (selected) / kiri (skipped) per foto
  → Batasan: selection_quota dari Package
  → Selesai → ProofingSession.status = completed

Fotografer terima notifikasi
  → Lihat daftar original_filename yang dipilih
  → Copy-paste ke Lightroom
```

### 3. Auth Flow

```
POST /api/auth/login
  → Response: { token, user }
  → Token disimpan di localStorage (Zustand persist)
  → Axios interceptor attach Authorization: Bearer {token}
  → Semua request private otomatis terauthentikasi
```

---

---

## API Base URL Convention

```
Development : http://localhost:8000/api
Production  : https://api.ruangbahagia.com/api (atau URL Railway/Render/VPS)
```

Frontend membaca dari `VITE_API_URL` di file `.env`.

---

## Status Fase Pengembangan

- **Tahap 1: Database Schema + Migrations** (Selesai)
- **Tahap 2: Laravel REST API Endpoints** (Selesai)
- **Tahap 3: Frontend React PWA (Mobile-First UI, Antislop, Offline Support)** (Selesai)
- **Tahap 4: Google Drive OAuth 2.0, Cron Jobs, Delivery Final, Midtrans SaaS & Digital Invoice** (Selesai)

---

## Roadmap: Fitur Lanjutan Selanjutnya

Spesifikasi lengkap dan arsitektur untuk pengembangan fitur tahap berikutnya didokumentasikan di [FUTURE_FEATURES.md](file:///d:/Project/ruang-bahagia/FUTURE_FEATURES.md):

1. **Add-on Services & Upselling System** (Ekstra jam, cetak album kolase, film analog di halaman booking)
2. **Client Review & Testimonial Collector** (Rating bintang 1-5 di delivery portal & profil publik fotografer)
3. **Project Expense & Net Profit Calculator** (Catatan biaya produksi & kalkulasi margin profit bersih per booking)

Lihat detail migration, controller, endpoints, dan struktur komponen frontend di [FUTURE_FEATURES.md](file:///d:/Project/ruang-bahagia/FUTURE_FEATURES.md).


