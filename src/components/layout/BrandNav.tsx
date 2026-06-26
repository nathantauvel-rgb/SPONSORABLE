'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Barre de navigation de l'espace marque (annuaire + profil).
const TEXT = 'var(--ds-text)'
const TEXT2 = 'var(--ds-text2)'
const MUTED = 'var(--ds-muted)'
const BORDER = 'var(--ds-border)'
const CARD = 'var(--ds-card)'
const ACCENT = 'var(--ds-accent)'
const SYNE = 'var(--font-syne), system-ui, sans-serif'
const DISPLAY = 'var(--font-display), system-ui, sans-serif'

const LINKS = [
  { href: '/marque', label: 'Annuaire' },
  { href: '/marque/profil', label: 'Mon profil' },
]

export default function BrandNav() {
  const pathname = usePathname()
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: `1px solid ${BORDER}`, background: CARD, position: 'sticky', top: 0, zIndex: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <Link href="/marque" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: '#16a34a', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: TEXT, fontFamily: DISPLAY }}>Sponsorable <span style={{ color: MUTED, fontWeight: 500 }}>· Marque</span></span>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {LINKS.map(l => {
            const active = l.href === '/marque' ? pathname === '/marque' : pathname.startsWith(l.href)
            return (
              <Link key={l.href} href={l.href} style={{ fontSize: '14px', fontWeight: active ? 600 : 500, color: active ? TEXT : TEXT2, textDecoration: 'none', padding: '7px 12px', borderRadius: '8px', background: active ? 'var(--ds-hover, rgba(0,0,0,0.04))' : 'transparent', fontFamily: SYNE }}>
                {l.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <button onClick={() => signOut({ callbackUrl: '/' })} style={{ background: 'none', border: `1px solid ${BORDER}`, color: TEXT2, fontSize: '13px', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontFamily: SYNE }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = ACCENT }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BORDER }}>
        Déconnexion
      </button>
    </header>
  )
}
