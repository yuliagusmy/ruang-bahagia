import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Daftar tema yang tersedia.
 * isPro: true = butuh subscription Pro untuk unlock.
 */
export const THEMES = [
  {
    id: 'studio',
    name: 'Studio',
    desc: 'Clean editorial. Hitam-putih bold.',
    isPro: false,
    preview: ['#FAFAFA', '#0A0A0A', '#E4E4E7'],
  },
  {
    id: 'warm',
    name: 'Warm',
    desc: 'Vintage film photography. Amber & cream.',
    isPro: true,
    preview: ['#FAF6F1', '#C8862A', '#E8E0D5'],
  },
  {
    id: 'noir',
    name: 'Noir',
    desc: 'Dark mode premium. Gold on black.',
    isPro: true,
    preview: ['#111111', '#C9B99A', '#2E2E2E'],
  },
  {
    id: 'sage',
    name: 'Sage',
    desc: 'Natural earthy. Hijau & linen.',
    isPro: true,
    preview: ['#F5F0EB', '#4A6741', '#D8D0C8'],
  },
  {
    id: 'bloom',
    name: 'Bloom',
    desc: 'Lifestyle & fashion. Blush pink.',
    isPro: true,
    preview: ['#FFF8F8', '#D4647A', '#F0D8DC'],
  },
]

/**
 * themeStore — global state untuk tema aktif.
 * Disimpan di localStorage. Diterapkan ke <body data-theme="...">
 */
export const useThemeStore = create(
  persist(
    (set, get) => ({
      activeTheme: 'studio',

      setTheme: (themeId) => {
        set({ activeTheme: themeId })
        // Apply ke DOM langsung
        document.documentElement.setAttribute('data-theme', themeId)
      },

      initTheme: () => {
        // Dipanggil saat app mount untuk sinkron DOM dengan state tersimpan
        const theme = get().activeTheme || 'studio'
        document.documentElement.setAttribute('data-theme', theme)
      },
    }),
    {
      name: 'rb-theme',
      partialize: (state) => ({ activeTheme: state.activeTheme }),
    }
  )
)
