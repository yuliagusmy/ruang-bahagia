import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Daftar tema fotografer yang tersedia.
 * isPro: true = butuh subscription Pro untuk unlock.
 * 
 * Tema ini HANYA berlaku di dalam elemen .rb-themed
 * (AppLayout dashboard + PhotographerProfilePage).
 * Halaman publik utama (landing, login) selalu pakai warna default :root.
 */
export const THEMES = [
  {
    id: 'warm',
    name: 'Warm',
    desc: 'Vintage film photography. Amber & cream hangat.',
    isPro: false,
    preview: ['#FAF6F1', '#C8862A', '#E8E0D5'],
  },
  {
    id: 'studio',
    name: 'Studio',
    desc: 'Clean editorial. Hitam-putih bold & modern.',
    isPro: true,
    preview: ['#FAFAFA', '#0A0A0A', '#E4E4E7'],
  },
  {
    id: 'noir',
    name: 'Noir',
    desc: 'Dark mode premium. Gold on black.',
    isPro: true,
    preview: ['#111111', '#C9A84C', '#2E2E2E'],
  },
  {
    id: 'sage',
    name: 'Sage',
    desc: 'Natural earthy. Hijau forest & linen.',
    isPro: true,
    preview: ['#F5F0EB', '#4A6741', '#D8D0C8'],
  },
  {
    id: 'bloom',
    name: 'Bloom',
    desc: 'Lifestyle & fashion. Blush rose pink.',
    isPro: true,
    preview: ['#FFF8F8', '#D4647A', '#F0D8DC'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    desc: 'Blue calm. Ideal untuk fotografer travel & marine.',
    isPro: true,
    preview: ['#F2F7FB', '#2A7CC7', '#C8DDF0'],
  },
]

/**
 * themeStore — state tema aktif fotografer.
 * Disimpan di localStorage.
 * 
 * PENTING: Tema diterapkan via data-attribute pada elemen .rb-themed,
 * BUKAN pada <html> atau <body>. Ini memastikan landing page, login,
 * dan halaman publik platform tetap menggunakan warna default :root.
 * 
 * Cara apply:
 *   applyThemeToElement(element, themeId)
 *   — biasanya dipanggil oleh AppLayout dan PhotographerProfilePage
 */
export const useThemeStore = create(
  persist(
    (set, get) => ({
      activeTheme: 'warm',

      setTheme: (themeId) => {
        set({ activeTheme: themeId })
        // Apply ke semua elemen .rb-themed yang ada di DOM
        document.querySelectorAll('.rb-themed').forEach((el) => {
          el.setAttribute('data-theme', themeId)
        })
      },

      /**
       * Dipanggil saat komponen .rb-themed mount
       * untuk sinkron atribut dengan state tersimpan.
       * Juga menjalankan migrasi tema: 'studio' sebagai default lama
       * direset ke 'warm' (default baru) agar tidak terjebak di mono hitam.
       */
      applyToElement: (element) => {
        if (!element) return
        let theme = get().activeTheme || 'warm'
        // Migrasi: jika user belum pernah pilih tema secara sadar
        // dan terjebak di 'studio' dari versi lama, reset ke 'warm'
        const savedRaw = localStorage.getItem('rb-theme')
        if (savedRaw) {
          try {
            const parsed = JSON.parse(savedRaw)
            // Jika versi state lama tidak punya marker 'v2', berarti lama
            if (!parsed?.state?.themeVersion && parsed?.state?.activeTheme === 'studio') {
              theme = 'warm'
              set({ activeTheme: 'warm', themeVersion: 2 })
            }
          } catch (_) { /* ignore parse error */ }
        }
        element.setAttribute('data-theme', theme)
      },

      /**
       * initTheme — DEPRECATED, diganti applyToElement.
       * Disimpan agar tidak break komponen lama.
       */
      initTheme: () => {
        const theme = get().activeTheme || 'warm'
        document.querySelectorAll('.rb-themed').forEach((el) => {
          el.setAttribute('data-theme', theme)
        })
      },
    }),
    {
      name: 'rb-theme',
      partialize: (state) => ({ activeTheme: state.activeTheme }),
    }
  )
)
