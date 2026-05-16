'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, FileText, LayoutDashboard, LogOut, Settings, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import Avatar from '../ui/Avatar'

const loadPlan = () => { try { return localStorage.getItem('sponsorable_plan') || 'free' } catch { return 'free' } }

const loadProfile = () => {
  try {
    const saved = localStorage.getItem('sponsorable_profile')
    if (!saved) return { pseudo: 'AlexPlays', email: 'alex@alexplays.fr' }
    const p = JSON.parse(saved)
    return { pseudo: p.pseudo || 'AlexPlays', email: p.email || 'alex@alexplays.fr' }
  } catch {
    return { pseudo: 'AlexPlays', email: 'alex@alexplays.fr' }
  }
}

const navItems = [
  { label: 'Tableau de bord', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Mon media kit', icon: FileText, to: '/dashboard/mediakit' },
  { label: 'Statistiques', icon: BarChart2, to: '/dashboard/stats' },
  { label: 'Paramètres', icon: Settings, to: '/dashboard/settings' },
]

const Sidebar = () => {
  const pathname = usePathname()
  const [profile, setProfile] = useState(loadProfile)
  const [plan, setPlan] = useState(loadPlan)

  useEffect(() => {
    const onStorage = () => setProfile(loadProfile())
    window.addEventListener('storage', onStorage)
    const interval = setInterval(() => {
      setProfile(loadProfile())
      setPlan(loadPlan())
    }, 500)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(interval)
    }
  }, [])

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
              {item.label}
            </Link>
          )
        })}
      </nav>

      {plan !== 'pro' && (
        <div style={{ padding: '0 12px 12px' }}>
          <Link
            href="/dashboard/settings#plan"
            style={{
              display: 'block', textDecoration: 'none',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: '12px', padding: '14px',
              transition: 'opacity 150ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={12} color="#4ade80" />
              </div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Passer au Pro</p>
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: '10px' }}>
              Templates, stats, Calendly, PDF…
            </p>
            <div style={{ background: '#16a34a', borderRadius: '7px', padding: '7px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>19€/mois →</span>
            </div>
          </Link>
        </div>
      )}

      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Avatar initials={profile.pseudo.slice(0, 2).toUpperCase()} size={32} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
              {profile.pseudo}
            </p>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>{profile.email}</p>
          </div>
        </div>
        <button
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
