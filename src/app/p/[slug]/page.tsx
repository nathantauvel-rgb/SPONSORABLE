'use client'

import { useEffect, useState } from 'react'

// Icônes sociales inline (Instagram, Twitter/X, Youtube supprimés de lucide-react v0.400+)
const IconYoutube = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white"/></svg>
const IconTwitterX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="#0f172a"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
const IconInstagram = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="#e1306c"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
const IconMail = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
import HeroOrbs from '@/components/hero/HeroOrbs'
import Button from '@/components/ui/button'
import Card from '@/components/ui/Card'
import {
  audienceAge,
  audienceCountries,
  audienceGender,
  creator,
  pastPartners,
  platforms,
} from '@/data/mockData'
import type { Platform } from '@/types'

const PlatformLogo = ({ id, color, size = 18 }: { id: string; color: string; size?: number }) => {
  if (id === 'youtube') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
      <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white"/>
    </svg>
  )
  if (id === 'twitch') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
  )
  if (id === 'tiktok') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
    </svg>
  )
  if (id === 'instagram') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
  return null
}

const HeroPlatformCard = ({ p }: { p: Platform }) => (
  <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', padding: '36px', borderTop: `4px solid ${p.color}`, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
      <PlatformLogo id={p.id} color={p.color} size={20} />
      <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>{p.name}</span>
      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '9999px', padding: '2px 8px' }}>via API</span>
    </div>
    <p style={{ fontSize: '64px', fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: '6px' }}>{p.mainStat.value}</p>
    <p style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 500, marginBottom: 'auto', paddingBottom: '28px' }}>{p.mainStat.label}</p>
    <div style={{ display: 'flex', gap: '20px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.06)', flexWrap: 'wrap' }}>
      {p.secondaryStats.map(s => (
        <div key={s.label}>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#16a34a', letterSpacing: '-0.02em' }}>{s.value}</p>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{s.label}</p>
        </div>
      ))}
    </div>
  </div>
)

const SecondaryPlatformCard = ({ p }: { p: Platform }) => (
  <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '14px', padding: '20px 24px', borderLeft: `3px solid ${p.color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
    <div style={{ flexShrink: 0 }}><PlatformLogo id={p.id} color={p.color} size={22} /></div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginBottom: '2px' }}>{p.name}</p>
      <p style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>{p.mainStat.value}</p>
      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{p.mainStat.label}</p>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
      {p.secondaryStats.map(s => (
        <div key={s.label} style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>{s.value}</p>
          <p style={{ fontSize: '11px', color: '#94a3b8' }}>{s.label}</p>
        </div>
      ))}
    </div>
  </div>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', marginBottom: '32px', letterSpacing: '-0.02em' }}>{children}</h2>
)

const AgeBar = ({ label, pct }: { label: string; pct: number }) => (
  <div style={{ marginBottom: '10px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>{pct}%</span>
    </div>
    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #4ade80, #16a34a)', borderRadius: '9999px' }} />
    </div>
  </div>
)

const loadConnectedPlatforms = (): string[] => {
  try {
    const saved = localStorage.getItem('sponsorable_connected_platforms')
    return saved ? JSON.parse(saved) : platforms.map(p => p.id)
  } catch { return platforms.map(p => p.id) }
}

const fmtNum = (n: string | number): string => {
  const num = typeof n === 'string' ? parseInt(n) : n
  if (isNaN(num)) return String(n)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (num >= 1_000) return num.toLocaleString('fr-FR')
  return String(num)
}

const loadYTPlatform = (): Platform | null => {
  try {
    const saved = localStorage.getItem('sponsorable_yt_data')
    if (!saved) return null
    const d = JSON.parse(saved)
    return { id: 'youtube', name: 'YouTube', color: '#ef4444', hero: true, mainStat: { value: fmtNum(d.subscriberCount), label: 'abonnés' }, secondaryStats: [{ value: fmtNum(d.viewCount), label: 'vues totales' }, { value: fmtNum(d.videoCount), label: 'vidéos publiées' }] }
  } catch { return null }
}

const loadFormats = (): string[] => {
  try {
    const saved = localStorage.getItem('sponsorable_formats')
    return saved ? JSON.parse(saved) : ['YouTube', 'Twitch', 'Réseaux sociaux', 'Ambassadeur']
  } catch { return ['YouTube', 'Twitch', 'Réseaux sociaux', 'Ambassadeur'] }
}

const loadShowPartnerships = (): boolean => {
  if (typeof window === 'undefined') return true
  const saved = localStorage.getItem('sponsorable_show_partnerships')
  return saved === null ? true : saved === 'true'
}

const loadPartnerships = () => {
  try {
    const saved = localStorage.getItem('sponsorable_partnerships')
    return saved ? JSON.parse(saved) : pastPartners
  } catch { return pastPartners }
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '6px' }
const inputStyle: React.CSSProperties = { width: '100%', background: 'white', border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'all 150ms ease' }
const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = '#16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.1)' }
const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = 'rgba(0,0,0,0.10)'; e.target.style.boxShadow = 'none' }

export default function PublicMediaKitPage() {
  const [form, setForm] = useState({ company: '', budget: '', type: '', message: '' })
  const [sent, setSent] = useState(false)
  const [collabFormats] = useState<string[]>(loadFormats)
  const [showPartnerships] = useState<boolean>(loadShowPartnerships)
  const [displayedPartnerships] = useState(loadPartnerships)
  const [connectedIds] = useState<string[]>(loadConnectedPlatforms)
  const [ytOverride] = useState<Platform | null>(loadYTPlatform)
  const [stickyVisible, setStickyVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 320)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSent(true) }

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      {/* HERO */}
      <section style={{ position: 'relative', paddingTop: '80px', paddingBottom: '64px', textAlign: 'center', overflow: 'hidden' }}>
        <HeroOrbs />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px' }}>
          <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'white', fontSize: '28px', fontWeight: 700, border: '3px solid #16a34a', boxShadow: '0 0 0 4px rgba(22,163,74,0.15)' }}>
            {creator.avatar_initials}
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.02em' }}>{creator.pseudo}</h1>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            {creator.niches.map(n => (
              <span key={n} style={{ background: 'rgba(134,239,172,0.2)', color: '#15803d', border: '1px solid rgba(134,239,172,0.4)', borderRadius: '9999px', padding: '5px 14px', fontSize: '13px', fontWeight: 500 }}>{n}</span>
            ))}
          </div>
          <p style={{ fontSize: '16px', color: '#475569', maxWidth: '480px', margin: '0 auto 28px', lineHeight: 1.7 }}>{creator.bio}</p>
          <Button variant="primary" arrow onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}>
            Proposer un partenariat
          </Button>
          <p style={{ marginTop: '16px', fontSize: '11px', color: '#94a3b8' }}>Propulsé par Sponsorable</p>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '64px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'block' }} />
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#16a34a', opacity: 0.4, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>Stats en direct</span>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Dernière synchronisation il y a 2h</span>
          </div>
          {(() => {
            const visible = platforms.filter(p => connectedIds.includes(p.id)).map(p => (p.id === 'youtube' && ytOverride ? ytOverride : p))
            const hero = visible.find(p => p.hero) ?? visible[0]
            if (!hero) return null
            const secondary = visible.filter(p => p.id !== hero.id)
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>
                <HeroPlatformCard p={hero} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                  {secondary.map(p => <SecondaryPlatformCard key={p.id} p={p} />)}
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* AUDIENCE */}
      <section style={{ padding: '80px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <SectionTitle>Audience</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <Card style={{ padding: '28px' }}>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '20px' }}>Répartition par âge</p>
              {audienceAge.map(a => <AgeBar key={a.label} label={a.label} pct={a.pct} />)}
            </Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Card style={{ padding: '28px' }}>
                <p style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '16px' }}>Genre</p>
                <div style={{ flex: 1, height: '10px', borderRadius: '9999px', overflow: 'hidden', background: '#bfdbfe' }}>
                  <div style={{ height: '100%', width: `${audienceGender.male}%`, background: 'linear-gradient(90deg, #4ade80, #16a34a)', borderRadius: '9999px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a' }}>♂ Hommes {audienceGender.male}%</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0284c7' }}>♀ Femmes {audienceGender.female}%</span>
                </div>
              </Card>
              <Card style={{ padding: '28px' }}>
                <p style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '16px' }}>Top pays</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {audienceCountries.map(c => (
                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>{c.flag}</span>
                      <span style={{ fontSize: '13px', color: '#475569', flex: 1, fontWeight: 500 }}>{c.name}</span>
                      <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>{c.pct}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* PARTENARIATS */}
      {showPartnerships && (
        <section style={{ padding: '0 24px 80px', background: '#ffffff' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <SectionTitle>Partenariats précédents</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {displayedPartnerships.map((p: typeof pastPartners[0], i: number) => (
                <Card key={i} style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{p.name}</p>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{p.category}</p>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0, marginLeft: '8px' }}>{p.date}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #16a34a' }}>{p.result}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONTACT */}
      <section id="contact-form" style={{ padding: '0 24px 96px', background: '#ffffff' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          {collabFormats.length > 0 && (
            <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {collabFormats.map(f => (
                <span key={f} style={{ background: 'rgba(134,239,172,0.15)', color: '#15803d', border: '1px solid rgba(134,239,172,0.4)', borderRadius: '9999px', padding: '5px 16px', fontSize: '13px', fontWeight: 500 }}>{f}</span>
              ))}
            </div>
          )}
          <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '48px', border: '1px solid rgba(0,0,0,0.06)' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(134,239,172,0.2)', border: '2px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px' }}>✓</div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>Proposition envoyée !</h2>
                <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6 }}>{creator.pseudo} traite les demandes sous 48h. Vous recevrez une réponse par email.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.02em' }}>Proposer un partenariat</h2>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '28px' }}>Réponse sous 48h · Traité personnellement par {creator.pseudo}</p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Entreprise / marque</label>
                    <input required placeholder="NordVPN, Corsair..." value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Budget estimé</label>
                    <select required value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                      <option value="">Sélectionner...</option>
                      <option>Moins de 300€</option>
                      <option>300€ – 800€</option>
                      <option>800€ – 2 000€</option>
                      <option>2 000€ – 5 000€</option>
                      <option>5 000€+</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Type de collaboration</label>
                    <select required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                      <option value="">Sélectionner...</option>
                      <option>Intégration vidéo YouTube</option>
                      <option>Sponsoring stream Twitch</option>
                      <option>Pack réseaux sociaux</option>
                      <option>Ambassadeur longue durée</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Message</label>
                    <textarea required rows={4} placeholder={`Bonjour ${creator.pseudo}, je représente...`} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} onFocus={focusStyle} onBlur={blurStyle} />
                  </div>
                  <Button type="submit" variant="primary" fullWidth arrow>Envoyer la proposition</Button>
                </form>
              </>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '28px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              {[IconYoutube, IconTwitterX, IconInstagram, IconMail].map((Icon, i) => (
                <a key={i} href="#" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', transition: 'all 150ms ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.16)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <Icon />
                </a>
              ))}
              <a href="#" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', transition: 'all 150ms ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.16)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#9146ff"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY CTA */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50, transition: 'opacity 250ms ease, transform 250ms ease', opacity: stickyVisible ? 1 : 0, transform: stickyVisible ? 'translateY(0)' : 'translateY(12px)', pointerEvents: stickyVisible ? 'auto' : 'none' }}>
        <button
          onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '9999px', padding: '14px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(22,163,74,0.35)', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#15803d' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#16a34a' }}
        >
          Proposer un partenariat →
        </button>
      </div>

      <footer style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        Media kit généré par <span style={{ color: '#16a34a', fontWeight: 600 }}>Sponsorable</span>
      </footer>
    </div>
  )
}
