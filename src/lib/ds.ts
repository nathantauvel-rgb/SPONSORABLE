/**
 * Design System — tokens partagés (landing + dashboard)
 * Toute couleur hardcodée dans une page dashboard doit venir d'ici.
 */

export const BG      = '#0d0d0f'
export const SURFACE = '#111318'
export const CARD    = '#1c1f26'
export const ACCENT  = '#22c55e'
export const TEXT    = '#ffffff'
export const MUTED   = '#888888'
export const BORDER  = '#222222'
export const VIOLET  = '#7c5cff'
export const CORAL   = '#fb7185'
export const GOLD    = '#f5b544'

export const SYNE    = '"Syne", var(--font-syne), system-ui, sans-serif'
export const MONO    = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

/** Titres display — Cabinet Grotesk (auto-hébergé) */
export const DISPLAY = '"Cabinet Grotesk", var(--font-display), system-ui, sans-serif'

/** Chiffres métriques — Martian Mono (substitut libre de Berkeley Mono).
    Inclut tabular-nums : à appliquer avec `fontVariantNumeric: 'tabular-nums'`. */
export const NUM     = '"Martian Mono", var(--font-num), ui-monospace, monospace'

/** Wrappers de layout — utilisés dans le <main> de chaque page dashboard */
export const MAIN_STYLE = {
  background: BG,
  minHeight: '100vh',
} as const

export const CONTENT_STYLE = {
  marginLeft: '240px',
  padding: '40px 48px',
  minHeight: '100vh',
} as const

/** Card standard sombre */
export const cardStyle = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: '12px',
} as const

/** Input sombre */
export const inputStyle = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: '8px',
  color: TEXT,
  fontFamily: SYNE,
  fontSize: '14px',
  padding: '10px 14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
  transition: 'border-color 150ms ease',
}
