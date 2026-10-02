# FUTURE_FEATURES.md — Spesifikasi Implementasi Fitur Lanjutan

> Dokumen acuan arsitektur dan riwayat pengembangan fitur aplikasi **Ruang Bahagia**.
> Semua implementasi mematuhi aturan di `AGENTS.md` dan `DESIGN.md`.

---

## Status Implementasi Fitur

| Fitur | Status | Detail Implementasi |
|---|---|---|
| **Add-on Services & Upselling System** | ✅ SELESAI | `PackageAddon`, `BookingAddon`, `PackageAddonController` |
| **Client Review & Testimonial Collector** | ✅ SELESAI | `Testimonial`, `TestimonialController`, Form di `ClientDeliveryPage`, Carousel di `PhotographerProfilePage` |
| **Project Expense & Net Profit Calculator** | ✅ SELESAI | `BookingExpense`, `ExpenseController`, Form kalkulator laba bersih di `BookingDetailPage` |
| **Laporan Keuangan & Ekspor Excel (CSV/PDF)** | ✅ SELESAI | `ReportController`, `FinancialReportPage`, cetak print invoice |
| **WhatsApp Gateway (Fonnte / Wablas)** | ✅ SELESAI | `WhatsAppService`, direct 1-klik di `BookingDetailPage`, kartu konfigurasi & test WA di `SettingsPage` |
| **Web Push & In-App Notifications** | ✅ SELESAI | `WebPushService`, `PushSubscription`, `NotificationSheet`, live bell badge di `AppHeader`, `sw-push.js` |

---

## 1. Fitur: Add-on Services & Upselling System ✅
* **Migrasi:** `2026_09_29_125600_create_addons_tables.php`
* **Model:** `PackageAddon`, `BookingAddon`
* **Controller:** `PackageAddonController`
* **Integrasi:** Halaman booking publik klien dapat memilih add-on (cetak kanvas, extra jam sesi, film analog), terakumulasi ke total invoice & DP otomatis.

---

## 2. Fitur: Client Review & Testimonial Collector ✅
* **Migrasi:** `2026_10_02_000001_create_testimonials_table.php`
* **Model:** `Testimonial` (`user_id`, `booking_id`, `client_name`, `rating`, `comment`, `is_approved`, `is_featured`)
* **Controller:** `TestimonialController`
  - `POST /api/deliveries/{bookingCode}/review` (Public)
  - `GET /api/photographers/{username}/reviews` (Public)
  - `GET /api/reviews` (Private)
  - `PATCH /api/reviews/{testimonial}/toggle-featured` (Private)
  - `DELETE /api/reviews/{testimonial}` (Private)
* **Frontend:**
  - `ClientDeliveryPage.jsx`: Kartu rating 1–5 bintang interaktif + form pesan & kesan setelah unduh foto final. Notifikasi in-app otomatis dikirim ke fotografer.
  - `PhotographerProfilePage.jsx`: Section "Kata Klien Bahagia ✨" menampilkan rata-rata rating bintang, badge sorotan, dan ulasan terverifikasi klien.
  - `testimonialService.js`: Service layer Axios terpusat.

---

## 3. Fitur: Project Expense & Net Profit Calculator ✅
* **Migrasi:** `2026_10_01_000002_update_booking_expenses_and_add_reminders.php`
* **Model:** `BookingExpense`
* **Controller:** `ExpenseController`
* **Integrasi:** Fotografer dapat mencatat pengeluaran operasional per sesi (biaya sewa studio, cetak album, transport, asisten) dan melihat kalkulasi laba bersih secara real-time di rincian booking.

---

## 4. Fitur: Laporan Keuangan & Ekspor Excel (CSV/PDF) ✅
* **Controller:** `ReportController`
  - `GET /api/reports/financial`
  - `GET /api/reports/financial/export-csv`
* **Frontend:** `FinancialReportPage.jsx` (`/reports`)
  - Filter rentang waktu: Bulan Ini, Bulan Lalu, Tahun Ini, Rentang Kustom.
  - Visual KPI: Total Omzet, Total Pengeluaran, Laba Bersih, Margin Keuntungan, dan Jumlah Sesi.
  - Ekspor Excel (.csv dengan format UTF-8 BOM) dan tombol Cetak Laporan PDF langsung.

---

## 5. Fitur: WhatsApp Gateway & Otomatisasi Notifikasi ✅
* **Service:** `WhatsAppService.php` (mendukung provider Fonnte & Wablas serta mode simulasi log)
* **Otomatisasi:**
  - Saat DP dikonfirmasi oleh fotografer → kirim WhatsApp otomatis ke klien.
  - Jadwal H-1 sesi pemotretan → cron job `ruangbahagia:send-h1-reminders` setiap pukul 09:00 WIB.
  - Saat link foto final diterbitkan → kirim WhatsApp delivery otomatis dengan PIN akses unduhan.
* **Fitur Pengaturan:**
  - `SettingsPage.jsx`: Pilih provider (Fonnte/Wablas), token API, toggle otomatisasi, dan fitur **Kirim Pesan Tes WhatsApp**.
* **Fitur 1-Klik:**
  - `BookingDetailPage.jsx`: Tombol **⚡ Kirim Langsung via WhatsApp Gateway** dengan pratinjau teks dan status pengiriman, didukung tombol fallback ke **wa.me**.

---

## 6. Fitur: Web Push Notifications PWA & Panel Notifikasi In-App ✅
* **Service:** `WebPushService.php` + `PushSubscription.php`
* **Pemicu:**
  - Booking baru masuk dari klien → Push notification & in-app alert ke fotografer.
  - Klien selesai melakukan swipe seleksi foto proofing → Push notification & in-app alert.
  - Ulasan klien baru masuk dari halaman delivery → In-app notification.
* **Frontend:**
  - `AppHeader.jsx`: Bell notifikasi dengan live unread badge counter.
  - `NotificationSheet.jsx`: Bottom sheet daftar notifikasi real-time, pengelompokan ikon, waktu relatif, dan aksi klik langsung menuju rincian booking.
  - `notifStore.js`: Zustand store untuk manajemen notifikasi terpusat.
  - `pushNotifications.js` & `sw-push.js`: Registrasi Web Push API browser & service worker event handler.
