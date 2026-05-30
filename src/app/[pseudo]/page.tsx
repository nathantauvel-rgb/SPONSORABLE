'use client'

import Flag from '@/components/ui/Flag'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { creator, exampleCreators, pastPartners, platforms } from '@/data/mockData'
import type { Platform } from '@/types'
import { safeUrl, safeCalendlyUrl } from '@/lib/safeUrl'
import { inferProfileData, computeEditorialScore, computeProfileStrategy, selectBriefCards } from '@/lib/profileInference'
import { generatePositioningPhrase } from '@/lib/profileCopyGenerator'
import type { ProfileStrategy, BriefCard } from '@/types/mediakit'

/* ── Theme loader ─────────────────────────────────────────── */

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
    return exampleCreators.find(c => c.id === id)?.theme ?? DEFAULT_THEME
  } catch { return DEFAULT_THEME }
}

/* ── Platform logo ────────────────────────────────────────── */

const PlatformLogo = ({ id, color, size = 18 }: { id: string; color: string; size?: number }) => {
  if (id === 'youtube') return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" /><path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white" /></svg>
  if (id === 'twitch') return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" /></svg>
  if (id === 'tiktok') return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" /></svg>
  if (id === 'instagram') return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
  return null
}

/* ── Helpers ──────────────────────────────────────────────── */

const fmtNum = (n: string | number): string => {
  const num = typeof n === 'string' ? parseInt(n) : n
  if (isNaN(num)) return String(n)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (num >= 1_000) return num.toLocaleString('fr-FR')
  return String(num)
}

const timeSince = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  return `il y a ${Math.floor(mins / 60)}h`
}

const fmtSecs = (secs: number) => {
  const m = Math.floor(secs / 60); const s = secs % 60
  return `${m}m${s > 0 ? ` ${s}s` : ''}`
}

const SectionTitle = ({ children, color = '#0f172a' }: { children: React.ReactNode; color?: string }) => (
  <h2 style={{ fontSize: '24px', fontWeight: 700, color, marginBottom: '28px', letterSpacing: '-0.02em' }}>{children}</h2>
)

const AgeBar = ({ label, pct, accent = '#16a34a', subtext = '#475569' }: { label: string; pct: number; accent?: string; subtext?: string }) => (
  <div style={{ marginBottom: '10px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontSize: '13px', color: subtext, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '13px', color: accent, fontWeight: 600 }}>{pct}%</span>
    </div>
    <div style={{ height: '6px', background: 'rgba(128,128,128,0.15)', borderRadius: '9999px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: accent, borderRadius: '9999px', transition: 'width 600ms ease' }} />
    </div>
  </div>
)

/* ── Loaders localStorage ─────────────────────────────────── */

const loadConnectedPlatforms = (): string[] => {
  try { const s = localStorage.getItem('sponsorable_connected_platforms'); return s ? JSON.parse(s) : platforms.map(p => p.id) }
  catch { return platforms.map(p => p.id) }
}
const loadFormats = (): string[] => {
  try { const s = localStorage.getItem('sponsorable_formats'); return s ? JSON.parse(s) : ['YouTube', 'Twitch', 'Réseaux sociaux', 'Ambassadeur'] }
  catch { return ['YouTube', 'Twitch', 'Réseaux sociaux', 'Ambassadeur'] }
}
const loadShowPartnerships = (): boolean => {
  const s = localStorage.getItem('sponsorable_show_partnerships'); return s === null ? true : s === 'true'
}
const loadPartnerships = () => {
  try { const s = localStorage.getItem('sponsorable_partnerships'); return s ? JSON.parse(s) : pastPartners } catch { return pastPartners }
}
const loadBanner = (): string => {
  try { if (localStorage.getItem('sponsorable_plan') !== 'pro') return ''; const s = localStorage.getItem('sponsorable_banner'); return s ? JSON.parse(s) : '' } catch { return '' }
}
const loadCalendly = (): string => {
  try { if (localStorage.getItem('sponsorable_plan') !== 'pro') return ''; const s = localStorage.getItem('sponsorable_calendly'); return s ? JSON.parse(s) : '' } catch { return '' }
}
const loadProfile = () => {
  try { const s = localStorage.getItem('sponsorable_profile'); return s ? JSON.parse(s) : null } catch { return null }
}
const loadYTPlatform = (): Platform | null => {
  try {
    const s = localStorage.getItem('sponsorable_yt_data'); if (!s) return null
    const d = JSON.parse(s)
    return { id: 'youtube', name: 'YouTube', color: '#ef4444', hero: true, mainStat: { value: fmtNum(d.subscriberCount), label: 'abonnés' }, secondaryStats: [{ value: fmtNum(d.viewCount), label: 'vues totales' }, { value: fmtNum(d.videoCount), label: 'vidéos publiées' }] }
  } catch { return null }
}

/* ── Stat card state helpers ──────────────────────────────── */

type PlatformState = 'rich' | 'medium' | 'sparse'

function ytPlatformState(subs: number): PlatformState {
  if (subs >= 10_000) return 'rich'
  if (subs >= 500) return 'medium'
  return 'sparse'
}
function twitchPlatformState(followers: number): PlatformState {
  if (followers >= 1_000) return 'rich'
  if (followers >= 100) return 'medium'
  return 'sparse'
}

/* ── Section order by strategy ────────────────────────────── */

function getSectionOrder(strategy: ProfileStrategy): string[] {
  switch (strategy) {
    case 'rich':       return ['enbref', 'stats', 'analytics', 'content', 'audiencefit', 'formats', 'partnerships']
    case 'medium':     return ['enbref', 'content', 'stats', 'audiencefit', 'formats', 'partnerships']
    case 'positioned': return ['enbref', 'content', 'audiencefit', 'formats', 'stats', 'partnerships']
    case 'sparse':     return ['enbref', 'audiencefit', 'formats', 'stats']
  }
}

/* ── Main page ────────────────────────────────────────────── */

const PublicMediaKitPage = () => {
  const params = useParams()
  const slug = typeof params?.pseudo === 'string' ? params.pseudo : ''

  const [remoteData, setRemoteData] = useState<Record<string, unknown> | null>(null)
  const [printReady, setPrintReady] = useState(false)
  const isPrintMode = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('print') === '1'
    : false

  useEffect(() => {
    if (!slug) return
    fetch(`/api/public/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRemoteData(data); setPrintReady(true) })
      .catch(() => { setPrintReady(true) })

    if (!new URLSearchParams(window.location.search).has('print')) {
      fetch('/api/pageview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) }).catch(() => {})
    }
  }, [slug])

  useEffect(() => {
    if (!isPrintMode) return
    const fb = setTimeout(() => setPrintReady(true), 4000)
    return () => clearTimeout(fb)
  }, [isPrintMode])

  useEffect(() => {
    if (!isPrintMode || !printReady) return
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [isPrintMode, printReady])

  /* ── Theme ─────────────────────────────────────────────── */
  const resolvedTheme = (() => {
    if (remoteData?.theme && typeof remoteData.theme === 'string') {
      const found = exampleCreators.find(c => c.id === remoteData.theme)
      if (found) return found.theme
    }
    return loadTemplateTheme()
  })()
  const theme = resolvedTheme
  const isForest = theme.bg === '#eae5d8'
  const isMono = theme.bg === '#111111'
  const isDark = !isForest && theme.bg !== '#ffffff' && theme.bg !== '#fff'
  const btnTextColor = theme.accent === '#ffffff' ? theme.bg : '#ffffff'
  const mutedText = isDark ? theme.subtext : (isForest ? theme.subtext : '#94a3b8')
  const femaleColor = isForest ? '#b45309' : isMono ? '#525252' : isDark ? '#38bdf8' : '#0284c7'
  const femaleBarBg = isForest ? 'rgba(180,83,9,0.18)' : isMono ? 'rgba(255,255,255,0.08)' : isDark ? 'rgba(56,189,248,0.20)' : '#bfdbfe'

  /* ── Profile data ──────────────────────────────────────── */
  const savedProfile = useState(() => loadProfile())[0]
  const remoteProfile = remoteData ? { pseudo: remoteData.displayName ?? undefined, niche: remoteData.niche ?? undefined, bio: remoteData.bio ?? undefined } : null
  const effectiveProfile = remoteProfile ?? savedProfile
  const displayCreator = {
    ...creator,
    ...(effectiveProfile || {}),
    avatar_initials: effectiveProfile?.pseudo ? String(effectiveProfile.pseudo).slice(0, 2).toUpperCase() : creator.avatar_initials,
    niches: effectiveProfile?.niche ? String(effectiveProfile.niche).split(/\s*[·]\s*/).map((s: string) => s.trim()).filter(Boolean) : creator.niches,
  }

  const [form, setForm] = useState({ company: '', budget: '', type: '', message: '' })
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

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

  /* ── Platform stats ────────────────────────────────────── */
  type RawPlatform = { type: string; stats: Record<string, unknown> | null; lastFetched: string | null; username?: string }
  const remotePlatforms = remoteData?.platforms as RawPlatform[] | undefined

  const remoteYt = remotePlatforms?.find(p => p.type === 'youtube') ?? null
  const ytStats = remoteYt?.stats ?? null
  const ytAnalytics = ytStats?.analytics as Record<string, unknown> | undefined
  const ytRecentVideos = ytStats?.recentVideos as Array<{ id: string; title: string; publishedAt: string; thumbnail: string | null; viewCount: string; likeCount: string; commentCount: string }> | undefined
  const ytEngagementRate = ytStats?.engagementRate as number | null | undefined
  const ytAvgViewsPerVideo = ytStats?.avgViewsPerVideo as number | null | undefined
  const ytViews90d = ytAnalytics?.views90d as number | null | undefined

  const ytSubs = Number(ytStats?.subscriberCount ?? 0)
  const ytSecondaryStats: { value: string; label: string }[] = ytStats ? [
    ytViews90d != null ? { value: fmtNum(ytViews90d), label: 'vues (90 derniers jours)' } : { value: fmtNum(String(ytStats.viewCount ?? '0')), label: 'vues totales' },
    ytAvgViewsPerVideo != null ? { value: fmtNum(ytAvgViewsPerVideo), label: 'vues moy. par vidéo' } : { value: fmtNum(String(ytStats.videoCount ?? '0')), label: 'vidéos publiées' },
  ] : []

  const effectiveYtOverride: Platform | null = ytStats ? {
    id: 'youtube', name: 'YouTube', color: '#ef4444', hero: true,
    mainStat: { value: fmtNum(String(ytStats.subscriberCount ?? '0')), label: 'abonnés' },
    secondaryStats: ytSecondaryStats,
  } : localYtOverride

  const remoteTwitch = remotePlatforms?.find(p => p.type === 'twitch') ?? null
  const twitchStats = remoteTwitch?.stats ?? null
  const twitchRecentStreams = twitchStats?.recentStreams as Array<{ id: string; title: string; publishedAt: string; duration: string; thumbnail: string | null; viewCount: number }> | undefined
  const twitchTopClips = twitchStats?.topClips as Array<{ id: string; title: string; viewCount: number; thumbnail: string | null; createdAt: string; duration: number }> | undefined
  const twFollowers = Number(twitchStats?.followerCount ?? 0)

  const twitchSecondaryStats: { value: string; label: string }[] = []
  if (twitchStats) {
    if (twitchStats.avgVodViews != null) twitchSecondaryStats.push({ value: fmtNum(Number(twitchStats.avgVodViews)), label: 'vues moy. par stream' })
    else twitchSecondaryStats.push({ value: fmtNum(Number(twitchStats.viewCount ?? 0)), label: 'vues canal' })
    if (twitchStats.subscriptionCount != null) twitchSecondaryStats.push({ value: fmtNum(Number(twitchStats.subscriptionCount)), label: 'abonnés payants' })
  }

  const effectiveTwitchOverride: Platform | null = twitchStats ? {
    id: 'twitch', name: 'Twitch', color: '#9146ff', hero: false,
    mainStat: { value: fmtNum(twFollowers), label: 'followers' },
    secondaryStats: twitchSecondaryStats,
  } : null

  const effectiveLastFetched = remoteYt?.lastFetched ?? remoteTwitch?.lastFetched ?? null

  /* ── Nouveaux champs ───────────────────────────────────── */
  const manualCountry = remoteData?.country ? String(remoteData.country) : ''
  const manualLanguages = Array.isArray(remoteData?.languages) ? remoteData.languages as string[] : []
  const manualContentStyle = remoteData?.contentStyle ? String(remoteData.contentStyle) : ''
  const manualTargetBrands = remoteData?.targetBrands ? String(remoteData.targetBrands) : ''
  const manualAvailableForCollabs = remoteData != null ? Boolean(remoteData.availableForCollabs ?? true) : true
  const manualPositioningPhrase = remoteData?.positioningPhrase ? String(remoteData.positioningPhrase) : ''
  const manualSponsorSummary = remoteData?.sponsorSummary ? String(remoteData.sponsorSummary) : ''

  /* ── Inference & strategy ──────────────────────────────── */
  const inferred = inferProfileData(ytStats, twitchStats)
  const editorialScore = computeEditorialScore({
    bio: String(remoteData?.bio ?? ''),
    niche: String(remoteData?.niche ?? ''),
    formats: effectiveFormats,
    country: manualCountry,
    languages: manualLanguages,
  })
  const strategy: ProfileStrategy = computeProfileStrategy({
    ytSubs, twFollowers,
    hasRecentContent: inferred.hasRecentContent,
    hasRecentVideos: inferred.hasRecentVideos,
    hasRecentStreams: inferred.hasRecentStreams,
    hasClips: inferred.hasClips,
    platformConnected: inferred.platformConnected,
    editorialScore,
  })

  const briefCards: BriefCard[] = selectBriefCards(
    { niche: String(remoteData?.niche ?? ''), formats: effectiveFormats, country: manualCountry, languages: manualLanguages, availableForCollabs: manualAvailableForCollabs, contentStyle: manualContentStyle },
    { ...inferred, strategy }
  )

  const effectivePositioningPhrase = manualPositioningPhrase || generatePositioningPhrase(
    { displayName: String(remoteData?.displayName ?? ''), bio: String(remoteData?.bio ?? ''), niche: String(remoteData?.niche ?? ''), formats: effectiveFormats, country: manualCountry, languages: manualLanguages, contentStyle: manualContentStyle, availableForCollabs: manualAvailableForCollabs },
    inferred
  )

  /* ── Platform card state ───────────────────────────────── */
  const ytState: PlatformState | null = ytStats ? ytPlatformState(ytSubs) : null
  const twitchState: PlatformState | null = twitchStats ? twitchPlatformState(twFollowers) : null

  /* ── Social links ──────────────────────────────────────── */
  const remoteYtUsername = remotePlatforms?.find(p => p.type === 'youtube')?.username ?? null
  const remoteTwitchUsername = remotePlatforms?.find(p => p.type === 'twitch')?.username ?? null
  const socialLinks = [
    remoteYtUsername ? { id: 'youtube', label: 'YouTube', handle: remoteYtUsername.startsWith('@') ? remoteYtUsername : `@${remoteYtUsername}`, url: `https://youtube.com/${remoteYtUsername.startsWith('@') ? remoteYtUsername : `@${remoteYtUsername}`}`, color: '#ef4444' } : null,
    remoteTwitchUsername ? { id: 'twitch', label: 'Twitch', handle: `@${remoteTwitchUsername}`, url: `https://twitch.tv/${remoteTwitchUsername}`, color: '#9146ff' } : null,
    remoteData?.twitterHandle ? { id: 'twitter', label: 'Twitter / X', handle: `@${remoteData.twitterHandle}`, url: `https://x.com/${remoteData.twitterHandle}`, color: isDark ? '#ffffff' : '#0f172a' } : null,
    remoteData?.instagramHandle ? { id: 'instagram', label: 'Instagram', handle: `@${remoteData.instagramHandle}`, url: `https://instagram.com/${remoteData.instagramHandle}`, color: '#e1306c' } : null,
    remoteData?.tiktokHandle ? { id: 'tiktok', label: 'TikTok', handle: `@${remoteData.tiktokHandle}`, url: `https://tiktok.com/@${remoteData.tiktokHandle}`, color: isDark ? '#ffffff' : '#0f172a' } : null,
  ].filter(Boolean) as { id: string; label: string; handle: string; url: string; color: string }[]

  const [stickyVisible, setStickyVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 320)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setSubmitError('')
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: params.pseudo as string, ...form }) })
      const data = await res.json()
      if (!res.ok) setSubmitError(data.error ?? "Erreur lors de l'envoi")
      else setSent(true)
    } catch { setSubmitError('Erreur réseau, réessaie dans quelques instants') }
    finally { setSubmitting(false) }
  }

  /* ── Form styles ───────────────────────────────────────── */
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: theme.subtext, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '6px' }
  const inputStyle: React.CSSProperties = { width: '100%', background: isDark ? 'rgba(255,255,255,0.06)' : 'white', border: `1.5px solid ${theme.border}`, borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: theme.text, outline: 'none', transition: 'all 150ms ease' }
  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}20` }
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = 'none' }

  /* ── Section renderers ─────────────────────────────────── */

  const sectionPad = { padding: '0 24px 80px' }

  // Détermine si la ligne de positionnement hero apporte une info distincte de la bio
  const bioText = displayCreator.bio ?? ''
  const showHeroPositioningLine = !!(effectivePositioningPhrase && effectivePositioningPhrase.trim() !== bioText.trim())
  const heroBodyLine = manualSponsorSummary || bioText

  // EN BREF
  const renderEnBref = () => {
    if (briefCards.length === 0) return null
    return (
      <section style={{ ...sectionPad, background: theme.bg }} key="enbref">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <SectionTitle color={theme.text}>En bref pour les marques</SectionTitle>

          {/* Résumé sponsor si disponible */}
          {(manualSponsorSummary || effectivePositioningPhrase) && (
            <p style={{ fontSize: '15px', color: theme.subtext, lineHeight: 1.75, maxWidth: '640px', marginBottom: '28px', borderLeft: `3px solid ${theme.accent}`, paddingLeft: '16px' }}>
              {manualSponsorSummary || effectivePositioningPhrase}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(briefCards.length, 4)}, 1fr)`, gap: '12px' }}>
            {briefCards.map((card, i) => (
              <div key={i} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '20px 18px', borderTop: `3px solid ${theme.accent}`, boxShadow: theme.boxShadow !== 'none' ? theme.boxShadow : '0 1px 4px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: mutedText, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{card.label}</p>
                <p style={{ fontSize: '17px', fontWeight: 700, color: theme.text, lineHeight: 1.2 }}>{card.value}</p>
                {card.sublabel && <p style={{ fontSize: '12px', color: mutedText, marginTop: '4px', lineHeight: 1.4 }}>{card.sublabel}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // STATS VÉRIFIÉES
  const renderStats = () => {
    if (!ytStats && !twitchStats) return null
    const lastSync = effectiveLastFetched

    const renderPlatformCard = (
      platform: Platform,
      state: PlatformState,
      stats: Record<string, unknown> | null
    ) => {
      const isHero = platform.hero
      const cardStyle: React.CSSProperties = {
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: '10px',
        padding: isHero ? '36px' : '20px 24px',
        borderTop: `4px solid ${platform.color}`,
        boxShadow: theme.boxShadow !== 'none' ? theme.boxShadow : '0 4px 24px rgba(0,0,0,0.07)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }

      if (state === 'sparse') {
        return (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <PlatformLogo id={platform.id} color={platform.color} size={18} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: theme.subtext }}>{platform.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.20)', borderRadius: '4px', padding: '2px 7px', fontWeight: 600 }}>✓ Vérifié</span>
            </div>
            <div style={{ padding: '14px 16px', background: `${theme.accent}08`, borderRadius: '6px', marginBottom: '14px', borderLeft: `2px solid ${theme.accent}50` }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>Présence authentifiée</p>
              <p style={{ fontSize: '12px', color: mutedText, marginTop: '3px', lineHeight: 1.5 }}>Profil connecté via OAuth — données en cours de collecte</p>
            </div>
            {stats && (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {platform.id === 'youtube' && (stats.videoCount != null) && Number(stats.videoCount) > 0 && (
                  <div style={{ padding: '10px 14px', background: theme.statBg, borderRadius: '8px', border: `1px solid ${theme.statBorder}` }}>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: theme.accent }}>{fmtNum(Number(stats.videoCount))}</p>
                    <p style={{ fontSize: '11px', color: mutedText }}>vidéos publiées</p>
                  </div>
                )}
                {platform.id === 'twitch' && twitchTopClips && twitchTopClips.length > 0 && (
                  <div style={{ padding: '10px 14px', background: theme.statBg, borderRadius: '8px', border: `1px solid ${theme.statBorder}` }}>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: theme.accent }}>{twitchTopClips.length}</p>
                    <p style={{ fontSize: '11px', color: mutedText }}>clips disponibles</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      }

      if (state === 'medium') {
        return (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <PlatformLogo id={platform.id} color={platform.color} size={18} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: theme.subtext }}>{platform.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.20)', borderRadius: '4px', padding: '2px 7px', fontWeight: 600 }}>✓ Vérifié</span>
            </div>
            <p style={{ fontSize: isHero ? '48px' : '32px', fontWeight: 800, color: theme.text, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: '4px' }}>{platform.mainStat.value}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'auto', paddingBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: mutedText, fontWeight: 500 }}>{platform.mainStat.label}</p>
              {inferred.hasRecentContent && <span style={{ fontSize: '11px', color: '#16a34a', background: 'rgba(22,163,74,0.08)', borderRadius: '4px', padding: '2px 7px', fontWeight: 600 }}>Contenu actif</span>}
            </div>
            <div style={{ display: 'flex', gap: '16px', paddingTop: '20px', borderTop: `1px solid ${theme.border}`, flexWrap: 'wrap' }}>
              {(() => {
                const stats = (strategy === 'positioned' || strategy === 'sparse')
                  ? platform.secondaryStats.filter(s => s.value !== '0')
                  : platform.secondaryStats
                if (stats.length === 0) return (
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: theme.accent }}>Activité récente</p>
                    <p style={{ fontSize: '11px', color: mutedText }}>Données en cours de collecte</p>
                  </div>
                )
                return stats.map(s => (
                  <div key={s.label}>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: theme.accent, letterSpacing: '-0.02em' }}>{s.value}</p>
                    <p style={{ fontSize: '11px', color: mutedText, marginTop: '2px' }}>{s.label}</p>
                  </div>
                ))
              })()}
            </div>
          </div>
        )
      }

      // rich state
      return (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
            <PlatformLogo id={platform.id} color={platform.color} size={20} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: theme.subtext }}>{platform.name}</span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.20)', borderRadius: '4px', padding: '2px 7px', fontWeight: 600 }}>✓ Vérifié</span>
          </div>
          <p style={{ fontSize: isHero ? '64px' : '40px', fontWeight: 800, color: theme.text, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: '6px' }}>{platform.mainStat.value}</p>
          <p style={{ fontSize: '15px', color: mutedText, fontWeight: 500, marginBottom: 'auto', paddingBottom: '28px' }}>{platform.mainStat.label}</p>
          <div style={{ display: 'flex', gap: '20px', paddingTop: '24px', borderTop: `1px solid ${theme.border}`, flexWrap: 'wrap' }}>
            {platform.secondaryStats.filter(s => s.value !== '0').map(s => (
              <div key={s.label}>
                <p style={{ fontSize: '22px', fontWeight: 700, color: theme.accent, letterSpacing: '-0.02em' }}>{s.value}</p>
                <p style={{ fontSize: '12px', color: mutedText, marginTop: '2px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    const heroPlatform = effectiveYtOverride ?? effectiveTwitchOverride
    const heroState = effectiveYtOverride ? ytState! : twitchState!
    const heroRawStats = effectiveYtOverride ? ytStats : twitchStats
    const secondaryPlatform = effectiveYtOverride && effectiveTwitchOverride ? effectiveTwitchOverride : null
    const secondaryState = effectiveYtOverride && effectiveTwitchOverride ? twitchState! : null

    if (!heroPlatform) return null

    return (
      <section style={{ padding: '0 24px 80px', background: theme.bg }} key="stats">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.accent, display: 'block' }} />
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: theme.accent, opacity: 0.4, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: theme.accent }}>Stats vérifiées</span>
            </div>
            {lastSync && <span style={{ fontSize: '12px', color: mutedText }}>Dernière synchronisation {timeSince(lastSync)}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: secondaryPlatform ? '1fr 1fr' : '1fr', gap: '16px', alignItems: 'stretch' }}>
            {renderPlatformCard({ ...heroPlatform, hero: true }, heroState, heroRawStats)}
            {secondaryPlatform && secondaryState && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                {renderPlatformCard({ ...secondaryPlatform, hero: false }, secondaryState, twitchStats)}
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // ANALYTICS YOUTUBE
  const renderAnalytics = () => {
    const topCountries = ytAnalytics?.topCountries as Array<{ country: string; views: number }> | undefined
    const ageGroups = ytAnalytics?.ageGroups as Array<{ age: string; pct: number }> | undefined
    const gender = ytAnalytics?.gender as { male: number; female: number } | undefined
    const avgViewDuration = ytAnalytics?.avgViewDuration as number | null | undefined
    const avgViewPercentage = ytAnalytics?.avgViewPercentage as number | null | undefined
    const estimatedMinutesWatched = ytAnalytics?.estimatedMinutesWatched as number | null | undefined
    const views90d = ytAnalytics?.views90d as number | null | undefined

    const hasData = (topCountries?.length ?? 0) > 0 || (ageGroups?.length ?? 0) > 0 || avgViewDuration != null || ytEngagementRate != null || views90d != null
    if (!hasData) return null

    return (
      <section style={{ ...sectionPad, background: theme.bg }} key="analytics">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <SectionTitle color={theme.text}>Statistiques d&apos;audience</SectionTitle>

          {(ytEngagementRate != null || views90d != null || avgViewDuration != null || avgViewPercentage != null || estimatedMinutesWatched != null) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '32px' }}>
              {ytEngagementRate != null && <div style={{ background: `${theme.accent}14`, border: `1px solid ${theme.accent}40`, borderRadius: '8px', padding: '20px 24px' }}><p style={{ fontSize: '28px', fontWeight: 800, color: theme.accent, letterSpacing: '-0.02em', lineHeight: 1 }}>{ytEngagementRate}%</p><p style={{ fontSize: '12px', color: mutedText, marginTop: '4px' }}>Taux d&apos;engagement</p></div>}
              {views90d != null && <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '20px 24px' }}><p style={{ fontSize: '28px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{fmtNum(views90d)}</p><p style={{ fontSize: '12px', color: mutedText, marginTop: '4px' }}>Vues (90 derniers jours)</p></div>}
              {avgViewDuration != null && <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '20px 24px' }}><p style={{ fontSize: '28px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{fmtSecs(avgViewDuration)}</p><p style={{ fontSize: '12px', color: mutedText, marginTop: '4px' }}>Durée moy. de visionnage</p></div>}
              {avgViewPercentage != null && <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '20px 24px' }}><p style={{ fontSize: '28px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{avgViewPercentage}%</p><p style={{ fontSize: '12px', color: mutedText, marginTop: '4px' }}>% de la vidéo regardé</p></div>}
              {estimatedMinutesWatched != null && <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '20px 24px' }}><p style={{ fontSize: '28px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{fmtNum(estimatedMinutesWatched)}</p><p style={{ fontSize: '12px', color: mutedText, marginTop: '4px' }}>Minutes regardées (90j)</p></div>}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: topCountries?.length ? '1fr 1fr' : '1fr', gap: '24px' }}>
            {(ageGroups?.length || gender) && (
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '24px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: theme.subtext, marginBottom: '20px', letterSpacing: '0.02em' }}>Démographie</p>
                {ageGroups?.sort((a, b) => b.pct - a.pct).map(ag => <AgeBar key={ag.age} label={ag.age} pct={ag.pct} accent={theme.accent} subtext={theme.subtext} />)}
                {gender && (gender.male > 0 || gender.female > 0) && (
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1, background: `${theme.accent}22`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}><p style={{ fontSize: '22px', fontWeight: 700, color: theme.accent }}>{gender.male}%</p><p style={{ fontSize: '11px', color: mutedText, marginTop: '2px' }}>Hommes</p></div>
                      <div style={{ flex: 1, background: femaleBarBg, borderRadius: '8px', padding: '12px', textAlign: 'center' }}><p style={{ fontSize: '22px', fontWeight: 700, color: femaleColor }}>{gender.female}%</p><p style={{ fontSize: '11px', color: mutedText, marginTop: '2px' }}>Femmes</p></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {topCountries && topCountries.length > 0 && (
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '24px' }}>
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
                      <div style={{ height: '4px', background: 'rgba(128,128,128,0.15)', borderRadius: '9999px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: theme.accent, borderRadius: '9999px' }} /></div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // CONTENU MIS EN AVANT
  const renderContent = () => {
    if (!inferred.hasRecentContent) return null
    const fmtDuration = (s: string) => { const h = s.match(/(\d+)h/)?.[1]; const m = s.match(/(\d+)m/)?.[1]; return h ? `${h}h${m ? ` ${m}m` : ''}` : m ? `${m}m` : s }

    return (
      <section style={{ ...sectionPad, background: theme.bg }} key="content">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <SectionTitle color={theme.text}>Contenu récent</SectionTitle>
          <p style={{ fontSize: '14px', color: theme.subtext, marginBottom: '28px', marginTop: '-16px', lineHeight: 1.6 }}>Extraits récents pour découvrir le ton et le style du créateur.</p>

          {ytRecentVideos && ytRecentVideos.length > 0 && (
            <div style={{ marginBottom: twitchTopClips?.length ? '40px' : 0 }}>
              {(inferred.hasRecentStreams || inferred.hasClips) && <p style={{ fontSize: '13px', fontWeight: 600, color: theme.subtext, marginBottom: '14px', letterSpacing: '0.02em' }}>Vidéos YouTube</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {ytRecentVideos.slice(0, 3).map(v => (
                  <a key={v.id} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration: 'none', display: 'block', background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', overflow: 'hidden', transition: 'box-shadow 150ms ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                    {v.thumbnail && <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}><img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /></div>}
                    <div style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: theme.text, lineHeight: 1.4, marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{v.title}</p>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: mutedText }}><span>{fmtNum(v.viewCount)} vues</span><span>·</span><span>{fmtNum(v.likeCount)} j'aime</span><span>·</span><span>{fmtNum(v.commentCount)} comm.</span></div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {twitchStats && (twitchRecentStreams?.length || twitchTopClips?.length || twitchStats.gameName != null) && (
            <div>
              {ytRecentVideos?.length && <p style={{ fontSize: '13px', fontWeight: 600, color: '#9146ff', marginBottom: '14px', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}><PlatformLogo id="twitch" color="#9146ff" size={14} /> Twitch</p>}
              {(twitchStats.gameName != null || (twitchStats.tags as string[] | undefined)?.length) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  {twitchStats.gameName != null && <span style={{ background: 'transparent', color: theme.subtext, border: `1px solid ${theme.border}`, borderRadius: '4px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.01em' }}>{String(twitchStats.gameName)}</span>}
                  {(twitchStats.tags as string[] | undefined)?.map((tag: string) => <span key={tag} style={{ background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '4px', padding: '3px 10px', fontSize: '12px', color: mutedText }}>{tag}</span>)}
                </div>
              )}

              {twitchTopClips && twitchTopClips.length > 0 && (
                <>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: theme.subtext, marginBottom: '14px', letterSpacing: '0.02em' }}>Top clips</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: twitchRecentStreams?.length ? '32px' : 0 }}>
                    {twitchTopClips.slice(0, 3).map(c => (
                      <div key={c.id} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                        {c.thumbnail && <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#0e0e0e' }}><img src={c.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /></div>}
                        <div style={{ padding: '12px 14px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: theme.text, lineHeight: 1.4, marginBottom: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.title}</p>
                          <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: mutedText }}><span>{fmtNum(c.viewCount)} vues</span><span>·</span><span>{Math.round(c.duration)}s</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {twitchRecentStreams && twitchRecentStreams.length > 0 && (
                <>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: theme.subtext, marginBottom: '14px', letterSpacing: '0.02em' }}>Streams récents</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                    {twitchRecentStreams.slice(0, 3).map(s => (
                      <div key={s.id} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                        {s.thumbnail && <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#0e0e0e' }}><img src={s.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /></div>}
                        <div style={{ padding: '12px 14px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: theme.text, lineHeight: 1.4, marginBottom: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{s.title}</p>
                          <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: mutedText }}><span>{fmtNum(s.viewCount)} vues</span><span>·</span><span>{fmtDuration(s.duration)}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    )
  }

  // AUDIENCE & FIT
  const renderAudienceFit = () => {
    const hasAnalyticsData = (ytAnalytics?.topCountries as unknown[] | undefined)?.length ||
      (ytAnalytics?.ageGroups as unknown[] | undefined)?.length

    // Si analytics rich → la section analytics l'a déjà couverte
    if (hasAnalyticsData && strategy === 'rich') return null

    const fitItems: { label: string; value: string }[] = []
    if (manualLanguages.length > 0) fitItems.push({ label: 'Langue(s)', value: manualLanguages.join(' · ') })
    else fitItems.push({ label: 'Langue', value: 'Français' })
    if (manualCountry) fitItems.push({ label: 'Marché principal', value: manualCountry })
    if (displayCreator.niches.length > 0) fitItems.push({ label: 'Niche', value: displayCreator.niches.join(' · ') })
    if (manualContentStyle) fitItems.push({ label: 'Style éditorial', value: manualContentStyle })
    if (inferred.dominantFormat === 'video') fitItems.push({ label: 'Format dominant', value: 'Vidéos YouTube' })
    else if (inferred.dominantFormat === 'live') fitItems.push({ label: 'Format dominant', value: 'Streams live Twitch' })
    if (manualTargetBrands) fitItems.push({ label: 'Compatible avec', value: manualTargetBrands })

    // Garantit au moins 3 items pour que le bloc soit substantiel
    if (fitItems.length < 3 && effectiveFormats.length > 0 && !fitItems.some(f => f.label === 'Format dominant')) {
      fitItems.push({ label: 'Format dominant', value: effectiveFormats[0] })
    }
    if (fitItems.length < 3) {
      fitItems.push({ label: 'Disponibilité', value: manualAvailableForCollabs ? 'Disponible' : 'Sur demande' })
    }

    if (fitItems.length === 0) return null

    return (
      <section style={{ ...sectionPad, background: theme.bg }} key="audiencefit">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <SectionTitle color={theme.text}>Profil &amp; audience</SectionTitle>
          <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {fitItems.map((item, i) => (
              <div key={i}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: mutedText, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</p>
                <p style={{ fontSize: '15px', fontWeight: 600, color: theme.text }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // FORMATS DE COLLABORATION
  const getFormatDescription = (format: string): string => {
    const lower = format.toLowerCase()
    if (lower.includes('intégration') || (lower.includes('vidéo') && !lower.includes('youtube'))) return 'Intégration en vidéo ou contenu dédié'
    if (lower.includes('stream') || lower.includes('live') || lower.includes('twitch')) return 'Mention live, activation ou session sponsorisée'
    if (lower.includes('ambassad')) return 'Visibilité récurrente sur plusieurs contenus'
    if (lower.includes('réseaux') || lower.includes('social') || lower.includes('post')) return 'Posts sponsorisés sur mes réseaux'
    if (lower.includes('placement') || lower.includes('produit')) return 'Mise en avant naturelle dans le contenu'
    if (lower.includes('short') || lower.includes('tiktok') || lower.includes('reel')) return 'Format court à fort potentiel viral'
    if (lower.includes('youtube')) return 'Intégration en vidéo YouTube ou Shorts'
    if (lower.includes('newsletter') || lower.includes('email')) return 'Placement dans ma newsletter communautaire'
    return 'Disponible — devis sur demande'
  }

  const renderFormats = () => {
    if (effectiveFormats.length === 0) return null
    return (
      <section style={{ ...sectionPad, background: theme.bg }} key="formats">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <SectionTitle color={theme.text}>Formats de collaboration</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {effectiveFormats.map(f => (
              <div key={f} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '16px 20px', borderLeft: `3px solid ${theme.accent}` }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: theme.text, marginBottom: '5px' }}>{f}</p>
                <p style={{ fontSize: '12px', color: mutedText, lineHeight: 1.5 }}>{getFormatDescription(f)}</p>
              </div>
            ))}
          </div>
          {manualAvailableForCollabs && (
            <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500, marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
              Disponible pour de nouveaux partenariats · Réponse sous 48h
            </p>
          )}
        </div>
      </section>
    )
  }

  // PARTENARIATS PASSÉS
  const renderPartnerships = () => {
    if (!effectiveShowPartnerships || !effectivePartnerships || effectivePartnerships.length === 0) return null
    return (
      <section style={{ ...sectionPad, background: theme.bg }} key="partnerships">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <SectionTitle color={theme.text}>Partenariats précédents</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {(effectivePartnerships as Array<{ name: string; category: string; result: string; date: string }>).map((p, i) => (
              <div key={i} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div><p style={{ fontSize: '16px', fontWeight: 700, color: theme.text }}>{p.name}</p><p style={{ fontSize: '12px', color: mutedText, marginTop: '2px' }}>{p.category}</p></div>
                  <span style={{ fontSize: '12px', color: mutedText, flexShrink: 0, marginLeft: '8px' }}>{p.date}</span>
                </div>
                <p style={{ fontSize: '13px', color: theme.subtext, lineHeight: 1.6, padding: '10px 14px', background: theme.statBg, borderRadius: '8px', borderLeft: `3px solid ${theme.accent}` }}>{p.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  /* ── Section map ───────────────────────────────────────── */
  const sectionMap: Record<string, React.ReactNode> = {
    enbref: renderEnBref(),
    stats: renderStats(),
    analytics: renderAnalytics(),
    content: renderContent(),
    audiencefit: renderAudienceFit(),
    formats: renderFormats(),
    partnerships: renderPartnerships(),
  }

  const sectionOrder = getSectionOrder(strategy)

  /* ── HERO section (3 variants) ──────────────────────────── */
  const calendlyUrl = effectiveCalendlyUrl
  const bannerUrl = effectiveBannerUrl

  const renderHero = () => {
    const platformBadges = [
      effectiveYtOverride ? { id: 'youtube', color: '#ef4444', label: 'YouTube' } : null,
      effectiveTwitchOverride ? { id: 'twitch', color: '#9146ff', label: 'Twitch' } : null,
    ].filter(Boolean) as { id: string; color: string; label: string }[]

    if (isForest) return (
      <section style={{ position: 'relative', overflow: 'hidden', padding: '0' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '55%', height: '70%', borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%', background: 'radial-gradient(ellipse, rgba(122,156,60,0.22) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '50%', height: '60%', borderRadius: '40% 60% 30% 70% / 60% 40% 60% 40%', background: 'radial-gradient(ellipse, rgba(90,120,40,0.16) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', padding: '80px 40px 60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '56px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.subtext }}>Media Kit</span>
            <span style={{ fontSize: '11px', color: theme.subtext, letterSpacing: '0.06em' }}>sponsorable.gg</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '48px', alignItems: 'end', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {displayCreator.niches.map((n: string) => <span key={n} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: theme.accent, background: `${theme.accent}18`, border: `1px solid ${theme.accent}35`, borderRadius: '4px', padding: '3px 10px' }}>{n}</span>)}
              </div>
              <h1 style={{ fontSize: 'clamp(42px, 7vw, 72px)', fontWeight: 800, color: theme.text, lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: '16px' }}>{displayCreator.pseudo}</h1>
              {showHeroPositioningLine && <p style={{ fontSize: '13px', color: theme.accent, lineHeight: 1.55, maxWidth: '480px', marginBottom: '10px', fontWeight: 600, letterSpacing: '0.01em' }}>{effectivePositioningPhrase}</p>}
              {heroBodyLine && <p style={{ fontSize: '16px', color: theme.subtext, lineHeight: 1.75, maxWidth: '480px', borderLeft: `3px solid ${theme.accent}`, paddingLeft: '16px' }}>{heroBodyLine}</p>}
            </div>
            <div style={{ width: '110px', height: '130px', borderRadius: '12px', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', flexShrink: 0, boxShadow: `0 8px 32px ${theme.accent}40` }}>{displayCreator.avatar_initials}</div>
          </div>
          {platformBadges.length > 0 && <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>{platformBadges.map(b => <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: b.color, background: 'transparent', border: `1px solid ${b.color}40`, borderRadius: '9999px', padding: '3px 10px' }}><PlatformLogo id={b.id} color={b.color} size={12} />{b.label}</span>)}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '14px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 150ms ease' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>Proposer un partenariat →</button>
            {safeCalendlyUrl(calendlyUrl) && <a href={safeCalendlyUrl(calendlyUrl)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'transparent', color: theme.accent, border: `2px solid ${theme.accent}`, borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', transition: 'all 150ms ease' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${theme.accent}12` }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Réserver un appel</a>}
          </div>
          <p style={{ marginTop: '14px', fontSize: '11px', color: mutedText }}>Propulsé par <span style={{ color: '#16a34a', fontWeight: 600 }}>Sponsorable</span></p>
        </div>
      </section>
    )

    if (isMono) return (
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '40px', alignItems: 'start', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {displayCreator.niches.map((n: string) => <span key={n} style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '3px', padding: '3px 10px' }}>{n}</span>)}
              </div>
              <h1 style={{ fontSize: 'clamp(44px, 7vw, 76px)', fontWeight: 800, color: '#ffffff', lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: '20px' }}>{displayCreator.pseudo}</h1>
              <div style={{ width: '40px', height: '2px', background: 'rgba(255,255,255,0.25)', marginBottom: '16px' }} />
              {showHeroPositioningLine && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, maxWidth: '380px', marginBottom: '10px', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{effectivePositioningPhrase}</p>}
              {heroBodyLine && <p style={{ fontSize: '15px', color: '#858685', lineHeight: 1.70, maxWidth: '420px' }}>{heroBodyLine}</p>}
            </div>
            <div style={{ width: '120px', height: '140px', borderRadius: '6px', background: 'linear-gradient(145deg, #2a2a2a, #111)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', flexShrink: 0 }}>{displayCreator.avatar_initials}</div>
          </div>
          {platformBadges.length > 0 && <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>{platformBadges.map(b => <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 600, color: b.color, background: 'transparent', border: `1px solid ${b.color}40`, borderRadius: '3px', padding: '3px 10px' }}><PlatformLogo id={b.id} color={b.color} size={11} />{b.label}</span>)}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#ffffff', color: '#0c0c0c', border: 'none', borderRadius: '4px', padding: '14px 28px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', transition: 'opacity 150ms ease' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>Proposer un partenariat →</button>
            {safeCalendlyUrl(calendlyUrl) && <a href={safeCalendlyUrl(calendlyUrl)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'transparent', color: '#ffffff', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '4px', padding: '12px 24px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none', transition: 'all 150ms ease' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.7)' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)' }}>Réserver un appel</a>}
          </div>
          <p style={{ marginTop: '14px', fontSize: '11px', color: 'rgba(255,255,255,0.20)' }}>Propulsé par <span style={{ color: '#16a34a', fontWeight: 600 }}>Sponsorable</span></p>
        </div>
      </section>
    )

    // Default / Esport
    return (
      <section style={{ position: 'relative', paddingTop: '80px', paddingBottom: '64px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-20%', left: '-5%', width: '65%', height: '90%', borderRadius: '60% 40% 55% 45% / 50% 65% 35% 50%', background: `radial-gradient(ellipse, ${isDark ? theme.accent + '70' : theme.accent + '55'} 0%, transparent 65%)`, filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', top: '5%', right: '-10%', width: '60%', height: '80%', borderRadius: '40% 60% 45% 55% / 60% 40% 60% 40%', background: `radial-gradient(ellipse, ${isDark ? theme.accent + '58' : theme.accent + '44'} 0%, transparent 65%)`, filter: 'blur(50px)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px' }}>
          <div style={{ position: 'relative', width: '96px', height: '96px', margin: '0 auto 20px' }}>
            <div style={{ position: 'absolute', inset: '-3px', borderRadius: '50%', background: `conic-gradient(${theme.accent}, ${theme.accent}80, ${theme.accent})`, zIndex: 0 }} />
            <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accent}dd 0%, ${theme.accent} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: btnTextColor, fontSize: '30px', fontWeight: 800, zIndex: 1, boxShadow: `0 8px 32px ${theme.accent}50, 0 0 0 3px ${theme.bg}` }}>{displayCreator.avatar_initials}</div>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: theme.text, marginBottom: '10px', letterSpacing: '-0.02em' }}>{displayCreator.pseudo}</h1>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
            {displayCreator.niches.map((n: string) => <span key={n} style={{ background: `${theme.accent}18`, color: theme.accent, border: `1px solid ${theme.accent}35`, borderRadius: '4px', padding: '4px 12px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{n}</span>)}
          </div>
          {showHeroPositioningLine && <p style={{ fontSize: '13px', color: theme.accent, maxWidth: '400px', margin: '0 auto 6px', lineHeight: 1.5, fontWeight: 600 }}>{effectivePositioningPhrase}</p>}
          {heroBodyLine && <p style={{ fontSize: '16px', color: theme.subtext, maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.7 }}>{heroBodyLine}</p>}
          {platformBadges.length > 0 && <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>{platformBadges.map(b => <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: b.color, background: 'transparent', border: `1px solid ${b.color}40`, borderRadius: '9999px', padding: '3px 10px' }}><PlatformLogo id={b.id} color={b.color} size={12} />{b.label}</span>)}</div>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: theme.accent, color: btnTextColor, border: 'none', borderRadius: '9999px', padding: '14px 28px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 150ms ease' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>Proposer un partenariat →</button>
            {safeCalendlyUrl(calendlyUrl) && <a href={safeCalendlyUrl(calendlyUrl)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'transparent', color: theme.accent, border: `2px solid ${theme.accent}60`, borderRadius: '9999px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', transition: 'all 150ms ease' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${theme.accent}12` }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Réserver un appel</a>}
          </div>
          <p style={{ marginTop: '16px', fontSize: '11px', color: mutedText }}>Propulsé par <span style={{ color: '#16a34a', fontWeight: 600 }}>Sponsorable</span></p>
        </div>
      </section>
    )
  }

  /* ── Contact form ──────────────────────────────────────── */
  const renderContact = () => (
    <section id="contact-form" style={{ padding: '0 24px 96px', background: theme.bg }} key="contact">
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ background: theme.cardBg, borderRadius: '12px', padding: '40px', border: `1px solid ${theme.border}` }}>
          {sent ? (
            <div role="alert" style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `${theme.accent}30`, border: `2px solid ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px', color: theme.accent }}>✓</div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: theme.text, marginBottom: '10px' }}>Proposition envoyée !</h2>
              <p style={{ fontSize: '15px', color: theme.subtext, lineHeight: 1.6 }}>{displayCreator.pseudo} traite les demandes sous 48h. Vous recevrez une réponse par email.</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: theme.text, marginBottom: '8px', letterSpacing: '-0.02em' }}>Proposer un partenariat</h2>
              <p style={{ fontSize: '14px', color: mutedText, marginBottom: '4px' }}>Réponse sous 48h · Traité personnellement par {displayCreator.pseudo}</p>
              <p style={{ fontSize: '13px', color: mutedText, marginBottom: '28px', opacity: 0.8 }}>Décrivez votre besoin, la demande est transmise directement au créateur.</p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
                <div><label htmlFor="c-company" style={labelStyle}>Entreprise / marque</label><input id="c-company" required placeholder="NordVPN, Corsair…" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} /></div>
                <div>
                  <label htmlFor="c-budget" style={labelStyle}>Budget estimé</label>
                  <select id="c-budget" required value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} style={{ ...inputStyle, cursor: 'pointer', colorScheme: isDark ? 'dark' : 'light' }} onFocus={focusStyle} onBlur={blurStyle}>
                    <option value="">Sélectionner…</option>
                    <option>Moins de 300€</option><option>300€ – 800€</option><option>800€ – 2 000€</option><option>2 000€ – 5 000€</option><option>5 000€+</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="c-type" style={labelStyle}>Type de collaboration</label>
                  <select id="c-type" required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer', colorScheme: isDark ? 'dark' : 'light' }} onFocus={focusStyle} onBlur={blurStyle}>
                    <option value="">Sélectionner…</option>
                    {(effectiveFormats.length > 0 ? [...effectiveFormats, 'Autre'] : ['Intégration vidéo YouTube', 'Sponsoring stream Twitch', 'Pack réseaux sociaux', 'Ambassadeur longue durée', 'Autre']).map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label htmlFor="c-msg" style={labelStyle}>Message</label><textarea id="c-msg" required rows={4} placeholder={`Bonjour ${displayCreator.pseudo}, je représente… et je souhaite vous proposer…`} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} onFocus={focusStyle} onBlur={blurStyle} /></div>
                {submitError && <p style={{ fontSize: '13px', color: '#ef4444', textAlign: 'center', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px' }}>{submitError}</p>}
                <button type="submit" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: theme.accent, color: btnTextColor, border: 'none', borderRadius: '9999px', padding: '14px 28px', fontSize: '15px', fontWeight: 600, width: '100%', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1, transition: 'opacity 150ms ease' }} onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.opacity = '0.85' }} onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLElement).style.opacity = '1' }}>{submitting ? 'Envoi en cours…' : 'Envoyer la proposition →'}</button>
              </form>
            </>
          )}

          {socialLinks.length > 0 && (
            <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: `1px solid ${theme.border}` }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: theme.subtext, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px', textAlign: 'center' }}>Retrouve-moi sur</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                {socialLinks.map(({ id, label, handle, url, color }) => (
                  <a key={id} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: isDark ? 'rgba(255,255,255,0.06)' : 'white', textDecoration: 'none', transition: 'all 150ms ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.border; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                    <PlatformLogo id={id} color={color} size={16} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>{handle}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="pdf-qr-block" style={{ display: 'none', alignItems: 'center', gap: '16px', marginTop: '28px', paddingTop: '24px', borderTop: `1px solid ${theme.border}` }}>
            <QRCodeSVG value={typeof window !== 'undefined' ? window.location.href.split('?')[0] : ''} size={80} bgColor="transparent" fgColor={isDark ? '#ffffff' : '#0f172a'} level="M" />
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: theme.text, marginBottom: '2px' }}>Scanne pour accéder au media kit en ligne</p>
              <p style={{ fontSize: '10px', color: theme.subtext }}>Tous les liens sont cliquables sur la version web</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div style={{ background: theme.bg, minHeight: '100vh' }}>
      <style>{`
        select#c-budget option, select#c-type option { background: ${isDark ? '#1e293b' : '#ffffff'}; color: ${isDark ? '#f1f5f9' : '#0f172a'}; }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @media print {
          @page { margin: 10mm 10mm; size: A4; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; max-width: none !important; box-sizing: border-box !important; overflow: visible !important; }
          html, body { height: auto !important; }
          #sticky-cta { display: none !important; }
          #contact-form { display: none !important; }
          footer[role="contentinfo"] { display: none !important; }
          .pdf-export-date { display: block !important; text-align: right; font-size: 10px; color: #cbd5e1; padding: 8px 0 0; border-top: 1px solid #e2e8f0; margin-top: 8px; }
        }
        .pdf-export-date { display: none; }
        .pdf-qr-block { display: none; }
        @media print { .pdf-qr-block { display: flex !important; } }
      `}</style>

      {safeUrl(bannerUrl) && (
        <div style={{ width: '100%', aspectRatio: '1546 / 423', overflow: 'hidden', maxHeight: '420px' }}>
          <img src={safeUrl(bannerUrl)} alt="Bannière" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
        </div>
      )}

      {renderHero()}

      {/* Sections ordonnées par stratégie */}
      <div style={{ paddingTop: '64px' }}>
        {sectionOrder.map(key => sectionMap[key])}
      </div>

      {renderContact()}

      {/* Sticky CTA */}
      <div id="sticky-cta" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50, transition: 'opacity 250ms ease, transform 250ms ease', opacity: stickyVisible ? 1 : 0, transform: stickyVisible ? 'translateY(0)' : 'translateY(12px)', pointerEvents: stickyVisible ? 'auto' : 'none' }}>
        <button onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${theme.accent}e0`, color: btnTextColor, border: 'none', borderRadius: '9999px', padding: '11px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 12px ${theme.accent}38`, whiteSpace: 'nowrap', transition: 'opacity 150ms ease, box-shadow 150ms ease' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
          Proposer un partenariat →
        </button>
      </div>

      <footer role="contentinfo" style={{ padding: '24px', textAlign: 'center', color: mutedText, fontSize: '12px', borderTop: `1px solid ${theme.border}` }}>
        Media kit généré par <span style={{ color: '#16a34a', fontWeight: 600 }}>Sponsorable</span>
        {effectiveLastFetched && <span style={{ display: 'block', fontSize: '11px', color: mutedText, marginTop: '4px', opacity: 0.6 }}>Dernière synchronisation {timeSince(effectiveLastFetched)}</span>}
        <span className="pdf-export-date">Exporté le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </footer>
    </div>
  )
}

export default PublicMediaKitPage
