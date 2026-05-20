'use client'

import { Instagram, Mail, Twitter, Youtube } from 'lucide-react'
import Flag from '@/components/ui/Flag'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  audienceAge,
  audienceCountries,
  audienceGender,
  creator,
  exampleCreators,
  pastPartners,
  platforms,
} from '@/data/mockData'
import type { Platform } from '@/types'
import { safeUrl, safeCalendlyUrl } from '@/lib/safeUrl'

/* ── Template theme loader ───────────────────────────────── */

const DEFAULT_THEME = {
  bg: '#ffffff', cardBg: 'white', border: 'rgba(0,0,0,0.08)',
  accent: '#16a34a', text: '#0f172a', subtext: '#475569',
  statBg: 'white', statBorder: 'rgba(0,0,0,0.08)',
  boxShadow: 'none', avatarGlow: 'none', liveIndicator: true, styleLabel: '',
}

const loadTemplateTheme = () => {
  try {
    const plan = localStorage.getItem('sponsorable_plan')
    if (plan !== 'pro') return DEFAULT_THEME
    const id = localStorage.getItem('sponsorable_template')
    if (!id) return DEFAULT_THEME
    const found = exampleCreators.find(c => c.id === id)
    return found?.theme ?? DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

/* ── Platform logo ───────────────────────────────────────── */

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

/* ── Small sub-components (theme-aware via props) ─────────── */

const SectionTitle = ({ children, color = '#0f172a' }: { children: React.ReactNode; color?: string }) => (
  <h2
    style={{
      fontSize: '26px',
      fontWeight: 700,
      color,
      marginBottom: '32px',
      letterSpacing: '-0.02em',
    }}
  >
    {children}
  </h2>
)

const AgeBar = ({ label, pct, accent = '#16a34a', subtext = '#475569' }: { label: string; pct: number; accent?: string; subtext?: string }) => (
  <div style={{ marginBottom: '10px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontSize: '13px', color: subtext, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '13px', color: accent, fontWeight: 600 }}>{pct}%</span>
    </div>
    <div
      style={{
        height: '6px',
        background: 'rgba(128,128,128,0.15)',
        borderRadius: '9999px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: accent,
          borderRadius: '9999px',
          transition: 'width 600ms ease',
        }}
      />
    </div>
  </div>
)

const timeSince = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  return `il y a ${Math.floor(mins / 60)}h`
}

/* ── Loader helpers ──────────────────────────────────────── */

const loadConnectedPlatforms = (): string[] => {
  try {
    const saved = localStorage.getItem('sponsorable_connected_platforms')
    return saved ? JSON.parse(saved) : platforms.map(p => p.id)
  } catch {
    return platforms.map(p => p.id)
  }
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
    return {
      id: 'youtube',
      name: 'YouTube',
      color: '#ef4444',
      hero: true,
      mainStat: { value: fmtNum(d.subscriberCount), label: 'abonnés' },
      secondaryStats: [
        { value: fmtNum(d.viewCount), label: 'vues totales' },
        { value: fmtNum(d.videoCount), label: 'vidéos publiées' },
      ],
    }
  } catch {
    return null
  }
}

const loadFormats = (): string[] => {
  try {
    const saved = localStorage.getItem('sponsorable_formats')
    return saved ? JSON.parse(saved) : ['YouTube', 'Twitch', 'Réseaux sociaux', 'Ambassadeur']
  } catch {
    return ['YouTube', 'Twitch', 'Réseaux sociaux', 'Ambassadeur']
  }
}

const loadShowPartnerships = (): boolean => {
  const saved = localStorage.getItem('sponsorable_show_partnerships')
  return saved === null ? true : saved === 'true'
}

const loadPartnerships = () => {
  try {
    const saved = localStorage.getItem('sponsorable_partnerships')
    return saved ? JSON.parse(saved) : pastPartners
  } catch {
    return pastPartners
  }
}

const loadBanner = (): string => {
  try {
    if (localStorage.getItem('sponsorable_plan') !== 'pro') return ''
    const saved = localStorage.getItem('sponsorable_banner')
    return saved ? JSON.parse(saved) : ''
  } catch { return '' }
}

const loadCalendly = (): string => {
  try {
    if (localStorage.getItem('sponsorable_plan') !== 'pro') return ''
    const saved = localStorage.getItem('sponsorable_calendly')
    return saved ? JSON.parse(saved) : ''
  } catch { return '' }
}

const loadProfile = () => {
  try {
    const saved = localStorage.getItem('sponsorable_profile')
    if (!saved) return null
    return JSON.parse(saved)
  } catch { return null }
}

/* ── Main page ───────────────────────────────────────────── */

const PublicMediaKitPage = () => {
  const params = useParams()
  const slug = typeof params?.pseudo === 'string' ? params.pseudo : ''

  const [remoteData, setRemoteData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/public/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRemoteData(data) })
      .catch(() => {})
  }, [slug])

  useEffect(() => {
    const isPrint = new URLSearchParams(window.location.search).get('print') === '1'
    if (!isPrint) return
    const t = setTimeout(() => window.print(), 800)
    return () => clearTimeout(t)
  }, [])

  const resolvedTheme = (() => {
    if (remoteData?.theme && typeof remoteData.theme === 'string') {
      const found = exampleCreators.find(c => c.id === remoteData.theme)
      if (found) return found.theme
    }
    return loadTemplateTheme()
  })()

  const theme = resolvedTheme

  // Derived theme helpers
  const isForest = theme.bg === '#eae5d8'
  const isMono   = theme.bg === '#111111'
  const isDark   = !isForest && theme.bg !== '#ffffff' && theme.bg !== '#fff'
  const btnTextColor = theme.accent === '#ffffff' ? theme.bg : '#ffffff'
  const mutedText = isDark ? theme.subtext : (isForest ? theme.subtext : '#94a3b8')
  const femaleColor =
    isForest ? '#b45309'
    : isMono ? '#525252'
    : isDark ? '#38bdf8'
    : '#0284c7'
  const femaleBarBg =
    isForest ? 'rgba(180,83,9,0.18)'
    : isMono ? 'rgba(255,255,255,0.08)'
    : isDark ? 'rgba(56,189,248,0.20)'
    : '#bfdbfe'

  const savedProfile = useState(() => loadProfile())[0]
  const remoteProfile = remoteData ? {
    pseudo: remoteData.displayName ?? undefined,
    niche: remoteData.niche ?? undefined,
    bio: remoteData.bio ?? undefined,
  } : null
  const effectiveProfile = remoteProfile ?? savedProfile
  const displayCreator = {
    ...creator,
    ...(effectiveProfile || {}),
    avatar_initials: effectiveProfile?.pseudo
      ? String(effectiveProfile.pseudo).slice(0, 2).toUpperCase()
      : creator.avatar_initials,
    niches: effectiveProfile?.niche
      ? String(effectiveProfile.niche).split(' · ').map((s: string) => s.trim())
      : creator.niches,
  }

  const [form, setForm] = useState({
    company: '',
    budget: '',
    type: '',
    message: '',
  })
  const [sent, setSent] = useState(false)
  const localFormats = useState<string[]>(loadFormats)[0]
  const localShowPartnerships = useState<boolean>(loadShowPartnerships)[0]
  const localPartnerships = useState(loadPartnerships)[0]
  const localConnectedIds = useState<string[]>(loadConnectedPlatforms)[0]
  const localBannerUrl = useState<string>(loadBanner)[0]
  const localCalendlyUrl = useState<string>(loadCalendly)[0]
  const localYtOverride = useState<Platform | null>(loadYTPlatform)[0]

  const effectiveFormats = remoteData?.formats ? remoteData.formats as string[] : localFormats
  const effectiveShowPartnerships = remoteData != null ? Boolean(remoteData.showPartnerships) : localShowPartnerships
  const effectivePartnerships = remoteData?.partnerships ? remoteData.partnerships as typeof localPartnerships : localPartnerships
  const effectiveBannerUrl = remoteData?.bannerUrl ? String(remoteData.bannerUrl) : localBannerUrl
  const effectiveCalendlyUrl = remoteData?.calendlyUrl ? String(remoteData.calendlyUrl) : localCalendlyUrl

  const remoteYt = remoteData?.platforms
    ? (remoteData.platforms as Array<{ type: string; stats: Record<string, unknown> | null; lastFetched: string | null }>).find(p => p.type === 'youtube')
    : null
  const ytStats = remoteYt?.stats ?? null
  const ytAnalytics = ytStats?.analytics as Record<string, unknown> | undefined
  const ytRecentVideos = ytStats?.recentVideos as Array<{ id: string; title: string; publishedAt: string; thumbnail: string | null; viewCount: string; likeCount: string; commentCount: string }> | undefined

  const effectiveYtOverride: Platform | null = ytStats ? {
    id: 'youtube',
    name: 'YouTube',
    color: '#ef4444',
    hero: true,
    mainStat: { value: fmtNum(String(ytStats.subscriberCount ?? '0')), label: 'abonnés' },
    secondaryStats: [
      { value: fmtNum(String(ytStats.viewCount ?? '0')), label: 'vues totales' },
      { value: fmtNum(String(ytStats.videoCount ?? '0')), label: 'vidéos publiées' },
    ],
  } : localYtOverride

  const effectiveLastFetched = remoteYt?.lastFetched ?? null

  const remoteTwitch = remoteData?.platforms
    ? (remoteData.platforms as Array<{ type: string; stats: Record<string, unknown> | null; lastFetched: string | null }>).find(p => p.type === 'twitch')
    : null
  const twitchStats = remoteTwitch?.stats ?? null
  const twitchSecondaryStats: { value: string; label: string }[] = []
  if (twitchStats) {
    twitchSecondaryStats.push({ value: fmtNum(Number(twitchStats.viewCount ?? 0)), label: 'vues canal' })
    if (twitchStats.subscriptionCount != null) {
      twitchSecondaryStats.push({ value: fmtNum(Number(twitchStats.subscriptionCount)), label: 'abonnés payants' })
    }
  }
  const effectiveTwitchOverride: Platform | null = twitchStats ? {
    id: 'twitch',
    name: 'Twitch',
    color: '#9146ff',
    hero: false,
    mainStat: { value: fmtNum(Number(twitchStats.followerCount ?? 0)), label: 'followers' },
    secondaryStats: twitchSecondaryStats,
  } : null

  const collabFormats = effectiveFormats
  const showPartnerships = effectiveShowPartnerships
  const displayedPartnerships = effectivePartnerships
  const connectedIds = remoteData?.platforms
    ? (remoteData.platforms as Array<{ type: string }>).map(p => p.type)
    : localConnectedIds
  const bannerUrl = effectiveBannerUrl
  const calendlyUrl = effectiveCalendlyUrl
  const ytOverride = effectiveYtOverride
  const [stickyVisible, setStickyVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 320)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: theme.subtext,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: '6px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: isDark ? 'rgba(255,255,255,0.06)' : 'white',
    border: `1.5px solid ${theme.border}`,
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '14px',
    color: theme.text,
    outline: 'none',
    transition: 'all 150ms ease',
  }

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = theme.accent
    e.target.style.boxShadow = `0 0 0 3px ${theme.accent}20`
  }

  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = theme.border
    e.target.style.boxShadow = 'none'
  }

  return (
    <div style={{ background: theme.bg, minHeight: '100vh' }}>
      <style>{`
        @media print {
          @page { margin: 10mm 10mm; size: A4; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            max-width: none !important;
            box-sizing: border-box !important;
          }
          #sticky-cta { display: none !important; }
          #contact-form { display: none !important; }
          footer[role="contentinfo"] { display: none !important; }
          .pdf-export-date { display: block !important; text-align: right; font-size: 10px; color: #cbd5e1; padding: 8px 0 0; border-top: 1px solid #e2e8f0; margin-top: 8px; }
        }
        .pdf-export-date { display: none; }
      `}</style>

      {/* ── BANNIÈRE ──────────────────────────────────────── */}
      {safeUrl(bannerUrl) && (
        <div style={{ width: '100%', aspectRatio: '1546 / 423', overflow: 'hidden', maxHeight: '420px' }}>
          <img src={safeUrl(bannerUrl)} alt="Bannière" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────── */}
      {isForest ? (
        /* ── FOREST / ARCANA HERO ──────────────────────── */
        <section style={{ position: 'relative', overflow: 'hidden', padding: '0' }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '55%', height: '70%', borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%', background: 'radial-gradient(ellipse, rgba(122,156,60,0.22) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '50%', height: '60%', borderRadius: '40% 60% 30% 70% / 60% 40% 60% 40%', background: 'radial-gradient(ellipse, rgba(90,120,40,0.16) 0%, transparent 70%)', filter: 'blur(50px)' }} />
            <div style={{ position: 'absolute', bottom: '-5%', left: '30%', width: '45%', height: '50%', borderRadius: '50% 50% 30% 70% / 40% 60% 40% 60%', background: 'radial-gradient(ellipse, rgba(160,190,80,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', padding: '80px 40px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '56px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.subtext }}>Media Kit</span>
              <span style={{ fontSize: '11px', color: theme.subtext, letterSpacing: '0.06em' }}>sponsorable.gg</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '48px', alignItems: 'end', marginBottom: '48px' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {displayCreator.niches.map((n: string) => (
                    <span key={n} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: theme.accent, background: `${theme.accent}18`, border: `1px solid ${theme.accent}35`, borderRadius: '4px', padding: '3px 10px' }}>{n}</span>
                  ))}
                </div>
                <h1 style={{ fontSize: 'clamp(42px, 7vw, 72px)', fontWeight: 800, color: theme.text, lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: '24px' }}>
                  {displayCreator.pseudo}
                </h1>
                <p style={{ fontSize: '16px', color: theme.subtext, lineHeight: 1.75, maxWidth: '480px', borderLeft: `3px solid ${theme.accent}`, paddingLeft: '16px' }}>
                  {displayCreator.bio}
                </p>
              </div>
              <div style={{ width: '110px', height: '130px', borderRadius: '12px', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', flexShrink: 0, boxShadow: `0 8px 32px ${theme.accent}40` }}>
                {displayCreator.avatar_initials}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '14px 28px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em', cursor: 'pointer', transition: 'opacity 150ms ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                Proposer un partenariat →
              </button>
              {safeCalendlyUrl(calendlyUrl) && (
                <a
                  href={safeCalendlyUrl(calendlyUrl)} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'transparent', color: theme.accent, border: `2px solid ${theme.accent}`, borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em', cursor: 'pointer', textDecoration: 'none', transition: 'all 150ms ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${theme.accent}12` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  📅 Réserver un appel
                </a>
              )}
            </div>
            <p style={{ marginTop: '14px', fontSize: '11px', color: mutedText }}>
              Propulsé par <span style={{ color: '#16a34a', fontWeight: 600 }}>Sponsorable</span>
            </p>
          </div>
        </section>
      ) : isMono ? (
        /* ── MONO / SOLENNE CAPITAL HERO ───────────────── */
        <section style={{ position: 'relative', overflow: 'hidden', background: '#0c0c0c' }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 70% 40%, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: '10%', right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', padding: '72px 40px 56px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '64px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '18px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Media Kit</span>
              <span style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>sponsorable.gg</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '40px', alignItems: 'start', marginBottom: '52px' }}>
              <div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
                  {displayCreator.niches.map((n: string) => (
                    <span key={n} style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '3px', padding: '3px 10px' }}>{n}</span>
                  ))}
                </div>
                <h1 style={{ fontSize: 'clamp(44px, 7vw, 76px)', fontWeight: 800, color: '#ffffff', lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: '28px' }}>
                  {displayCreator.pseudo}
                </h1>
                <div style={{ width: '40px', height: '2px', background: 'rgba(255,255,255,0.25)', marginBottom: '20px' }} />
                <p style={{ fontSize: '15px', color: '#858685', lineHeight: 1.70, maxWidth: '420px' }}>
                  {displayCreator.bio}
                </p>
              </div>
              <div style={{ width: '120px', height: '140px', borderRadius: '6px', background: 'linear-gradient(145deg, #2a2a2a, #111)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', flexShrink: 0 }}>
                {displayCreator.avatar_initials}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#ffffff', color: '#0c0c0c', border: 'none', borderRadius: '4px', padding: '14px 28px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', transition: 'opacity 150ms ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                Proposer un partenariat →
              </button>
              {safeCalendlyUrl(calendlyUrl) && (
                <a
                  href={safeCalendlyUrl(calendlyUrl)} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'transparent', color: '#ffffff', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '4px', padding: '12px 24px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none', transition: 'all 150ms ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.7)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)' }}
                >
                  📅 Réserver un appel
                </a>
              )}
            </div>
            <p style={{ marginTop: '14px', fontSize: '11px', color: 'rgba(255,255,255,0.20)' }}>
              Propulsé par <span style={{ color: '#16a34a', fontWeight: 600 }}>Sponsorable</span>
            </p>
          </div>
        </section>
      ) : (
        /* ── DEFAULT / ESPORT HERO ── */
        <section style={{ position: 'relative', paddingTop: '80px', paddingBottom: '64px', textAlign: 'center', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '-20%', left: '-5%', width: '65%', height: '90%', borderRadius: '60% 40% 55% 45% / 50% 65% 35% 50%', background: `radial-gradient(ellipse, ${isDark ? theme.accent + '55' : theme.accent + '35'} 0%, transparent 65%)`, filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', top: '5%', right: '-10%', width: '60%', height: '80%', borderRadius: '40% 60% 45% 55% / 60% 40% 60% 40%', background: `radial-gradient(ellipse, ${isDark ? theme.accent + '42' : theme.accent + '28'} 0%, transparent 65%)`, filter: 'blur(50px)' }} />
            <div style={{ position: 'absolute', bottom: '-15%', left: '15%', width: '65%', height: '65%', borderRadius: '50% 50% 35% 65% / 40% 60% 40% 60%', background: `radial-gradient(ellipse, ${isDark ? theme.accent + '38' : theme.accent + '22'} 0%, transparent 70%)`, filter: 'blur(55px)' }} />
            <div style={{ position: 'absolute', top: '30%', left: '30%', width: '45%', height: '55%', borderRadius: '55% 45% 60% 40% / 50% 50% 50% 50%', background: `radial-gradient(ellipse, ${isDark ? theme.accent + '28' : theme.accent + '18'} 0%, transparent 60%)`, filter: 'blur(35px)' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 1, padding: '0 24px' }}>
            <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: btnTextColor, fontSize: '28px', fontWeight: 700, boxShadow: `0 0 0 4px ${theme.accent}26` }}>
              {displayCreator.avatar_initials}
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: theme.text, marginBottom: '12px', letterSpacing: '-0.02em' }}>
              {displayCreator.pseudo}
            </h1>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
              {displayCreator.niches.map((n: string) => (
                <span key={n} style={{ background: `${theme.accent}30`, color: isDark ? theme.accent : theme.accent, border: `1px solid ${theme.accent}50`, borderRadius: '9999px', padding: '5px 14px', fontSize: '13px', fontWeight: 500 }}>
                  {n}
                </span>
              ))}
            </div>
            <p style={{ fontSize: '16px', color: theme.subtext, maxWidth: '480px', margin: '0 auto 28px', lineHeight: 1.7 }}>
              {displayCreator.bio}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: theme.accent, color: btnTextColor, border: 'none', borderRadius: '9999px', padding: '14px 28px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 150ms ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                Proposer un partenariat →
              </button>
              {safeCalendlyUrl(calendlyUrl) && (
                <a
                  href={safeCalendlyUrl(calendlyUrl)} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'transparent', color: theme.accent, border: `2px solid ${theme.accent}60`, borderRadius: '9999px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', transition: 'all 150ms ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${theme.accent}12` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  📅 Réserver un appel
                </a>
              )}
            </div>
            <p style={{ marginTop: '16px', fontSize: '11px', color: mutedText }}>
              Propulsé par <span style={{ color: '#16a34a', fontWeight: 600 }}>Sponsorable</span>
            </p>
          </div>
        </section>
      )}

      {/* ── STATS ─────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px', background: theme.bg }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {(() => {
            const realPlatforms: Platform[] = []
            if (effectiveYtOverride) realPlatforms.push({ ...effectiveYtOverride, hero: true })
            if (effectiveTwitchOverride) realPlatforms.push({ ...effectiveTwitchOverride, hero: realPlatforms.length === 0 })
            if (realPlatforms.length === 0) return null

            const lastSync = effectiveLastFetched ?? remoteTwitch?.lastFetched ?? null

            const hero = realPlatforms[0]
            const secondary = realPlatforms.slice(1)

            return (<>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.accent, display: 'block' }} />
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: theme.accent, opacity: 0.4, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: theme.accent }}>Stats en direct</span>
            </div>
            {lastSync && <span style={{ fontSize: '12px', color: mutedText }}>Dernière synchronisation {timeSince(lastSync)}</span>}
          </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>
                <div style={{
                  background: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '16px',
                  padding: '36px',
                  borderTop: `4px solid ${hero.color}`,
                  boxShadow: theme.boxShadow !== 'none' ? theme.boxShadow : '0 4px 24px rgba(0,0,0,0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
                    <PlatformLogo id={hero.id} color={hero.color} size={20} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: theme.subtext }}>{hero.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: mutedText, background: theme.statBg, border: `1px solid ${theme.border}`, borderRadius: '9999px', padding: '2px 8px' }}>via API</span>
                  </div>
                  <p style={{ fontSize: '64px', fontWeight: 800, color: theme.text, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: '6px' }}>
                    {hero.mainStat.value}
                  </p>
                  <p style={{ fontSize: '15px', color: mutedText, fontWeight: 500, marginBottom: 'auto', paddingBottom: '28px' }}>
                    {hero.mainStat.label}
                  </p>
                  <div style={{ display: 'flex', gap: '20px', paddingTop: '24px', borderTop: `1px solid ${theme.border}`, flexWrap: 'wrap' }}>
                    {hero.secondaryStats.map(s => (
                      <div key={s.label}>
                        <p style={{ fontSize: '22px', fontWeight: 700, color: theme.accent, letterSpacing: '-0.02em' }}>{s.value}</p>
                        <p style={{ fontSize: '12px', color: mutedText, marginTop: '2px' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                  {secondary.map(p => (
                    <div key={p.id} style={{
                      background: theme.cardBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '14px',
                      padding: '20px 24px',
                      borderLeft: `3px solid ${p.color}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      flex: 1,
                    }}>
                      <div style={{ flexShrink: 0 }}>
                        <PlatformLogo id={p.id} color={p.color} size={22} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '12px', color: mutedText, fontWeight: 500, marginBottom: '2px' }}>{p.name}</p>
                        <p style={{ fontSize: '26px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{p.mainStat.value}</p>
                        <p style={{ fontSize: '12px', color: mutedText, marginTop: '2px' }}>{p.mainStat.label}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                        {p.secondaryStats.map(s => (
                          <div key={s.label} style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: theme.accent }}>{s.value}</p>
                            <p style={{ fontSize: '11px', color: mutedText }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>)
          })()}
        </div>
      </section>

      {/* ── YOUTUBE ANALYTICS ────────────────────────────── */}
      {ytAnalytics && (effectiveYtOverride || ytStats) && (() => {
        const topCountries = ytAnalytics.topCountries as Array<{ country: string; views: number }> | undefined
        const ageGroups = ytAnalytics.ageGroups as Array<{ age: string; pct: number }> | undefined
        const gender = ytAnalytics.gender as { male: number; female: number } | undefined
        const avgViewDuration = ytAnalytics.avgViewDuration as number | null | undefined
        const avgViewPercentage = ytAnalytics.avgViewPercentage as number | null | undefined
        const estimatedMinutesWatched = ytAnalytics.estimatedMinutesWatched as number | null | undefined

        const hasData = (topCountries?.length ?? 0) > 0 || (ageGroups?.length ?? 0) > 0 || avgViewDuration != null
        if (!hasData) return null

        const fmtDuration = (secs: number) => {
          const m = Math.floor(secs / 60)
          const s = secs % 60
          return `${m}m${s > 0 ? ` ${s}s` : ''}`
        }

        return (
          <section style={{ padding: '0 24px 80px', background: theme.bg }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <SectionTitle color={theme.text}>Statistiques d&apos;audience</SectionTitle>

              {/* Watch time KPIs */}
              {(avgViewDuration != null || avgViewPercentage != null || estimatedMinutesWatched != null) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '32px' }}>
                  {avgViewDuration != null && (
                    <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '20px 24px' }}>
                      <p style={{ fontSize: '28px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{fmtDuration(avgViewDuration)}</p>
                      <p style={{ fontSize: '12px', color: mutedText, marginTop: '4px' }}>Durée moy. de visionnage</p>
                    </div>
                  )}
                  {avgViewPercentage != null && (
                    <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '20px 24px' }}>
                      <p style={{ fontSize: '28px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{avgViewPercentage}%</p>
                      <p style={{ fontSize: '12px', color: mutedText, marginTop: '4px' }}>% de la vidéo regardé</p>
                    </div>
                  )}
                  {estimatedMinutesWatched != null && (
                    <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '20px 24px' }}>
                      <p style={{ fontSize: '28px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{fmtNum(estimatedMinutesWatched)}</p>
                      <p style={{ fontSize: '12px', color: mutedText, marginTop: '4px' }}>minutes regardées (90j)</p>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: topCountries?.length ? '1fr 1fr' : '1fr', gap: '24px' }}>
                {/* Demographics */}
                {(ageGroups?.length || gender) && (
                  <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '28px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: theme.subtext, marginBottom: '20px', letterSpacing: '0.02em' }}>Démographie</p>
                    {ageGroups?.sort((a, b) => b.pct - a.pct).map(ag => (
                      <AgeBar key={ag.age} label={ag.age} pct={ag.pct} accent={theme.accent} subtext={theme.subtext} />
                    ))}
                    {gender && (gender.male > 0 || gender.female > 0) && (
                      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ flex: 1, background: `${theme.accent}22`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                            <p style={{ fontSize: '22px', fontWeight: 700, color: theme.accent }}>{gender.male}%</p>
                            <p style={{ fontSize: '11px', color: mutedText, marginTop: '2px' }}>Hommes</p>
                          </div>
                          <div style={{ flex: 1, background: femaleBarBg, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                            <p style={{ fontSize: '22px', fontWeight: 700, color: femaleColor }}>{gender.female}%</p>
                            <p style={{ fontSize: '11px', color: mutedText, marginTop: '2px' }}>Femmes</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Top countries */}
                {topCountries && topCountries.length > 0 && (
                  <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '28px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: theme.subtext, marginBottom: '20px', letterSpacing: '0.02em' }}>Top pays (90 jours)</p>
                    {topCountries.map((c, i) => {
                      const maxViews = topCountries[0]?.views ?? 1
                      const pct = Math.round((c.views / maxViews) * 100)
                      return (
                        <div key={c.country} style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: mutedText, width: '16px' }}>{i + 1}</span>
                              <Flag code={c.country} size={16} />
                              <span style={{ fontSize: '13px', fontWeight: 500, color: theme.text }}>{c.country}</span>
                            </div>
                            <span style={{ fontSize: '13px', color: theme.accent, fontWeight: 600 }}>{fmtNum(c.views)}</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(128,128,128,0.15)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: theme.accent, borderRadius: '9999px' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )
      })()}

      {/* ── VIDÉOS RÉCENTES ───────────────────────────────── */}
      {ytRecentVideos && ytRecentVideos.length > 0 && (
        <section style={{ padding: '0 24px 80px', background: theme.bg }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <SectionTitle color={theme.text}>Vidéos récentes</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {ytRecentVideos.map(v => (
                <a
                  key={v.id}
                  href={`https://youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'block', background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '14px', overflow: 'hidden', transition: 'box-shadow 150ms ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  {v.thumbnail && (
                    <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                      <img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                    </div>
                  )}
                  <div style={{ padding: '14px 16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: theme.text, lineHeight: 1.4, marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {v.title}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: mutedText }}>
                      <span>👁 {fmtNum(v.viewCount)}</span>
                      <span>👍 {fmtNum(v.likeCount)}</span>
                      <span>💬 {fmtNum(v.commentCount)}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PARTENARIATS PASSÉS ───────────────────────────── */}
      {showPartnerships && (
        <section style={{ padding: '0 24px 80px', background: theme.bg }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <SectionTitle color={theme.text}>Partenariats précédents</SectionTitle>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {displayedPartnerships.map((p: typeof pastPartners[0], i: number) => (
                <div key={i} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 700, color: theme.text }}>{p.name}</p>
                      <p style={{ fontSize: '12px', color: mutedText, marginTop: '2px' }}>{p.category}</p>
                    </div>
                    <span style={{ fontSize: '12px', color: mutedText, flexShrink: 0, marginLeft: '8px' }}>{p.date}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: theme.subtext, lineHeight: 1.6, padding: '10px 14px', background: theme.statBg, borderRadius: '8px', borderLeft: `3px solid ${theme.accent}` }}>
                    {p.result}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FORMULAIRE DE CONTACT ─────────────────────────── */}
      <section id="contact-form" style={{ padding: '0 24px 96px', background: theme.bg }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          {collabFormats.length > 0 && (
            <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {collabFormats.map(f => (
                <span key={f} style={{ background: `${theme.accent}26`, color: theme.accent, border: `1px solid ${theme.accent}50`, borderRadius: '9999px', padding: '5px 16px', fontSize: '13px', fontWeight: 500 }}>
                  {f}
                </span>
              ))}
            </div>
          )}

          <div style={{ background: theme.cardBg, borderRadius: '20px', padding: '48px', border: `1px solid ${theme.border}` }}>
            {sent ? (
              <div role="alert" style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `${theme.accent}30`, border: `2px solid ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px', color: theme.accent }}>
                  ✓
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: theme.text, marginBottom: '10px' }}>
                  Proposition envoyée !
                </h2>
                <p style={{ fontSize: '15px', color: theme.subtext, lineHeight: 1.6 }}>
                  {displayCreator.pseudo} traite les demandes sous 48h. Vous recevrez une réponse par email.
                </p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: theme.text, marginBottom: '8px', letterSpacing: '-0.02em' }}>
                  Proposer un partenariat
                </h2>
                <p style={{ fontSize: '14px', color: mutedText, marginBottom: '28px' }}>
                  Réponse sous 48h · Traité personnellement par {displayCreator.pseudo}
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
                  <div>
                    <label htmlFor="partnership-company" style={labelStyle}>Entreprise / marque</label>
                    <input
                      id="partnership-company"
                      required
                      placeholder="NordVPN, Corsair..."
                      value={form.company}
                      onChange={e => setForm({ ...form, company: e.target.value })}
                      aria-invalid={form.company === '' ? undefined : undefined}
                      style={inputStyle}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    />
                  </div>

                  <div>
                    <label htmlFor="partnership-budget" style={labelStyle}>Budget estimé</label>
                    <select
                      id="partnership-budget"
                      required
                      value={form.budget}
                      onChange={e => setForm({ ...form, budget: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    >
                      <option value="">Sélectionner...</option>
                      <option>Moins de 300€</option>
                      <option>300€ – 800€</option>
                      <option>800€ – 2 000€</option>
                      <option>2 000€ – 5 000€</option>
                      <option>5 000€+</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="partnership-type" style={labelStyle}>Type de collaboration</label>
                    <select
                      id="partnership-type"
                      required
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    >
                      <option value="">Sélectionner...</option>
                      <option>Intégration vidéo YouTube</option>
                      <option>Sponsoring stream Twitch</option>
                      <option>Pack réseaux sociaux</option>
                      <option>Ambassadeur longue durée</option>
                      <option>Autre</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="partnership-message" style={labelStyle}>Message</label>
                    <textarea
                      id="partnership-message"
                      required
                      rows={4}
                      placeholder={`Bonjour ${displayCreator.pseudo}, je représente... et je souhaite vous proposer...`}
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      background: theme.accent, color: btnTextColor, border: 'none', borderRadius: '9999px',
                      padding: '14px 28px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', width: '100%',
                      transition: 'opacity 150ms ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                  >
                    Envoyer la proposition →
                  </button>
                </form>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '28px', paddingTop: '24px', borderTop: `1px solid ${theme.border}` }}>
              {[
                { Icon: Youtube, color: '#ef4444', label: 'YouTube' },
                { Icon: Twitter, color: isDark ? '#ffffff' : '#0f172a', label: 'Twitter / X' },
                { Icon: Instagram, color: '#e1306c', label: 'Instagram' },
                { Icon: Mail, color: '#0284c7', label: 'Email' },
              ].map(({ Icon, color, label }, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label={label}
                  style={{ width: '40px', height: '40px', borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, background: isDark ? 'rgba(255,255,255,0.06)' : 'white', transition: 'all 150ms ease' }}
                  onMouseEnter={e => { ;(e.currentTarget as HTMLElement).style.borderColor = theme.accent; ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { ;(e.currentTarget as HTMLElement).style.borderColor = theme.border; ;(e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <Icon size={18} />
                </a>
              ))}
              <a
                href="#"
                aria-label="Twitch"
                style={{ width: '40px', height: '40px', borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(255,255,255,0.06)' : 'white', transition: 'all 150ms ease' }}
                onMouseEnter={e => { ;(e.currentTarget as HTMLElement).style.borderColor = theme.accent; ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { ;(e.currentTarget as HTMLElement).style.borderColor = theme.border; ;(e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#9146ff" aria-hidden="true">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── STICKY CTA ────────────────────────────────────── */}
      <div
        id="sticky-cta"
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 50,
          transition: 'opacity 250ms ease, transform 250ms ease',
          opacity: stickyVisible ? 1 : 0,
          transform: stickyVisible ? 'translateY(0)' : 'translateY(12px)',
          pointerEvents: stickyVisible ? 'auto' : 'none',
        }}
      >
        <button
          onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: theme.accent, color: btnTextColor, border: 'none', borderRadius: '9999px',
            padding: '14px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            boxShadow: `0 4px 20px ${theme.accent}59`, whiteSpace: 'nowrap',
            transition: 'opacity 150ms ease, box-shadow 150ms ease',
          }}
          onMouseEnter={e => { ;(e.currentTarget as HTMLElement).style.opacity = '0.85'; ;(e.currentTarget as HTMLElement).style.boxShadow = `0 6px 28px ${theme.accent}73` }}
          onMouseLeave={e => { ;(e.currentTarget as HTMLElement).style.opacity = '1'; ;(e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${theme.accent}59` }}
        >
          Proposer un partenariat →
        </button>
      </div>

      <footer role="contentinfo" style={{ padding: '24px', textAlign: 'center', color: mutedText, fontSize: '12px', borderTop: `1px solid ${theme.border}` }}>
        Media kit généré par{' '}
        <span style={{ color: '#16a34a', fontWeight: 600 }}>Sponsorable</span>
        {effectiveLastFetched && (
          <span style={{ display: 'block', fontSize: '11px', color: mutedText, marginTop: '4px', opacity: 0.6 }}>
            Dernière synchronisation {timeSince(effectiveLastFetched)}
          </span>
        )}
        <span className="pdf-export-date">
          Exporté le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </footer>
    </div>
  )
}

export default PublicMediaKitPage
