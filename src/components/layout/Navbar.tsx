'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'

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
  const isMobile = useIsMobile()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isDark = dark && !scrolled
  const linkColor = isDark ? 'rgba(255,255,255,0.55)' : '#475569'
  const linkHover  = isDark ? '#ffffff' : '#0f172a'

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: `${NAVBAR_HEIGHT}px`,
        zIndex: 50,
        background: isDark ? 'rgba(10,10,12,0.72)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: scrolled
          ? '1px solid rgba(0,0,0,0.08)'
          : isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        transition: 'all 250ms ease',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 14px' : '0 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Logo wordmark — "Sponsor" blanc + "able" vert, Georgia serif */}
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, lineHeight: 1 }}>
          <span style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 700,
            fontSize: '19px',
            letterSpacing: '-0.01em',
            color: isDark ? '#ffffff' : '#0f172a',
            transition: 'color 250ms ease',
          }}>Sponsor</span>
          <span style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 700,
            fontSize: '19px',
            letterSpacing: '-0.01em',
            color: '#22c55e',
          }}>able</span>
        </Link>

        {/* Nav links — masqués sur mobile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="hidden md:flex">
          {navLinks.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: linkColor,
                fontFamily: '"Syne", system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'color 150ms ease',
                padding: 0,
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = linkHover)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = linkColor)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', flexShrink: 0 }}>
          <Link
            href="/login"
            style={{
              padding: isMobile ? '8px 10px' : '10px 16px',
              fontFamily: '"Syne", system-ui, sans-serif',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 500,
              borderRadius: '8px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              color: isDark ? 'rgba(255,255,255,0.55)' : '#475569',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = isDark ? '#ffffff' : '#0f172a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isDark ? 'rgba(255,255,255,0.55)' : '#475569' }}
          >
            {isMobile ? 'Connexion' : 'Se connecter'}
          </Link>
          <Link
            href="/login?register=1"
            style={{
              padding: isMobile ? '8px 12px' : '10px 20px',
              fontFamily: '"Syne", system-ui, sans-serif',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 700,
              borderRadius: '8px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              background: '#22c55e',
              color: '#0d0d0f',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1daa50' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#22c55e' }}
          >
            {isMobile ? "S'inscrire" : "S'inscrire →"}
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
