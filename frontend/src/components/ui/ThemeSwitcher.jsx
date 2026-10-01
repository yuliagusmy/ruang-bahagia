import { useThemeStore, THEMES } from '../../stores/themeStore'
import { useAuthStore } from '../../stores/authStore'
import './ThemeSwitcher.css'

/**
 * ThemeSwitcher — komponen untuk pilih tema di halaman Settings.
 * Tema Pro dilockout dengan badge "PRO" jika user belum subscribe.
 */
export default function ThemeSwitcher() {
  const { activeTheme, setTheme } = useThemeStore()
  const user = useAuthStore((s) => s.user)
  const isPro = Boolean(user?.is_pro || user?.subscription_tier === 'pro' || user?.subscription_plan === 'pro')

  return (
    <div className="rb-theme-switcher">
      <div className="rb-theme-switcher__grid">
        {THEMES.map((theme) => {
          const isLocked = theme.isPro && !isPro
          const isActive = activeTheme === theme.id

          return (
            <button
              key={theme.id}
              type="button"
              className={[
                'rb-theme-card',
                isActive && 'rb-theme-card--active',
                isLocked && 'rb-theme-card--locked',
              ].filter(Boolean).join(' ')}
              onClick={() => !isLocked && setTheme(theme.id)}
              disabled={isLocked}
              aria-pressed={isActive}
              title={isLocked ? 'Upgrade ke Pro untuk menggunakan tema ini' : theme.name}
            >
              {/* Preview palette swatches */}
              <div className="rb-theme-card__preview">
                {theme.preview.map((color, i) => (
                  <span
                    key={i}
                    className="rb-theme-card__swatch"
                    style={{ background: color }}
                  />
                ))}
              </div>

              <div className="rb-theme-card__info">
                <span className="rb-theme-card__name">{theme.name}</span>
                <span className="rb-theme-card__desc">{theme.desc}</span>
              </div>

              {/* Pro badge */}
              {theme.isPro && (
                <span className="rb-theme-card__pro-badge">
                  {isLocked ? '🔒 PRO' : '✦ PRO'}
                </span>
              )}

              {/* Active checkmark */}
              {isActive && (
                <span className="rb-theme-card__check" aria-hidden="true">✓</span>
              )}
            </button>
          )
        })}
      </div>

      {!isPro && (
        <p className="rb-theme-switcher__upgrade-hint">
          Upgrade ke <strong>Ruang Bahagia Pro</strong> untuk mengakses 4 tema eksklusif.
        </p>
      )}
    </div>
  )
}
