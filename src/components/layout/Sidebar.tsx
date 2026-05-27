'use client'

import { BarChart2, FileText, LayoutDashboard, LogOut, Mail, Settings, Star, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'

const navItems = [
  { label: 'Tableau de bord', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Mon media kit', icon: FileText, to: '/dashboard/mediakit' },
  { label: 'Statistiques', icon: BarChart2, to: '/dashboard/stats' },
  { label: 'Messages', icon: Mail, to: '/dashboard/messages' },
  { label: 'Sponsors', icon: Star, to: '/dashboard/sponsors' },
  { label: 'Paramètres', icon: Settings, to: '/dashboard/settings' },
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
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#16a34a',
        color: 'white',
        fontSize: size * 0.38,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  )
}

const Sidebar = () => {
  const pathname = usePathname()
  const [isPro, setIsPro] = useState(false)
  const [platformImage, setPlatformImage] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const { data: session } = useSession()

  useEffect(() => {
    try {
      // Lire depuis localStorage d'abord (optimistic), puis la DB confirme
      setIsPro(localStorage.getItem('sponsorable_plan') === 'pro')

      // Priorité : YouTube > Twitch > photo du compte
      const ytRaw = localStorage.getItem('sponsorable_yt_data')
      const twitchRaw = localStorage.getItem('sponsorable_twitch_data')
      const ytThumb = ytRaw ? (JSON.parse(ytRaw) as { thumbnail?: string })?.thumbnail : null
      const twitchAvatar = twitchRaw ? (JSON.parse(twitchRaw) as { profileImageUrl?: string })?.profileImageUrl : null
      setPlatformImage(ytThumb ?? twitchAvatar ?? null)
    } catch {}
  }, [])

  // Sync isPro depuis la DB
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

  return (
    <aside
      style={{
        width: '240px',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        background: '#ffffff',
        borderRight: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
      }}
    >
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <span style={{ fontWeight: 700, fontSize: '18px', color: '#16a34a', letterSpacing: '-0.01em' }}>
          Sponsorable
        </span>
      </div>

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
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '2px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 150ms ease',
                background: active ? 'rgba(22,163,74,0.08)' : 'transparent',
                color: active ? '#16a34a' : '#475569',
                borderLeft: active ? '3px solid #16a34a' : '3px solid transparent',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = '#f8fafc'
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {isMessages && unreadCount > 0 && (
                <span style={{
                  background: '#16a34a', color: 'white',
                  fontSize: '10px', fontWeight: 700,
                  borderRadius: '9999px', padding: '1px 6px',
                  lineHeight: '16px', minWidth: '16px', textAlign: 'center',
                }}>
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        {!isPro && (
          <Link
            href="/dashboard/settings#plan"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              marginBottom: '12px', padding: '9px 12px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: 'white', fontSize: '13px', fontWeight: 700,
              textDecoration: 'none', transition: 'opacity 150ms',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            <Zap size={13} />
            Passer au Pro
          </Link>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Avatar name={userName} image={userImage} size={32} />
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName ?? '—'}
            </p>
            <p style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userEmail ?? ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#ef4444',
            fontSize: '13px',
            fontWeight: 500,
            padding: '4px 0',
          }}
        >
          <LogOut size={13} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
