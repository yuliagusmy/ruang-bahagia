# DESIGN.md — Ruang Bahagia

> Sumber kebenaran visual untuk semua komponen UI.
> Baca ini sebelum membangun atau mengubah tampilan apapun.

---

## Design Read

> Reading this as: **mobile PWA untuk fotografer indie lokal**, audience: fotografer + klien mereka,
> visual language: **warm editorial**, dial **ENERGY 3 / RHYTHM 3 / MOTION 2**.

---

## Identity

**Nama brand:** Ruang Bahagia
**Karakter:** Hangat, personal, authentik. Seperti ngobrol dengan fotografer favorit, bukan membuka aplikasi korporat.
**Satu kalimat:** Tempat di mana momen berharga dikelola dengan hati.

---

## Color Palette

### Core (maksimal 3 warna utama)

| Nama | Value | Penggunaan |
|---|---|---|
| `--rb-warm-900` | `#1C1410` | Teks utama, heading |
| `--rb-warm-700` | `#5C3D2E` | Aksen sekunder, border aktif |
| `--rb-cream-50`  | `#FAF6F1` | Background utama |

### Accent (1 warna aksen, dipakai hemat)

| Nama | Value | Penggunaan |
|---|---|---|
| `--rb-amber`    | `#C8862A` | CTA utama, highlight aktif, progress bar |

### Neutral

| Nama | Value | Penggunaan |
|---|---|---|
| `--rb-stone-200` | `#E8E0D5` | Border, divider, input background |
| `--rb-stone-400` | `#A09080` | Placeholder, label sekunder |
| `--rb-stone-600` | `#6B5B4E` | Body text sekunder |
| `--rb-white`     | `#FFFFFF` | Card background, modal |

### Status

| Nama | Value | Penggunaan |
|---|---|---|
| `--rb-success` | `#4A7C59` | Lunas, completed, tersedia |
| `--rb-warning` | `#C8862A` | Pending, menunggu DP |
| `--rb-error`   | `#9B3A3A` | Gagal, dibatalkan, error |
| `--rb-info`    | `#3A6B9B` | Info, proofing aktif |

---

## Typography

**Alasan pilihan font:** Playfair Display memberi karakter editorial warm sesuai identity fotografer indie. Plus Jakarta Sans untuk body karena keterbacaan mobile-first yang optimal.

| Peran | Font | Weight | Size (mobile) |
|---|---|---|---|
| Display heading | Playfair Display | 700 | 28-36px |
| Section heading | Playfair Display | 600 | 20-24px |
| Body text | Plus Jakarta Sans | 400 | 14-16px |
| Label/caption | Plus Jakarta Sans | 500 | 12-13px |
| CTA/button | Plus Jakarta Sans | 600 | 14-15px |

---

## Spacing System

Base unit: `4px`. Semua spacing kelipatan 4.

```
--rb-space-1:  4px
--rb-space-2:  8px
--rb-space-3:  12px
--rb-space-4:  16px
--rb-space-5:  20px
--rb-space-6:  24px
--rb-space-8:  32px
--rb-space-10: 40px
--rb-space-12: 48px
```

---

## Border Radius

**Prinsip:** Sudut tidak bulat penuh (anti pill-shape). Ada karakter organik tapi tetap tegas.

```
--rb-radius-sm:  6px   /* input, badge kecil */
--rb-radius-md:  12px  /* card, button */
--rb-radius-lg:  20px  /* bottom sheet, modal */
--rb-radius-xl:  28px  /* galeri foto, proofing card */
```

---

## Shadow

Shadow minimal, hanya untuk elevasi yang memang diperlukan.

```
--rb-shadow-card:   0 2px 8px rgba(28, 20, 16, 0.08);   /* card default */
--rb-shadow-raised: 0 8px 24px rgba(28, 20, 16, 0.14);  /* bottom sheet, floating button */
--rb-shadow-photo:  0 4px 16px rgba(28, 20, 16, 0.20);  /* foto di galeri/proofing */
```

---

## Component Patterns

### Bottom Navigation (navigasi utama)

- Maks 5 item
- Ikon + label teks
- Aksen `--rb-amber` untuk item aktif
- Background `--rb-white` dengan shadow raised
- Safe area padding untuk iPhone notch

### Bottom Sheet

- Radius `--rb-radius-lg` hanya di atas
- Handle bar di tengah atas
- Overlay semi-transparan `rgba(28, 20, 16, 0.5)`
- Animasi: slide up 300ms ease-out

### CTA Button

- Background `--rb-amber`, teks putih
- Radius `--rb-radius-md`
- Min height 48px (tap target aman)
- Hover: brightness 0.92
- Disabled: opacity 0.5

### Card

- Background `--rb-white`
- Border `1px solid --rb-stone-200`
- Radius `--rb-radius-md`
- Shadow `--rb-shadow-card`
- Padding `--rb-space-4`

### Status Badge

- Radius `--rb-radius-sm`
- Ukuran font 12px
- Background 10% opacity dari warna status
- Teks warna status penuh

---

## Motion / Animation

**Dial MOTION 2:** Scroll-reveal dan transisi halaman. Tidak berlebihan, tapi ada rasa hidup.

| Animasi | Duration | Easing |
|---|---|---|
| Page transition | 250ms | ease-in-out |
| Bottom sheet open | 300ms | ease-out |
| Card hover scale | 150ms | ease |
| Swipe photo (proofing) | 200ms | ease-in-out |
| Fade in komponen | 200ms | ease |

Tidak menggunakan: bounce, floating terus-menerus, atau animasi tanpa tujuan UX.

---

## Dials (wajib dipatuhi seluruh UI)

| Dial | Nilai | Artinya |
|---|---|---|
| ENERGY | 3 | Bold, ada focal point kuat, heading besar, kontras tinggi |
| RHYTHM | 3 | Setiap section komposisinya berbeda, tidak seragam |
| MOTION | 2 | Transisi halus dan purposeful, bukan dekoratif |

---

## Identity Motif (yang membuat ini "Ruang Bahagia")

- Foto selalu full-bleed atau dengan rasio konsisten (4:3 atau 3:4 portrait)
- Heading section memakai Playfair Display italic untuk nama klien atau event
- Aksen `--rb-amber` muncul tepat satu kali per screen sebagai focal point
- Texture kertas halus (noise 3-5%) pada background `--rb-cream-50` di beberapa section
