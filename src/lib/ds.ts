/**
 * Design System — tokens partagés (landing + dashboard)
 * Toute couleur hardcodée dans une page dashboard doit venir d'ici.
 */

export const BG      = '#1c1c1b'
export const SURFACE = '#1f1f1e'
export const CARD    = '#242423'
export const ACCENT  = '#2ea862'
export const TEXT    = '#ededec'
export const MUTED   = '#9b9a95'
export const BORDER  = '#2f2f2d'
export const VIOLET  = '#7c5cff'
export const CORAL   = '#fb7185'
export const GOLD    = '#f5b544'

export const SYNE    = 'var(--font-syne), system-ui, sans-serif'
export const MONO    = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

/** Titres display — Cabinet Grotesk (auto-hébergé) */
export const DISPLAY = 'var(--font-display), system-ui, sans-serif'

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
