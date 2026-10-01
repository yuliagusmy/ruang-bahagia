# FUTURE_FEATURES.md — Spesifikasi Implementasi Fitur Lanjutan

> Dokumen acuan untuk AI Coding Agent berikutnya. 
> Semua arsitektur, skema basis data, endpoint API, dan desain komponen di bawah ini wajib mematuhi aturan di `AGENTS.md` dan `DESIGN.md`.

---

## Daftar Fitur yang Disiapkan:
1. **Fitur 1: Add-on Services & Upselling System** (Pemasukan Ekstra per Booking)
2. **Fitur 2: Client Review & Testimonial Collector** (Social Proof Otomatis)
3. **Fitur 3: Project Expense & Net Profit Calculator** (Laba Bersih Proyek)

---

## 1. Fitur: Add-on Services & Upselling System

### Tujuan:
Memungkinkan fotografer menawarkan layanan tambahan (misal: Cetak Album Kolase, +1 Roll Film, Ekstra Jam / Overtime, Second Shooter) yang dapat dicentang langsung oleh klien saat melakukan pemesanan di `/book`.

### A. Skema Database & Migrasi
Buat migration baru: `database/migrations/YYYY_MM_DD_create_addons_tables.php`

```php
// 1. Tabel Master Add-on Fotografer
Schema::create('package_addons', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('package_id')->nullable()->constrained()->nullOnDelete(); // null = berlaku untuk semua paket
    $table->string('name');                      // Contoh: "Cetak Album Kolase 20x30"
    $table->text('description')->nullable();     // Contoh: "Hardcover eksklusif 20 halaman cetak lab premium"
    $table->decimal('price', 12, 2);             // Contoh: 450000.00
    $table->string('icon', 10)->default('📦');   // Emoji / Icon
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
});

// 2. Tabel Pivot Transaksi Add-on per Booking
Schema::create('booking_addons', function (Blueprint $table) {
    $table->id();
    $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
    $table->foreignId('package_addon_id')->nullable()->nullOnDelete();
    $table->string('name');                      // Snapshot nama saat booking
    $table->decimal('price', 12, 2);             // Snapshot harga saat booking
    $table->unsignedInteger('quantity')->default(1);
    $table->timestamps();
});
```

### B. Backend Implementation
* **Models:**
  - `App\Models\PackageAddon.php` (relasi `belongsTo(User::class)`, `belongsTo(Package::class)`)
  - `App\Models\BookingAddon.php` (relasi `belongsTo(Booking::class)`)
  - Di `Package.php`: tambahkan `public function addons() { return $this->hasMany(PackageAddon::class); }`
  - Di `Booking.php`: tambahkan `public function addons() { return $this->hasMany(BookingAddon::class); }`
* **Controller & Endpoints:**
  - `GET /api/packages/{package}/addons` (Public/Private — Ambil daftar addon aktif)
  - `POST /api/packages/{package}/addons` (Private — Fotografer membuat addon)
  - `DELETE /api/packages/{package}/addons/{addon}` (Private — Hapus addon)
* **Logika di `BookingController::clientRequest`:**
  - Terima field `addon_ids: array`
  - Hitung total: `$totalPrice = $package->price + PackageAddon::whereIn('id', $addonIds)->sum('price');`
  - Simpan record ke `booking_addons`.

### C. Frontend Implementation
* **Halaman Booking Klien (`PublicBookingPage.jsx`):**
  - Tampilkan section kartu "Tambahkan Layanan Ekstra (Add-on)".
  - Checkbox interaktif dengan harga & deskripsi.
  - Ringkasan total harga & estimasi DP otomatis menyesuaikan.
* **Halaman Detail Booking Fotografer (`BookingDetailPage.jsx`):**
  - Tampilkan daftar Add-on yang dipilih klien pada rincian sesi.
* **Invoice Modal (`InvoiceReceiptModal.jsx`):**
  - Tampilkan add-on sebagai baris terpisah pada tabel tagihan.

---

## 2. Fitur: Client Review & Testimonial Collector

### Tujuan:
Mengumpulkan rating bintang 1–5 dan ulasan langsung dari klien setelah menerima foto final, lalu menampilkannya di halaman profil publik `/@username` fotografer sebagai daya tarik calon klien.

### A. Skema Database & Migrasi
Buat migration: `database/migrations/YYYY_MM_DD_create_testimonials_table.php`

```php
Schema::create('testimonials', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();     // Fotografer
    $table->foreignId('booking_id')->constrained()->cascadeOnDelete();  // Booking terkait
    $table->string('client_name');
    $table->unsignedTinyInteger('rating');                              // 1 sampai 5
    $table->text('comment');                                            // Testimoni klien
    $table->boolean('is_approved')->default(true);                      // Moderasi
    $table->boolean('is_featured')->default(false);                     // Tampil di sorotan profil
    $table->timestamps();
});
```

### B. Backend Implementation
* **Model:** `App\Models\Testimonial.php`
* **Controller:** `App\Http\Controllers\Api\TestimonialController.php`
* **Endpoints:**
  - `POST /api/deliveries/{bookingCode}/review` (Public — Klien submit ulasan & rating bintang 1–5)
  - `GET /api/photographers/{username}/reviews` (Public — Ambil review terverifikasi untuk profil)
  - `GET /api/reviews` (Private — Fotografer melihat semua ulasan masuk)
  - `PATCH /api/reviews/{id}/toggle-featured` (Private — Tandai ulasan favorit)

### C. Frontend Implementation
* **Halaman Unduh Delivery Klien (`ClientDeliveryPage.jsx`):**
  - Di bawah tombol download foto, sediakan kartu:
    *"Bagaimana kesan sesi foto Anda bersama {photographer_name}?"*
  - Pilihan bintang interaktif (★ ★ ★ ★ ★) + textarea kesan & pesan.
  - Setelah dikirim, tampilkan ucapan terima kasih yang hangat.
* **Halaman Profil Publik Fotografer (`PhotographerProfilePage.jsx`):**
  - Section baru: "Kata Klien Bahagia" (Testimonial Carousel / Grid).
  - Tampilkan bintang, kutipan ulasan, nama klien, dan jenis paket yang diambil.

---

## 3. Fitur: Project Expense & Net Profit Calculator

### Tujuan:
Membantu fotografer mengontrol kesehatan finansial dengan mencatat biaya produksi per booking (sewa studio, honor asisten/second shooter, cetak album, transport) dan menghitung laba bersih otomatis.

### A. Skema Database & Migrasi
Buat migration: `database/migrations/YYYY_MM_DD_create_booking_expenses_table.php`

```php
Schema::create('booking_expenses', function (Blueprint $table) {
    $table->id();
    $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->enum('category', [
        'studio_rental',  // Sewa studio
        'assistant_fee',  // Honor asisten / second shooter
        'transport',      // Bensin / tol / transport
        'printing',       // Cetak foto / album
        'props',          // Properti / wardrobe
        'other',          // Lain-lain
    ])->default('other');
    $table->string('title');                         // Keterangan pos pengeluaran
    $table->decimal('amount', 12, 2);                // Nominal pengeluaran
    $table->date('expense_date')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

### B. Backend Implementation
* **Model:** `App\Models\BookingExpense.php`
* **Controller:** `App\Http\Controllers\Api\ExpenseController.php`
* **Endpoints (Private):**
  - `GET /api/bookings/{booking}/expenses` (Ambil pengeluaran & ringkasan laba bersih)
  - `POST /api/bookings/{booking}/expenses` (Tambah catatan biaya)
  - `DELETE /api/bookings/{booking}/expenses/{expense}` (Hapus catatan biaya)
* **Kalkulasi Laba:**
  - `total_revenue = booking.total_price`
  - `total_expense = sum(expenses.amount)`
  - `net_profit = total_revenue - total_expense`
  - `profit_margin_percent = round((net_profit / total_revenue) * 100, 1)`

### C. Frontend Implementation
* **Halaman Detail Booking (`BookingDetailPage.jsx`):**
  - Kartu: **"💰 Analisis Laba Bersih Proyek"**.
  - Tampilan ringkas:
    - Pemasukan (Total Biaya Paket)
    - Total Pengeluaran
    - **Laba Bersih:** `Rp X.XXX.XXX`
    - **Margin:** `68% (Sehat)` (badge hijau jika > 50%, amber jika 25-50%, merah jika < 25%)
  - Tombol: `+ Catat Pengeluaran`.
  - Sheet input: Kategori, Keterangan, Nominal, Tanggal.

---

## 4. Panduan Eksekusi untuk AI Agent Berikutnya:
1. Jalankan `git status` terlebih dahulu untuk memastikan working directory bersih.
2. Buat migration satu per satu: `php artisan make:migration ...`
3. Ikuti aturan `AGENTS.md`: satu controller per resource, response format `{ data: ..., message: ... }`.
4. Ikuti aturan `DESIGN.md`: gunakan token CSS `--rb-*`, jangan hardcode warna, dan utamakan layout mobile-first (min 375px).
5. Buat custom hook terpisah di `frontend/src/hooks/` untuk setiap fitur baru.
