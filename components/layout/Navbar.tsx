'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const Navbar = ({ dark = false }: { dark?: boolean }) => {
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isDark = dark && !scrolled

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        zIndex: 50,
        background: isDark ? 'rgba(8,13,20,0.5)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: scrolled
          ? '1px solid rgba(0,0,0,0.07)'
          : isDark
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid transparent',
        transition: 'all 250ms ease',
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>

        <Link href="/" style={{ fontWeight: 700, fontSize: '18px', color: '#16a34a', textDecoration: 'none', letterSpacing: '-0.01em' }}>
          Sponsorable
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="hidden md:flex">
          {[
            { label: 'Comment ça marche', anchor: 'comment-ca-marche' },
            { label: 'Tarifs', anchor: 'tarifs' },
            { label: 'Exemples', anchor: 'exemples' },
          ].map(({ label, anchor }) => (
            <a
              key={label}
              href={`#${anchor}`}
              onClick={e => {
                e.preventDefault()
                const el = document.getElementById(anchor)
                if (el) el.scrollIntoView({ behavior: 'smooth' })
                else router.push(`/#${anchor}`)
              }}
              style={{ color: isDark ? 'rgba(255,255,255,0.65)' : '#475569', fontSize: '15px', textDecoration: 'none', transition: 'color 150ms ease', fontWeight: 450 }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = isDark ? '#ffffff' : '#0f172a')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = isDark ? 'rgba(255,255,255,0.65)' : '#475569')}
            >
              {label}
            </a>
          ))}
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            background: isDark ? 'rgba(255,255,255,0.10)' : '#0f172a',
            color: 'white',
            backdropFilter: isDark ? 'blur(8px)' : 'none',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.16)' : '#1e293b' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.10)' : '#0f172a' }}
        >
          Créer mon media kit →
        </button>
      </div>
    </nav>
  )
}

export default Navbar
