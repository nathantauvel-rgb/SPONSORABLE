'use client'

import { BarChart2, FileText, LayoutDashboard, LogOut, Mail, Menu, Moon, Settings, Star, Sun, X, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { SYNE } from '@/lib/ds'
import { useIsMobile } from '@/hooks/useIsMobile'
import Logo from '@/components/ui/Logo'

/** Hauteur de la barre supérieure mobile — exportée pour le padding des pages. */
export const MOBILE_TOPBAR_H = 56

// Tokens via variables CSS (toggle dark/light global — cf. globals.css).
const V = {
  bg: 'var(--ds-bg)', sidebar: 'var(--ds-sidebar)', border: 'var(--ds-border)',
  text: 'var(--ds-text)', muted: 'var(--ds-muted)', accent: 'var(--ds-accent)',
  hover: 'var(--ds-hover)', activeBg: 'var(--ds-active-bg)', activeText: 'var(--ds-active-text)',
  avatarBg: 'var(--ds-avatar-bg)', avatarText: 'var(--ds-avatar-text)',
}

const navItems = [
  { label: 'Tableau de bord', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Mon media kit',   icon: FileText,         to: '/dashboard/mediakit' },
  { label: 'Statistiques',    icon: BarChart2,        to: '/dashboard/stats' },
  { label: 'Messages',        icon: Mail,             to: '/dashboard/messages' },
  { label: 'Sponsors',        icon: Star,             to: '/dashboard/sponsors' },
  { label: 'Paramètres',      icon: Settings,         to: '/dashboard/settings' },
]

const getInitials = (name: string | null | undefined) => {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const Avatar = ({ name, image, size }: { name: string | null | undefined; image: string | null | undefined; size: number }) => {
  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? 'avatar'}
        width={size}
        height={size}
        style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: V.avatarBg, color: V.avatarText,
      fontSize: size * 0.38, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  )
}

const Sidebar = () => {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [platformImage, setPlatformImage] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const { data: session } = useSession()

  // Ferme le menu mobile à chaque changement de page.
  useEffect(() => { setOpen(false) }, [pathname])

  // Thème dashboard : lit la préférence stockée et l'applique sur <html>.
  useEffect(() => {
    let stored: 'dark' | 'light' = 'dark'
    try { if (localStorage.getItem('sponsorable_theme') === 'light') stored = 'light' } catch {}
    setTheme(stored)
    document.documentElement.setAttribute('data-dash-theme', stored)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try { localStorage.setItem('sponsorable_theme', next) } catch {}
    document.documentElement.setAttribute('data-dash-theme', next)
  }

  useEffect(() => {
    try {
      setIsPro(localStorage.getItem('sponsorable_plan') === 'pro')
      const ytRaw = localStorage.getItem('sponsorable_yt_data')
      const twitchRaw = localStorage.getItem('sponsorable_twitch_data')
      const ytThumb = ytRaw ? (JSON.parse(ytRaw) as { thumbnail?: string })?.thumbnail : null
      const twitchAvatar = twitchRaw ? (JSON.parse(twitchRaw) as { profileImageUrl?: string })?.profileImageUrl : null
      setPlatformImage(ytThumb ?? twitchAvatar ?? null)
    } catch {}
  }, [])

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const pro = !!data.isPro
          setIsPro(pro)
          try { localStorage.setItem('sponsorable_plan', pro ? 'pro' : 'free') } catch {}
        }
      })
      .catch(() => {})
  }, [session?.user])

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/messages')
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(data => {
        const msgs = (data.messages ?? []) as { read: boolean }[]
        setUnreadCount(msgs.filter(m => !m.read).length)
      })
      .catch(() => {})
  }, [session?.user])

  const userName = session?.user?.name
  const userEmail = session?.user?.email
  const userImage = platformImage ?? session?.user?.image

  const asideStyle: React.CSSProperties = isMobile
    ? {
        width: '260px', position: 'fixed', top: 0, left: 0, bottom: 0,
        background: V.sidebar, borderRight: `1px solid ${V.border}`,
        display: 'flex', flexDirection: 'column', zIndex: 60,
        transform: open ? 'translateX(0)' : 'translateX(-110%)',
        transition: 'transform 220ms ease',
        boxShadow: open ? '0 0 40px rgba(0,0,0,0.5)' : 'none',
      }
    : {
        width: '240px', position: 'fixed', top: 0, left: 0, bottom: 0,
        background: V.sidebar, borderRight: `1px solid ${V.border}`,
        display: 'flex', flexDirection: 'column', zIndex: 40,
      }

  return (
    <>
      {/* Barre supérieure mobile (logo + hamburger) */}
      {isMobile && (
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: MOBILE_TOPBAR_H,
          background: V.sidebar, borderBottom: `1px solid ${V.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', zIndex: 50,
        }}>
          <Logo color={V.text} size={18} />
          <button
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            style={{ background: 'none', border: 'none', color: V.text, cursor: 'pointer', padding: '6px', display: 'flex', position: 'relative' }}
          >
            <Menu size={24} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: V.accent }} />
            )}
          </button>
        </header>
      )}

      {/* Overlay sombre derrière le drawer */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 55 }}
        />
      )}

      <aside style={asideStyle}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo color={V.text} size={18} />
        {isMobile && (
          <button onClick={() => setOpen(false)} aria-label="Fermer le menu" style={{ background: 'none', border: 'none', color: V.muted, cursor: 'pointer', padding: '4px', display: 'flex' }}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {navItems.map(item => {
          const active = pathname === item.to
          const Icon = item.icon
          const isMessages = item.to === '/dashboard/messages'
          return (
            <Link
              key={item.to}
              href={item.to}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', marginBottom: '2px',
                textDecoration: 'none', fontFamily: SYNE, fontSize: '14px', fontWeight: 500,
                transition: 'all 150ms ease',
                background: active ? V.activeBg : 'transparent',
                color: active ? V.activeText : V.muted,
              }}
              onMouseEnter={e => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = V.hover
                  el.style.color = V.text
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'transparent'
                  el.style.color = V.muted
                }
              }}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {isMessages && unreadCount > 0 && (
                <span style={{
                  background: V.accent, color: V.avatarText,
                  fontSize: '10px', fontWeight: 700,
                  borderRadius: '9999px', padding: '1px 6px',
                  lineHeight: '16px', minWidth: '16px', textAlign: 'center',
                  fontFamily: SYNE,
                }}>
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 12px', borderTop: `1px solid ${V.border}` }}>
        {/* Toggle thème clair / sombre */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
            padding: '8px 12px', borderRadius: '8px', marginBottom: '10px',
            background: 'transparent', border: `1px solid ${V.border}`, cursor: 'pointer',
            color: V.muted, fontFamily: SYNE, fontSize: '13px', fontWeight: 500,
            transition: 'all 150ms ease',
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = V.hover; el.style.color = V.text }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = V.muted }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span style={{ flex: 1, textAlign: 'left' }}>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
        </button>

        {!isPro && (
          <Link
            href="/dashboard/settings#plan"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              marginBottom: '12px', padding: '9px 12px', borderRadius: '8px',
              background: V.accent, color: '#ffffff',
              fontFamily: SYNE, fontSize: '13px', fontWeight: 700,
              textDecoration: 'none', transition: 'opacity 150ms',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.88')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            <Zap size={13} />
            Passer au Pro
          </Link>
        )}

        {/* Profil utilisateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Avatar name={userName} image={userImage} size={32} />
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ fontFamily: SYNE, fontSize: '13px', fontWeight: 600, color: V.text, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName ?? 'Utilisateur'}
            </p>
            <p style={{ fontFamily: SYNE, fontSize: '11px', color: V.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userEmail ?? ''}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ef4444', fontFamily: SYNE, fontSize: '13px', fontWeight: 500, padding: '4px 0',
            transition: 'color 150ms',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#fca5a5')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
        >
          <LogOut size={13} />
          Déconnexion
        </button>
      </div>
    </aside>
    </>
  )
}

export default Sidebar
