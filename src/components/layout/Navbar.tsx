'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const navLinks = [
  { label: 'Comment ça marche', id: 'comment-ca-marche' },
  { label: 'Exemples',          id: 'exemples' },
  { label: 'FAQ',               id: 'faq' },
  { label: 'Tarifs',            id: 'tarifs' },
]

const NAVBAR_HEIGHT = 64

const scrollToSection = (id: string) => {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT
  window.scrollTo({ top, behavior: 'smooth' })
}

const Navbar = ({ dark = false }: { dark?: boolean }) => {
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isDark = dark && !scrolled
  const linkColor = isDark ? 'rgba(255,255,255,0.65)' : '#475569'
  const linkHover  = isDark ? '#ffffff' : '#0f172a'

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: `${NAVBAR_HEIGHT}px`,
        zIndex: 50,
        background: isDark ? 'rgba(8,13,20,0.6)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: scrolled
          ? '1px solid rgba(0,0,0,0.07)'
          : isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 250ms ease',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Logo */}
        <Link href="/" style={{ fontWeight: 700, fontSize: '18px', color: '#16a34a', textDecoration: 'none', letterSpacing: '-0.01em', flexShrink: 0 }}>
          Sponsorable
        </Link>

        {/* Nav links — masqués sur mobile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="hidden md:flex">
          {navLinks.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: linkColor, fontSize: '15px', fontWeight: 500, transition: 'color 150ms ease', padding: 0 }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = linkHover)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = linkColor)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/login"
            style={{
              padding: '10px 16px', fontSize: '14px', fontWeight: 500,
              borderRadius: '10px', textDecoration: 'none',
              color: isDark ? 'rgba(255,255,255,0.65)' : '#475569',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = isDark ? '#ffffff' : '#0f172a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isDark ? 'rgba(255,255,255,0.65)' : '#475569' }}
          >
            Se connecter
          </Link>
          <Link
            href="/login?register=1"
            style={{
              padding: '10px 20px', fontSize: '14px', fontWeight: 600,
              borderRadius: '10px', textDecoration: 'none',
              background: isDark ? 'rgba(255,255,255,0.10)' : '#0f172a',
              color: 'white',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.18)' : '#1e293b' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.10)' : '#0f172a' }}
          >
            S&apos;inscrire →
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
