import Link from 'next/link'

/* Logo Sponsorable — symbole S2 (« S » blanc + point vert sur tuile sombre)
   + wordmark « Sponsor » / « able » en Cabinet Grotesk 800 serré.
   Le symbole est thème-indépendant (toujours tuile sombre) pour rester
   reconnaissable sur fond clair comme sombre. */

const GREEN = '#22c55e'
const DISPLAY = 'var(--font-display), system-ui, sans-serif' // Cabinet Grotesk

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: '#0d0d0f',
        border: '1px solid rgba(255,255,255,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: size * 0.62, color: '#ffffff', lineHeight: 1, letterSpacing: '-0.04em' }}>S</span>
      <span style={{ position: 'absolute', right: size * 0.16, bottom: size * 0.18, width: size * 0.13, height: size * 0.13, borderRadius: '50%', background: GREEN }} />
    </span>
  )
}

export default function Logo({
  tone = 'dark',
  size = 20,
  showMark = true,
  href = '/' as string | null,
}: {
  tone?: 'light' | 'dark'
  size?: number
  showMark?: boolean
  href?: string | null
}) {
  const textColor = tone === 'dark' ? '#ffffff' : '#0f172a'

  const inner = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.5, lineHeight: 1 }}>
      {showMark && <LogoMark size={size * 1.65} />}
      <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: size, letterSpacing: '-0.05em', lineHeight: 1, color: textColor }}>
        Sponsor<span style={{ color: GREEN }}>able</span>
      </span>
    </span>
  )

  if (href === null) return inner
  return (
    <Link href={href} style={{ textDecoration: 'none', flexShrink: 0, lineHeight: 1 }} aria-label="Sponsorable — accueil">
      {inner}
    </Link>
  )
}
