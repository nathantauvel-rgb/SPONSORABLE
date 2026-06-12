'use client'

import { Lock, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

// ─── Design system ─────────────────────────────────────────────────────────────
const BG = '#0d0d0f'
const SURFACE = '#111318'
const CARD = '#1c1f26'
const ACCENT = '#22c55e'
const TEXT = '#ffffff'
const MUTED = '#888888'
const BORDER = '#222222'
const AMBER = '#d97706'
const SYNE = 'var(--font-syne), system-ui, sans-serif'
const DISPLAY = 'var(--font-display), system-ui, sans-serif'
const NUM = '"Martian Mono", var(--font-num), ui-monospace, monospace'

// ─── Types ────────────────────────────────────────────────────────────────────

type PlatformStats = {
  subscriberCount?: string | number
  videoCount?: string | number
  viewCount?: string | number
  followerCount?: string | number
  avgViewerCount?: string | number
  engagementRate?: number
  avgViewsPerVideo?: number
  avgVodViews?: number
  recentVideos?: unknown[]
  recentStreams?: unknown[]
  topClips?: unknown[]
}
type PlatformData = { type: string; stats: PlatformStats | null }

type ProfileData = {
  bio?: string | null
  niche?: string | null
  formats?: string[] | null
  positioningPhrase?: string | null
  country?: string | null
  languages?: string[] | null
  availableForCollabs?: boolean | null
  calendlyUrl?: string | null
  targetBrands?: string | null
  displayName?: string | null
  partnerships?: unknown[] | null
}

type Dimension = {
  key: string
  label: string
  score: number
  max: number
  comment: string
}

type Priority = {
  title: string
  why: string
  gain: number
  time: string
  cta: string
  href: string
}

type CategoryTier = 'now' | 'soon' | 'later'
type BrandCategory = {
  name: string
  reason: string
  tier: CategoryTier
  missing?: string
}

// ─── Score calculation (moteur inchangé) ──────────────────────────────────────

function calcScoreDetailed(platforms: PlatformData[], profile: ProfileData): {
  total: number
  dimensions: Dimension[]
  ytSubs: number
  twFollowers: number
  totalAudience: number
  profileCompleteness: number
} {
  const yt = platforms.find(p => p.type === 'youtube')
  const tw = platforms.find(p => p.type === 'twitch')

  const ytSubs = parseInt(String(yt?.stats?.subscriberCount ?? '0')) || 0
  const twFollowers = parseInt(String(tw?.stats?.followerCount ?? '0')) || 0
  const totalAudience = ytSubs + twFollowers

  // 1. Complétude du profil (22 pts)
  let profileScore = 0
  const profileComments: string[] = []
  const hasBio = (profile.bio ?? '').length > 20
  const hasNiche = (profile.niche ?? '').length > 0
  const hasFormats = (profile.formats ?? []).length > 0
  const hasPositioning = (profile.positioningPhrase ?? '').length > 0
  const hasCountry = !!(profile.country)
  const hasLanguages = (profile.languages ?? []).length > 0

  if (hasBio) profileScore += 6; else profileComments.push('bio')
  if (hasNiche) profileScore += 6; else profileComments.push('niche')
  if (hasFormats) profileScore += 4; else profileComments.push('formats')
  if (hasPositioning) profileScore += 4; else profileComments.push('phrase de positionnement')
  if (hasCountry || hasLanguages) profileScore += 2

  const completenessItems = [hasBio, hasNiche, hasFormats, hasPositioning, hasCountry || hasLanguages]
  const completedCount = completenessItems.filter(Boolean).length
  const profileCompleteness = Math.round((completedCount / completenessItems.length) * 100)

  const profileDimComment = profileComments.length === 0
    ? 'Profil complet — bon signal pour les marques'
    : profileComments.length <= 2
      ? `Manque : ${profileComments.join(', ')}`
      : 'Plusieurs éléments clés encore vides'

  // 2. Présence plateforme (15 pts)
  let platformScore = 0
  const ytConnected = !!yt
  const twConnected = !!tw
  if (ytConnected) platformScore += 6
  if (twConnected) platformScore += 6
  if (ytConnected && twConnected) platformScore += 3

  const platformComment = ytConnected && twConnected
    ? 'Multi-plateforme vérifiée via OAuth'
    : ytConnected ? 'YouTube connecté — Twitch renforcerait le profil'
    : twConnected ? 'Twitch connecté — YouTube renforcerait le profil'
    : 'Aucune stat vérifiée disponible'

  // 3. Taille d'audience (13 pts)
  let audienceScore = 0
  if (totalAudience >= 500000) audienceScore = 13
  else if (totalAudience >= 100000) audienceScore = 11
  else if (totalAudience >= 50000) audienceScore = 9
  else if (totalAudience >= 10000) audienceScore = 7
  else if (totalAudience >= 5000) audienceScore = 5
  else if (totalAudience >= 1000) audienceScore = 3
  else if (totalAudience >= 100) audienceScore = 1

  const audienceComment = totalAudience >= 10000
    ? 'Audience solide — dans les radars des marques gaming'
    : totalAudience >= 1000
      ? 'Audience en croissance — premières opportunités jouables'
      : totalAudience > 0
        ? 'Audience petite — l\'affiliation reste accessible'
        : 'Pas de données d\'audience'

  // 4. Activité & régularité (20 pts) — la régularité prouve un partenaire fiable
  let activityScore = 0
  const videoCount = yt?.stats?.recentVideos?.length ?? 0
  const streamCount = tw?.stats?.recentStreams?.length ?? 0
  const hasRecentVideos = videoCount > 0
  const hasRecentStreams = streamCount > 0
  const hasClips = (tw?.stats?.topClips?.length ?? 0) > 0
  const hasPartnerships = (profile.partnerships ?? []).length > 0
  // Plusieurs contenus récents (régularité) valent mieux qu'un seul
  if (videoCount >= 3) activityScore += 6; else if (hasRecentVideos) activityScore += 4
  if (streamCount >= 3) activityScore += 5; else if (hasRecentStreams) activityScore += 3
  if (hasClips) activityScore += 3
  if (hasPartnerships) activityScore += 3
  // Présence de contenu sur les deux plateformes
  if (hasRecentVideos && hasRecentStreams) activityScore += 3
  activityScore = Math.min(20, activityScore)

  const activityComment = activityScore >= 14
    ? 'Contenu régulier visible — bon indicateur d\'activité'
    : activityScore >= 7
      ? 'Contenu récent présent — la régularité peut être plus visible'
      : (ytConnected || twConnected)
        ? 'Peu de contenu récent — les marques attendent des preuves d\'activité'
        : 'Connecte une plateforme pour rendre ton contenu visible'

  // 5. Engagement & qualité d'audience (25 pts) — le vrai levier de négociation.
  // On mesure la QUALITÉ de l'engagement via des ratios réels, indépendamment de
  // la taille : un créateur établi qui se sous-vend a souvent un engagement fort.
  const platformQualities: number[] = []

  // YouTube : taux d'engagement réel, sinon estimation vues/abonné (reach)
  if (ytConnected) {
    let q: number
    if (yt?.stats?.engagementRate) {
      q = Math.min(1, Number(yt.stats.engagementRate) / 8) // 8 %+ = excellent
    } else if (yt?.stats?.viewCount && yt?.stats?.videoCount && ytSubs > 0) {
      const views = parseInt(String(yt.stats.viewCount)) || 0
      const videos = parseInt(String(yt.stats.videoCount)) || 1
      const avgViews = yt.stats.avgViewsPerVideo ? Number(yt.stats.avgViewsPerVideo) : views / videos
      const reachRate = (avgViews / ytSubs) * 100
      q = Math.min(1, reachRate / 12) // 12 % de vues/abonné = excellent
    } else {
      q = 0.3 // connecté mais données insuffisantes
    }
    platformQualities.push(q)
  }

  // Twitch : spectateurs moyens / followers (concurrence live réelle)
  if (twConnected) {
    let q: number
    if (tw?.stats?.avgVodViews && twFollowers > 0) {
      const liveRate = (Number(tw.stats.avgVodViews) / twFollowers) * 100
      q = Math.min(1, liveRate / 8) // 8 % d'audience live/followers = excellent
    } else {
      q = 0.3
    }
    platformQualities.push(q)
  }

  // On prend la MEILLEURE qualité (un créateur fort sur une seule plateforme n'est
  // pas pénalisé — la présence multi-plateforme est déjà notée ailleurs) + bonus multi.
  const bestQuality = platformQualities.length ? Math.max(...platformQualities) : 0
  let engagementScore = Math.round(bestQuality * 23 + (platformQualities.length > 1 ? 2 : 0))
  engagementScore = Math.min(25, engagementScore)

  const engagementComment = engagementScore >= 18
    ? 'Engagement excellent — ton meilleur argument de négo'
    : engagementScore >= 10
      ? 'Engagement correct — le levier qui justifie tes tarifs'
      : (ytConnected || twConnected)
        ? 'Engagement non démontré — il compte plus que la taille pour négocier'
        : 'Pas de données d\'engagement'

  // 6. Sponsor readiness (5 pts)
  let readinessScore = 0
  if (profile.availableForCollabs) readinessScore += 2
  if (profile.calendlyUrl) readinessScore += 2
  if (profile.targetBrands) readinessScore += 1

  const readinessComment = readinessScore >= 4
    ? 'Contact facile — profil opérationnel'
    : readinessScore >= 2
      ? 'Prise de contact partiellement en place'
      : 'Ni disponibilité ni lien de contact renseignés'

  const dimensions: Dimension[] = [
    { key: 'profile', label: 'Complétude du profil', score: profileScore, max: 22, comment: profileDimComment },
    { key: 'platform', label: 'Présence plateforme', score: platformScore, max: 15, comment: platformComment },
    { key: 'audience', label: 'Taille d\'audience', score: audienceScore, max: 13, comment: audienceComment },
    { key: 'activity', label: 'Activité & régularité', score: activityScore, max: 20, comment: activityComment },
    { key: 'engagement', label: 'Engagement', score: engagementScore, max: 25, comment: engagementComment },
    { key: 'readiness', label: 'Disponibilité sponsor', score: readinessScore, max: 5, comment: readinessComment },
  ]

  const total = Math.min(100, dimensions.reduce((acc, d) => acc + d.score, 0))

  return { total, dimensions, ytSubs, twFollowers, totalAudience, profileCompleteness }
}

// ─── Verdict opérationnel ──────────────────────────────────────────────────────

type Verdict = { status: string; color: string; verdict: string }

function getVerdict(score: number): Verdict {
  if (score >= 76) return {
    status: 'Prêt pour le premium',
    color: '#16a34a',
    verdict: 'Tu peux viser des marques premium et des deals récurrents.',
  }
  if (score >= 51) return {
    status: 'Sponsor-ready',
    color: '#0284c7',
    verdict: 'Prêt à répondre aux demandes entrantes — et à démarcher.',
  }
  if (score >= 26) return {
    status: 'En construction',
    color: AMBER,
    verdict: 'Pas encore prêt pour démarcher à froid. L\'affiliation reste jouable.',
  }
  return {
    status: 'À structurer',
    color: '#64748b',
    verdict: 'Les marques n\'ont pas encore assez de signaux pour te prendre au sérieux.',
  }
}

// Frein n°1 : la dimension où il manque le plus de points — en version chip (2-3 mots)
const BLOCKER_SHORT: Record<string, string> = {
  profile: 'Profil incomplet',
  platform: 'Stats non vérifiées',
  audience: 'Audience petite',
  activity: 'Activité non visible',
  engagement: 'Engagement à prouver',
  readiness: 'Contact difficile',
}

function getMainBlocker(dimensions: Dimension[]): { short: string; missing: number } | null {
  const sorted = [...dimensions].sort((a, b) => (b.max - b.score) - (a.max - a.score))
  const top = sorted[0]
  if (!top || top.max - top.score <= 2) return null
  return { short: BLOCKER_SHORT[top.key] ?? top.label, missing: top.max - top.score }
}

// ─── Paliers ───────────────────────────────────────────────────────────────────

const TIERS = [
  { min: 26, label: 'En construction', unlocks: 'l\'affiliation et les premières catégories de marques' },
  { min: 51, label: 'Sponsor-ready', unlocks: 'les demandes entrantes sérieuses et le démarchage ciblé' },
  { min: 76, label: 'Premium', unlocks: 'les marques premium et les partenariats récurrents' },
]

function getNextTier(score: number) {
  return TIERS.find(t => score < t.min) ?? null
}

// ─── Étapes du plan (priorités actionnables) ───────────────────────────────────

function buildPriorities(platforms: PlatformData[], profile: ProfileData): Priority[] {
  const yt = platforms.find(p => p.type === 'youtube')
  const tw = platforms.find(p => p.type === 'twitch')
  const priorities: Priority[] = []

  if (!yt) priorities.push({
    title: 'Connecte YouTube',
    why: 'Le signal de confiance n°1 des marques gaming.',
    gain: 8, time: '2 min', cta: 'Connecter', href: '/dashboard',
  })
  if (!tw) priorities.push({
    title: 'Connecte Twitch',
    why: 'Prouve une activité live, vérifiée via OAuth.',
    gain: 8, time: '2 min', cta: 'Connecter', href: '/dashboard',
  })
  if (!(profile.niche ?? '').length) priorities.push({
    title: 'Définis ta niche',
    why: 'Sans niche, les marques ne savent pas où te ranger.',
    gain: 5, time: '1 min', cta: 'Définir', href: '/dashboard/mediakit',
  })
  if (!(profile.positioningPhrase ?? '').length) priorities.push({
    title: 'Écris ta phrase de positionnement',
    why: 'C\'est la première phrase qu\'une marque lit sur toi.',
    gain: 4, time: '5 min', cta: 'Rédiger', href: '/dashboard/mediakit',
  })
  if ((profile.bio ?? '').length < 50) priorities.push({
    title: 'Complète ta bio',
    why: 'Un profil vide se négocie mal.',
    gain: 5, time: '5 min', cta: 'Compléter', href: '/dashboard/mediakit',
  })

  const hasContent = (yt?.stats?.recentVideos?.length ?? 0) > 0 || (tw?.stats?.recentStreams?.length ?? 0) > 0
  if (!hasContent && (yt || tw)) priorities.push({
    title: 'Rends ton contenu récent visible',
    why: 'Les marques veulent des preuves d\'activité avant de payer.',
    gain: 6, time: '10 min', cta: 'Gérer', href: '/dashboard/mediakit',
  })
  if (!(profile.formats ?? []).length) priorities.push({
    title: 'Choisis tes formats de collab',
    why: 'Aide une marque à te faire une offre adaptée du premier coup.',
    gain: 4, time: '1 min', cta: 'Choisir', href: '/dashboard/mediakit',
  })
  if (!(profile.partnerships ?? []).length) priorities.push({
    title: 'Ajoute tes partenariats passés',
    why: 'Des références réduisent le risque perçu par la marque.',
    gain: 3, time: '5 min', cta: 'Ajouter', href: '/dashboard/mediakit',
  })
  if (!profile.availableForCollabs) priorities.push({
    title: 'Active ta disponibilité',
    why: 'Signale que tu es ouvert aux deals — effet immédiat.',
    gain: 2, time: '30 s', cta: 'Activer', href: '/dashboard/mediakit',
  })
  if (!profile.calendlyUrl) priorities.push({
    title: 'Ajoute un lien Calendly',
    why: 'Réduit la friction entre « intéressée » et « en call ».',
    gain: 2, time: '2 min', cta: 'Ajouter', href: '/dashboard/mediakit',
  })

  return priorities.slice(0, 3)
}

// ─── Opportunités sponsor en 3 tiers ───────────────────────────────────────────

const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n)

function getBrandCategories(totalAudience: number, score: number): BrandCategory[] {
  const all: { name: string; reason: string; minAudience: number }[] = [
    { name: 'Affiliation logiciel & outils', reason: 'VPN, outils créateur — ouvert dès les premières centaines d\'abonnés.', minAudience: 0 },
    { name: 'Energy drink & nutrition', reason: 'Programmes très actifs sur le gaming, toutes tailles.', minAudience: 0 },
    { name: 'Musique libre de droits', reason: 'Epidemic Sound, Artlist — utile à tout créateur qui publie.', minAudience: 0 },
    { name: 'Communautés & plateformes', reason: 'Discord, Kick — il faut une communauté active.', minAudience: 500 },
    { name: 'Périphériques entrée de gamme', reason: 'SteelSeries, HyperX — audience gaming engagée attendue.', minAudience: 500 },
    { name: 'Streaming gear', reason: 'Elgato, Blue — souvent en dotation ou partenariat.', minAudience: 2500 },
    { name: 'Chaises & setup gaming', reason: 'Secretlab, DXRacer — courant chez les streamers installés.', minAudience: 2500 },
    { name: 'Jeux service live & MMORPG', reason: 'Lancements, clés, early access — courant dans le gaming FR.', minAudience: 2500 },
    { name: 'Hardware & composants', reason: 'MSI, ASUS ROG — audience technique fidèle exigée.', minAudience: 10000 },
    { name: 'Télécom & tech grand public', reason: 'Partenariats institutionnels — audience large attendue.', minAudience: 10000 },
    { name: 'VPN premium', reason: 'NordVPN, ExpressVPN — base établie exigée.', minAudience: 10000 },
  ]

  return all.map((cat): BrandCategory => {
    const audienceOk = totalAudience >= cat.minAudience
    const scoreOk = score >= 25
    if (audienceOk && scoreOk) return { name: cat.name, reason: cat.reason, tier: 'now' }
    if (audienceOk && !scoreOk) return { name: cat.name, reason: cat.reason, tier: 'soon', missing: 'score 25+ requis' }
    if (totalAudience >= cat.minAudience * 0.4) return { name: cat.name, reason: cat.reason, tier: 'soon', missing: `−${fmtK(cat.minAudience - totalAudience)} abonnés` }
    return { name: cat.name, reason: cat.reason, tier: 'later', missing: `dès ~${fmtK(cat.minAudience)} abonnés` }
  })
}

// ─── Jauge circulaire du cockpit ───────────────────────────────────────────────
// Le potentiel est un arc fantôme : on VOIT les points à prendre, on ne les lit pas.

const ScoreDial = ({ score, potential, color, animate }: { score: number; potential: number; color: string; animate: boolean }) => {
  const R = 64
  const C = 2 * Math.PI * R
  const arc = (v: number) => `${(v / 100) * C} ${C}`
  // Position d'un tick de palier sur le cercle (0 pt = en haut, sens horaire)
  const tick = (min: number) => {
    const a = (min / 100) * 2 * Math.PI - Math.PI / 2
    return {
      x1: 85 + (R - 9) * Math.cos(a), y1: 85 + (R - 9) * Math.sin(a),
      x2: 85 + (R + 9) * Math.cos(a), y2: 85 + (R + 9) * Math.sin(a),
    }
  }
  return (
    <svg width="186" height="186" viewBox="0 0 170 170" role="img" aria-label={`Score ${score} sur 100, potentiel ${potential}`}>
      <circle cx="85" cy="85" r={R} fill="none" stroke={CARD} strokeWidth="11" />
      {/* Arc fantôme : le potentiel après le plan */}
      <circle cx="85" cy="85" r={R} fill="none" stroke={ACCENT} strokeOpacity="0.28" strokeWidth="11" strokeLinecap="round"
        strokeDasharray={animate ? arc(potential) : `0 ${C}`} transform="rotate(-90 85 85)" className="sponso-arc" />
      {/* Arc du score actuel */}
      <circle cx="85" cy="85" r={R} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={animate ? arc(score) : `0 ${C}`} transform="rotate(-90 85 85)" className="sponso-arc" />
      {/* Ticks des paliers */}
      {TIERS.map(t => {
        const p = tick(t.min)
        return <line key={t.min} {...p} stroke={score >= t.min ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.16)'} strokeWidth="1.5" />
      })}
      <text x="85" y="82" textAnchor="middle" fill={TEXT} style={{ fontFamily: NUM, fontSize: '40px', fontWeight: 600, letterSpacing: '-0.04em' }}>{score}</text>
      <text x="85" y="103" textAnchor="middle" fill={MUTED} style={{ fontFamily: NUM, fontSize: '11px' }}>/100</text>
    </svg>
  )
}

// ─── Pro gate ──────────────────────────────────────────────────────────────────

const ProGate = ({ message }: { message: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', background: 'rgba(13,13,15,0.88)', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 18px', marginTop: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Lock size={13} color={MUTED} />
      <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5, fontFamily: SYNE }}>{message}</p>
    </div>
    <Link
      href="/dashboard/settings"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, fontWeight: 600, fontSize: '12px', textDecoration: 'none', flexShrink: 0, fontFamily: SYNE }}
    >
      <Zap size={12} /> Passer Pro
    </Link>
  </div>
)

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SponsorsPage() {
  const [pro, setPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scoreResult, setScoreResult] = useState<ReturnType<typeof calcScoreDetailed> | null>(null)
  const [profileData, setProfileData] = useState<ProfileData>({})
  const [platforms, setPlatforms] = useState<PlatformData[]>([])
  const [barsIn, setBarsIn] = useState(false) // déclenche jauge + barres animées
  const [showBilan, setShowBilan] = useState(false) // détail chiffré en lecture optionnelle
  const [openOpp, setOpenOpp] = useState<string | null>(null) // ligne d'opportunité dépliée

  useEffect(() => {
    Promise.all([
      fetch('/api/me').then(r => r.ok ? r.json() : null),
      fetch('/api/profile').then(r => r.ok ? r.json() : null),
    ]).then(([meData, profData]) => {
      setPro(meData?.isPro ?? false)
      const plats: PlatformData[] = (meData?.platforms ?? []).map((p: PlatformData) => ({
        type: p.type,
        stats: p.stats as PlatformStats | null,
      }))
      setPlatforms(plats)
      const prof: ProfileData = profData?.profile ?? {}
      setProfileData(prof)
      setScoreResult(calcScoreDetailed(plats, prof))
      requestAnimationFrame(() => requestAnimationFrame(() => setBarsIn(true)))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const hasPlatforms = platforms.length > 0
  const total = scoreResult?.total ?? 0
  const verdict = scoreResult ? getVerdict(total) : null
  const priorities = scoreResult ? buildPriorities(platforms, profileData) : []
  const potential = Math.min(100, total + priorities.reduce((acc, p) => acc + p.gain, 0))
  const blocker = scoreResult ? getMainBlocker(scoreResult.dimensions) : null
  const nextTier = getNextTier(total)
  const categories = scoreResult ? getBrandCategories(scoreResult.totalAudience, total) : []
  const dimensions = scoreResult?.dimensions ?? []
  const strengths = [...dimensions].filter(d => d.score / d.max >= 0.6).sort((a, b) => b.score / b.max - a.score / a.max).slice(0, 3)
  const weaknesses = [...dimensions].filter(d => d.score / d.max < 0.6).sort((a, b) => (b.max - b.score) - (a.max - a.score)).slice(0, 3)

  const catNow = categories.filter(c => c.tier === 'now').slice(0, 4)
  const catSoon = categories.filter(c => c.tier === 'soon').slice(0, 3)
  const catLater = categories.filter(c => c.tier === 'later').slice(0, 3)

  const fmtNum = (n: number) => n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
    : String(n)

  // Segments cumulés de la barre de plan : chaque étape empile son gain sur le score
  const planSegments = (() => {
    let cursor = total
    return priorities.map((p, i) => {
      const start = cursor
      const width = Math.min(100, cursor + p.gain) - cursor
      cursor += p.gain
      return { start, width, opacity: 0.95 - i * 0.28 }
    })
  })()

  const block: React.CSSProperties = { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '28px', marginBottom: '48px' }
  const chipLabel: React.CSSProperties = { fontFamily: NUM, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '5px' }
  const chipValue: React.CSSProperties = { fontFamily: SYNE, fontSize: '14px', fontWeight: 700, color: TEXT, lineHeight: 1.3 }

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: SYNE }}>
      <Sidebar />
      <main className="dash-main" style={{ marginLeft: '240px', padding: '40px 48px', maxWidth: '1100px' }}>

        {/* Bandeau Pro */}
        {!loading && !pro && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '12px 18px', marginBottom: '24px', color: TEXT }}>
            <p style={{ fontSize: '13px', color: MUTED, fontFamily: SYNE }}>
              <span style={{ color: TEXT, fontWeight: 600 }}>Verdict et première étape gratuits.</span> Le plan de progression complet est réservé au Pro.
            </p>
            <Link href="/dashboard/settings" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: ACCENT, color: '#000000', fontWeight: 700, fontSize: '13px', textDecoration: 'none', flexShrink: 0, fontFamily: SYNE }}>
              <Zap size={13} /> Passer Pro
            </Link>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: TEXT, marginBottom: '8px', letterSpacing: '-0.02em', fontFamily: DISPLAY }}>Sponsorabilité</h1>
          <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, fontFamily: SYNE, display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
            <Lock size={11} style={{ flexShrink: 0 }} />
            Ton coach privé de préparation sponsor. Invisible pour les marques.
          </p>
        </div>

        {loading ? (
          <div style={{ ...block, padding: '60px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: MUTED, fontFamily: SYNE }}>Calcul en cours…</p>
          </div>
        ) : !hasPlatforms ? (
          <div style={{ ...block, padding: '60px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: TEXT, marginBottom: '8px', fontFamily: SYNE }}>Connecte au moins une plateforme pour commencer</p>
            <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 24px', fontFamily: SYNE }}>
              Ton verdict sponsor se calcule à partir de tes statistiques YouTube ou Twitch vérifiées.
            </p>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', background: ACCENT, color: '#000000', fontWeight: 600, fontSize: '14px', textDecoration: 'none', fontFamily: SYNE }}>
              Connecter mes plateformes
            </Link>
            {scoreResult && total > 0 && (
              <p style={{ fontSize: '12px', color: MUTED, marginTop: '20px', fontFamily: SYNE }}>
                Score partiel basé sur ton profil éditorial : {total}/100
              </p>
            )}
          </div>
        ) : (
          <>
            {/* ══ COCKPIT ═══════════════════════════════════════════════════
                5 secondes : jauge (score + potentiel + paliers), verdict,
                3 chips Frein / Potentiel / Cap. Zéro paragraphe. */}
            <div style={{ ...block, padding: '30px 32px' }}>
              <div className="sponso-cockpit">
                <ScoreDial score={total} potential={potential} color={verdict?.color ?? ACCENT} animate={barsIn} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                  {verdict && (
                    <span style={{ alignSelf: 'flex-start', padding: '4px 12px', borderRadius: '5px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: verdict.color, background: `${verdict.color}1c`, border: `1px solid ${verdict.color}40`, fontFamily: SYNE }}>
                      {verdict.status}
                    </span>
                  )}
                  <p style={{ fontSize: 'clamp(19px, 2.4vw, 24px)', fontWeight: 700, color: TEXT, lineHeight: 1.35, letterSpacing: '-0.01em', fontFamily: DISPLAY, maxWidth: '560px' }}>
                    {verdict?.verdict}
                  </p>

                  {/* Les 3 chips : frein, potentiel, cap */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {blocker && (
                      <div style={{ background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: '8px', padding: '10px 14px', minWidth: '130px' }}>
                        <p style={{ ...chipLabel, color: AMBER }}>Frein n°1</p>
                        <p style={chipValue}>{blocker.short}</p>
                      </div>
                    )}
                    {potential > total && (
                      <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.28)', borderRadius: '8px', padding: '10px 14px', minWidth: '130px' }}>
                        <p style={{ ...chipLabel, color: ACCENT }}>Potentiel proche</p>
                        <p style={chipValue}>
                          <span style={{ fontFamily: NUM }}>{potential}</span>
                          <span style={{ color: ACCENT, fontFamily: NUM, fontSize: '12px', marginLeft: '7px' }}>+{potential - total} pts</span>
                        </p>
                      </div>
                    )}
                    {nextTier && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px', minWidth: '130px' }}>
                        <p style={{ ...chipLabel, color: MUTED }}>Cap</p>
                        <p style={chipValue}>
                          {nextTier.label}
                          <span style={{ color: MUTED, fontFamily: NUM, fontSize: '12px', marginLeft: '7px' }}>à {nextTier.min - total} pts</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Preuve de personnalisation : la feature lit TES données */}
                  <p style={{ fontFamily: NUM, fontSize: '10px', color: '#555', letterSpacing: '0.04em' }}>
                    calculé depuis tes stats vérifiées · {scoreResult && scoreResult.totalAudience > 0 ? fmtNum(scoreResult.totalAudience) : '0'} abonnés · {platforms.length}/2 plateformes · profil {scoreResult?.profileCompleteness ?? 0} %
                  </p>
                </div>
              </div>
            </div>

            {/* ══ MOTEUR DE PROGRESSION ═════════════════════════════════════
                La barre montre le plan FRANCHIR le palier. Les étapes sont
                un chemin numéroté qui se termine sur le niveau suivant. */}
            <div style={block}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, fontFamily: DISPLAY, letterSpacing: '-0.01em' }}>
                  {nextTier ? <>Ton plan vers «&nbsp;{nextTier.label}&nbsp;»</> : 'Ton plan d\'entretien'}
                </p>
                {priorities.length > 0 && (
                  <p style={{ fontFamily: NUM, fontSize: '11px', color: MUTED }}>
                    {total} <span style={{ color: ACCENT }}>→ {potential}</span> · ~{priorities.length} étape{priorities.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Barre cumulative : score + gains empilés + tick du palier */}
              {priorities.length > 0 && (
                <div style={{ marginBottom: '26px' }}>
                  <div style={{ position: 'relative', height: '8px', background: CARD, borderRadius: '9999px' }}>
                    <div className="sponso-bar" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: barsIn ? `${total}%` : '0%', background: 'rgba(255,255,255,0.28)', borderRadius: '9999px' }} />
                    {planSegments.map((s, i) => (
                      <div key={i} className="sponso-bar" style={{ position: 'absolute', top: 0, bottom: 0, left: `${s.start}%`, width: barsIn ? `${s.width}%` : '0%', background: ACCENT, opacity: s.opacity }} />
                    ))}
                    {nextTier && (
                      <div aria-hidden style={{ position: 'absolute', left: `${nextTier.min}%`, top: '-4px', width: '1.5px', height: '16px', background: 'rgba(255,255,255,0.6)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '7px', fontFamily: NUM, fontSize: '10px', color: MUTED }}>
                    <span>aujourd&apos;hui · {total}</span>
                    {nextTier && <span style={{ color: potential >= nextTier.min ? ACCENT : MUTED }}>palier {nextTier.min}{potential >= nextTier.min ? ' ✓ franchi avec ce plan' : ''}</span>}
                    <span style={{ color: ACCENT }}>{potential} avec ton plan</span>
                  </div>
                </div>
              )}

              {priorities.length === 0 ? (
                <p style={{ fontSize: '14px', color: MUTED, fontFamily: SYNE }}>
                  Rien à corriger — ton profil est optimisé. Le score progresse maintenant avec ton audience et ton engagement.
                </p>
              ) : (
                // Le chemin : nœuds connectés, étape 1 dominante, arrivée = palier
                <div style={{ position: 'relative' }}>
                  <div aria-hidden style={{ position: 'absolute', left: '17px', top: '24px', bottom: '24px', width: '1.5px', background: `linear-gradient(180deg, ${ACCENT}66, ${BORDER})` }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Étape 1 — dominante, toujours visible */}
                    {priorities[0] && (
                      <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: ACCENT, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, flexShrink: 0, fontFamily: NUM, position: 'relative', zIndex: 1, boxShadow: '0 0 0 4px rgba(34,197,94,0.15)' }}>1</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '24px' }}>
                          <div style={{ flex: 1, minWidth: '180px' }}>
                            <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, marginBottom: '3px', fontFamily: DISPLAY, letterSpacing: '-0.01em' }}>{priorities[0].title}</p>
                            <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5, fontFamily: SYNE }}>{priorities[0].why}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                            <div style={{ textAlign: 'right', fontFamily: NUM }}>
                              <p style={{ fontSize: '14px', color: ACCENT, fontWeight: 700 }}>+{priorities[0].gain} pts</p>
                              <p style={{ fontSize: '10px', color: MUTED, marginTop: '2px' }}>{priorities[0].time}</p>
                            </div>
                            <Link href={priorities[0].href} className="cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '8px', background: ACCENT, color: '#000', fontWeight: 700, fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: SYNE }}>
                              {priorities[0].cta} <span className="cta-arrow">→</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Étapes 2-3 — Pro */}
                    {pro ? priorities.slice(1).map((p, i) => (
                      <div key={p.title} style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: SURFACE, border: `1.5px solid ${BORDER}`, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0, fontFamily: NUM, position: 'relative', zIndex: 1 }}>{i + 2}</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '24px' }}>
                          <div style={{ flex: 1, minWidth: '180px' }}>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, fontFamily: SYNE }}>{p.title}</p>
                            <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5, fontFamily: SYNE, marginTop: '2px' }}>{p.why}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                            <p style={{ fontFamily: NUM, fontSize: '12px', color: ACCENT, fontWeight: 700 }}>+{p.gain} <span style={{ color: MUTED, fontWeight: 400 }}>· {p.time}</span></p>
                            <Link href={p.href} style={{ padding: '7px 14px', borderRadius: '7px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, color: TEXT, fontWeight: 600, fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: SYNE }}>
                              {p.cta}
                            </Link>
                          </div>
                        </div>
                      </div>
                    )) : priorities.length > 1 && (
                      <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: SURFACE, border: `1.5px solid ${BORDER}`, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}><Lock size={13} /></div>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <div style={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {priorities.slice(1).map((_, n) => (
                              <div key={n} style={{ height: '52px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px' }} />
                            ))}
                          </div>
                          <ProGate message="Les étapes suivantes de ton plan sont réservées au Pro." />
                        </div>
                      </div>
                    )}

                    {/* Arrivée : le palier que le plan permet d'atteindre */}
                    {nextTier && (
                      <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: SURFACE, border: `1.5px dashed ${potential >= nextTier.min ? ACCENT : BORDER}`, color: potential >= nextTier.min ? ACCENT : MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: NUM, fontSize: '11px', position: 'relative', zIndex: 1 }}>{nextTier.min}</div>
                        <p style={{ fontSize: '13px', fontFamily: SYNE, color: potential >= nextTier.min ? TEXT : MUTED }}>
                          <span style={{ fontWeight: 700 }}>Palier «&nbsp;{nextTier.label}&nbsp;»</span>
                          <span style={{ color: MUTED }}> — débloque {nextTier.unlocks}.</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ══ PIPELINE D'OPPORTUNITÉS ═══════════════════════════════════
                Compteurs en lecture immédiate, raisons au clic. */}
            {pro ? (
              <div style={block}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, fontFamily: DISPLAY, letterSpacing: '-0.01em' }}>Tes opportunités sponsor</p>
                  <div style={{ display: 'flex', gap: '16px', fontFamily: NUM, fontSize: '11px' }}>
                    <span style={{ color: ACCENT }}>{catNow.length} maintenant</span>
                    <span style={{ color: AMBER }}>{catSoon.length} bientôt</span>
                    <span style={{ color: '#555' }}>{catLater.length} plus tard</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[...catNow.map(c => ({ ...c })), ...catSoon, ...catLater].map(cat => {
                    const open = openOpp === cat.name
                    const dotColor = cat.tier === 'now' ? ACCENT : cat.tier === 'soon' ? AMBER : '#444'
                    return (
                      <div key={cat.name} style={{ border: `1px solid ${open ? (cat.tier === 'now' ? 'rgba(34,197,94,0.35)' : BORDER) : BORDER}`, borderRadius: '8px', background: cat.tier === 'now' ? 'rgba(34,197,94,0.04)' : cat.tier === 'later' ? 'transparent' : CARD, opacity: cat.tier === 'later' ? 0.6 : 1, transition: 'border-color 150ms ease' }}>
                        <button
                          onClick={() => setOpenOpp(open ? null : cat.name)}
                          aria-expanded={open}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 18px', textAlign: 'left' }}
                        >
                          <span aria-hidden style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: cat.tier === 'later' ? MUTED : TEXT, fontFamily: SYNE }}>{cat.name}</span>
                          {cat.missing && (
                            <span style={{ fontFamily: NUM, fontSize: '10px', color: cat.tier === 'soon' ? AMBER : '#555', flexShrink: 0 }}>{cat.missing}</span>
                          )}
                          {cat.tier === 'now' && (
                            <span style={{ fontFamily: NUM, fontSize: '10px', color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>à viser</span>
                          )}
                          <span aria-hidden style={{ fontFamily: NUM, fontSize: '14px', color: open ? ACCENT : '#555', transition: 'transform 200ms ease', transform: open ? 'rotate(45deg)' : 'none', flexShrink: 0, lineHeight: 1 }}>+</span>
                        </button>
                        {open && (
                          <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.6, fontFamily: SYNE, padding: '0 18px 16px 35px' }}>{cat.reason}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={block}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, fontFamily: DISPLAY, letterSpacing: '-0.01em', marginBottom: '8px' }}>Tes opportunités sponsor</p>
                <p style={{ fontSize: '12px', color: MUTED, marginBottom: '16px', fontFamily: SYNE }}>Accessible maintenant, bientôt, ou trop tôt — selon ton profil.</p>
                <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '42px', background: CARD, borderRadius: '8px' }} />)}
                  </div>
                </div>
                <ProGate message="Le pipeline d'opportunités détaillé est disponible avec le plan Pro." />
              </div>
            )}

            {/* ══ DÉTAIL DU SCORE (lecture optionnelle) ═════════════════════ */}
            {pro ? (
              <div style={block}>
                <button
                  onClick={() => setShowBilan(v => !v)}
                  aria-expanded={showBilan}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                >
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, fontFamily: DISPLAY, letterSpacing: '-0.01em' }}>Le détail de ton score</p>
                    <p style={{ fontSize: '12px', color: MUTED, marginTop: '8px', fontFamily: SYNE }}>
                      {showBilan ? 'Tes appuis, tes manques — en points.' : 'Optionnel — pour comprendre la mécanique du score.'}
                    </p>
                  </div>
                  <span aria-hidden style={{ fontFamily: NUM, fontSize: '18px', color: showBilan ? ACCENT : MUTED, transition: 'transform 240ms ease, color 240ms ease', transform: showBilan ? 'rotate(45deg)' : 'none', lineHeight: 1, flexShrink: 0 }}>+</span>
                </button>
                {showBilan && (
                <div className="sponso-2col" style={{ marginTop: '22px' }}>
                  <div>
                    <p style={{ fontFamily: NUM, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: '14px' }}>Ce qui joue pour toi</p>
                    {strengths.length === 0 ? (
                      <p style={{ fontSize: '13px', color: MUTED, fontFamily: SYNE }}>Pas encore d&apos;appui fort — ton plan est là pour ça.</p>
                    ) : strengths.map(d => (
                      <div key={d.key} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, fontFamily: SYNE }}>{d.label}</p>
                          <p style={{ fontFamily: NUM, fontSize: '11px', color: ACCENT }}>{d.score}/{d.max}</p>
                        </div>
                        <div style={{ height: '4px', background: CARD, borderRadius: '9999px', marginBottom: '6px' }}>
                          <div className="sponso-bar" style={{ height: '100%', width: barsIn ? `${(d.score / d.max) * 100}%` : '0%', background: ACCENT, borderRadius: '9999px' }} />
                        </div>
                        <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5, fontFamily: SYNE }}>{d.comment}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p style={{ fontFamily: NUM, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: AMBER, marginBottom: '14px' }}>Ce qui te freine</p>
                    {weaknesses.length === 0 ? (
                      <p style={{ fontSize: '13px', color: MUTED, fontFamily: SYNE }}>Aucun frein majeur.</p>
                    ) : weaknesses.map(d => (
                      <div key={d.key} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, fontFamily: SYNE }}>{d.label}</p>
                          <p style={{ fontFamily: NUM, fontSize: '11px', color: AMBER }}>{d.score}/{d.max}</p>
                        </div>
                        <div style={{ height: '4px', background: CARD, borderRadius: '9999px', marginBottom: '6px' }}>
                          <div className="sponso-bar" style={{ height: '100%', width: barsIn ? `${Math.max(3, (d.score / d.max) * 100)}%` : '0%', background: AMBER, borderRadius: '9999px' }} />
                        </div>
                        <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5, fontFamily: SYNE }}>{d.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
                )}
              </div>
            ) : (
              <div style={block}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, fontFamily: DISPLAY, letterSpacing: '-0.01em', marginBottom: '8px' }}>Le détail de ton score</p>
                <p style={{ fontSize: '12px', color: MUTED, marginBottom: '16px', fontFamily: SYNE }}>Les 6 dimensions qui composent ton score.</p>
                <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '48px', background: CARD, borderRadius: '6px' }} />)}
                  </div>
                </div>
                <ProGate message="Le détail des forces et des freins est réservé au plan Pro." />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
