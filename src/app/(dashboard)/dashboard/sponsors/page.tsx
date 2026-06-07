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
const SYNE = '"Syne", var(--font-syne), system-ui, sans-serif'
const DISPLAY = '"Cabinet Grotesk", var(--font-display), system-ui, sans-serif'
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
  description: string
  gain: number
  cta: string
  href: string
}

type BrandCategory = {
  name: string
  description: string
  accessible: boolean
}

type SnapshotItem = {
  label: string
  value: string
  done: boolean
}

// ─── Score calculation ─────────────────────────────────────────────────────────

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

  // 1. Complétude du profil (25 pts)
  let profileScore = 0
  let profileComments: string[] = []
  const hasBio = (profile.bio ?? '').length > 20
  const hasNiche = (profile.niche ?? '').length > 0
  const hasFormats = (profile.formats ?? []).length > 0
  const hasPositioning = (profile.positioningPhrase ?? '').length > 0
  const hasCountry = !!(profile.country)
  const hasLanguages = (profile.languages ?? []).length > 0

  if (hasBio) profileScore += 6; else profileComments.push('bio')
  if (hasNiche) profileScore += 6; else profileComments.push('niche')
  if (hasFormats) profileScore += 5; else profileComments.push('formats')
  if (hasPositioning) profileScore += 5; else profileComments.push('phrase de positionnement')
  if (hasCountry || hasLanguages) profileScore += 3

  const completenessItems = [hasBio, hasNiche, hasFormats, hasPositioning, hasCountry || hasLanguages]
  const completedCount = completenessItems.filter(Boolean).length
  const profileCompleteness = Math.round((completedCount / completenessItems.length) * 100)

  const profileDimComment = profileComments.length === 0
    ? 'Ton profil est bien renseigné — bon signal pour les marques'
    : profileComments.length <= 2
      ? `Il te manque : ${profileComments.join(', ')}`
      : 'Plusieurs éléments clés du profil sont encore vides'

  // 2. Présence plateforme (20 pts)
  let platformScore = 0
  const ytConnected = !!yt
  const twConnected = !!tw
  if (ytConnected) platformScore += 8
  if (twConnected) platformScore += 8
  if (ytConnected && twConnected) platformScore += 4

  const platformComment = ytConnected && twConnected
    ? 'Présence multi-plateforme vérifiée via OAuth'
    : ytConnected ? 'YouTube connecté — ajoute Twitch pour renforcer ton profil'
    : twConnected ? 'Twitch connecté — ajoute YouTube pour renforcer ton profil'
    : 'Aucune plateforme connectée — les marques ont besoin de stats vérifiées'

  // 3. Taille d'audience (20 pts)
  let audienceScore = 0
  if (totalAudience >= 500000) audienceScore = 20
  else if (totalAudience >= 100000) audienceScore = 17
  else if (totalAudience >= 50000) audienceScore = 14
  else if (totalAudience >= 10000) audienceScore = 10
  else if (totalAudience >= 5000) audienceScore = 7
  else if (totalAudience >= 1000) audienceScore = 4
  else if (totalAudience >= 100) audienceScore = 2

  const audienceComment = totalAudience >= 10000
    ? 'Audience solide — tu entres dans les radars des marques gaming'
    : totalAudience >= 1000
      ? 'Audience en croissance — les premières opportunités sont accessibles'
      : totalAudience > 0
        ? 'Audience encore faible — les petits programmes d\'affiliation restent accessibles'
        : 'Pas encore de données d\'audience disponibles'

  // 4. Activité & contenu (15 pts)
  let activityScore = 0
  const hasRecentVideos = (yt?.stats?.recentVideos?.length ?? 0) > 0
  const hasRecentStreams = (tw?.stats?.recentStreams?.length ?? 0) > 0
  const hasClips = (tw?.stats?.topClips?.length ?? 0) > 0
  const hasPartnerships = (profile.partnerships ?? []).length > 0
  if (hasRecentVideos) activityScore += 5
  if (hasRecentStreams) activityScore += 5
  if (hasClips) activityScore += 3
  if (hasPartnerships) activityScore += 2

  const activityComment = activityScore >= 10
    ? 'Contenu régulier visible — bon indicateur d\'activité pour les marques'
    : activityScore >= 5
      ? 'Contenu récent présent — une régularité plus visible renforcerait ton profil'
      : (ytConnected || twConnected)
        ? 'Peu de contenu récent visible — les marques attendent des preuves d\'activité'
        : 'Connecte une plateforme pour rendre ton contenu visible'

  // 5. Engagement (15 pts)
  let engagementScore = 0
  if (yt?.stats?.engagementRate) {
    const rate = Number(yt.stats.engagementRate)
    engagementScore = Math.min(10, rate >= 10 ? 10 : rate >= 5 ? 8 : rate >= 2 ? 6 : rate >= 0.5 ? 3 : 1)
  } else if (yt?.stats?.viewCount && yt?.stats?.videoCount && ytSubs > 0) {
    const views = parseInt(String(yt.stats.viewCount)) || 0
    const videos = parseInt(String(yt.stats.videoCount)) || 1
    const avgViews = views / videos
    const engRate = (avgViews / ytSubs) * 100
    engagementScore = Math.min(10, engRate >= 10 ? 10 : engRate >= 5 ? 8 : engRate >= 2 ? 6 : engRate >= 0.5 ? 3 : 1)
  } else if (ytConnected) {
    engagementScore = 3
  }
  if (tw?.stats?.avgVodViews && twFollowers > 0) {
    const avgVod = Number(tw.stats.avgVodViews)
    const twitchEng = (avgVod / twFollowers) * 100
    engagementScore = Math.min(15, engagementScore + (twitchEng >= 5 ? 5 : twitchEng >= 2 ? 3 : 1))
  } else if (twConnected) {
    engagementScore = Math.min(15, engagementScore + 2)
  }

  const engagementComment = engagementScore >= 10
    ? 'Bon taux d\'engagement — ton audience interagit activement'
    : engagementScore >= 5
      ? 'Engagement correct — des données plus détaillées permettraient une meilleure estimation'
      : (ytConnected || twConnected)
        ? 'Données d\'engagement limitées — la qualité de l\'audience prime sur la quantité'
        : 'Pas de données d\'engagement disponibles'

  // 6. Sponsor readiness (5 pts)
  let readinessScore = 0
  if (profile.availableForCollabs) readinessScore += 2
  if (profile.calendlyUrl) readinessScore += 2
  if (profile.targetBrands) readinessScore += 1

  const readinessComment = readinessScore >= 4
    ? 'Profil opérationnel — les marques peuvent te contacter facilement'
    : readinessScore >= 2
      ? 'Quelques éléments de contact sont en place'
      : 'Aucune disponibilité ni lien de contact renseigné'

  const dimensions: Dimension[] = [
    { key: 'profile', label: 'Complétude du profil', score: profileScore, max: 25, comment: profileDimComment },
    { key: 'platform', label: 'Présence plateforme', score: platformScore, max: 20, comment: platformComment },
    { key: 'audience', label: 'Taille d\'audience', score: audienceScore, max: 20, comment: audienceComment },
    { key: 'activity', label: 'Activité & contenu', score: activityScore, max: 15, comment: activityComment },
    { key: 'engagement', label: 'Engagement', score: engagementScore, max: 15, comment: engagementComment },
    { key: 'readiness', label: 'Disponibilité sponsor', score: readinessScore, max: 5, comment: readinessComment },
  ]

  const total = Math.min(100, dimensions.reduce((acc, d) => acc + d.score, 0))

  return { total, dimensions, ytSubs, twFollowers, totalAudience, profileCompleteness }
}

// ─── Score level ───────────────────────────────────────────────────────────────

function getScoreLevel(score: number, profile: ProfileData, hasPlatforms: boolean): {
  label: string
  color: string
  interpretation: string
} {
  if (score >= 76) return {
    label: 'Profil très attractif',
    color: '#16a34a',
    interpretation: 'Ton profil est complet et performant. Tu es bien positionné pour recevoir des propositions de partenariats sérieuses — et pour les négocier en position de force.',
  }
  if (score >= 51) return {
    label: 'Profil sponsor-ready',
    color: '#0284c7',
    interpretation: 'Ton profil est solide et déjà exploitable par les marques. Quelques ajustements ciblés peuvent significativement augmenter ta valeur perçue et le nombre de propositions entrantes.',
  }
  if (score >= 26) {
    const missingNiche = !(profile.niche ?? '').length
    const missingPlatform = !hasPlatforms
    if (missingPlatform) return {
      label: 'Profil en montée',
      color: '#d97706',
      interpretation: 'Ton profil existe mais les marques ont besoin de stats vérifiées pour te prendre au sérieux. Connecter YouTube ou Twitch est la priorité absolue.',
    }
    if (missingNiche) return {
      label: 'Profil en montée',
      color: '#d97706',
      interpretation: 'Ton profil est actif mais encore trop générique. Définir ta niche et ta phrase de positionnement te différencie immédiatement auprès des marques.',
    }
    return {
      label: 'Profil en montée',
      color: '#d97706',
      interpretation: 'Ton profil est actif et déjà exploitable, mais il manque encore des preuves de performance et quelques éléments de présentation pour attirer davantage de marques.',
    }
  }
  return {
    label: 'Profil à structurer',
    color: '#64748b',
    interpretation: 'Ton profil est encore en construction. Les marques ont besoin de plusieurs signaux de confiance avant de te contacter. Commence par les actions prioritaires ci-dessous.',
  }
}

// ─── Priorities ───────────────────────────────────────────────────────────────

function buildPriorities(platforms: PlatformData[], profile: ProfileData): Priority[] {
  const yt = platforms.find(p => p.type === 'youtube')
  const tw = platforms.find(p => p.type === 'twitch')
  const priorities: Priority[] = []

  // Tier 1 — impact fort / visible immédiatement
  if (!yt) priorities.push({
    title: 'Connecter YouTube',
    description: 'Des stats YouTube vérifiées sont le signal de confiance numéro un pour les marques gaming.',
    gain: 8,
    cta: 'Connecter YouTube',
    href: '/dashboard',
  })
  if (!tw) priorities.push({
    title: 'Connecter Twitch',
    description: 'Une présence Twitch authentifiée montre une activité live et renforce ta crédibilité multi-plateforme.',
    gain: 8,
    cta: 'Connecter Twitch',
    href: '/dashboard',
  })
  if (!(profile.niche ?? '').length) priorities.push({
    title: 'Définir ta niche',
    description: 'Les marques cherchent des créateurs dans des niches précises. Sans niche définie, ton profil est invisible dans leurs recherches.',
    gain: 5,
    cta: 'Définir ma niche',
    href: '/dashboard/mediakit',
  })
  if (!(profile.positioningPhrase ?? '').length) priorities.push({
    title: 'Ajouter ta phrase de positionnement',
    description: 'Une phrase sponsor-friendly bien formulée peut faire la différence dans la première impression d\'une marque.',
    gain: 4,
    cta: 'Rédiger ma phrase',
    href: '/dashboard/mediakit',
  })
  if ((profile.bio ?? '').length < 50) priorities.push({
    title: 'Compléter ta bio',
    description: 'Une bio complète montre un créateur professionnel et sérieux — c\'est souvent la première chose qu\'une marque lit.',
    gain: 5,
    cta: 'Compléter ma bio',
    href: '/dashboard/mediakit',
  })

  // Tier 2 — impact contenu
  const hasContent = (yt?.stats?.recentVideos?.length ?? 0) > 0 || (tw?.stats?.recentStreams?.length ?? 0) > 0
  if (!hasContent && (yt || tw)) priorities.push({
    title: 'Rendre ton contenu récent visible',
    description: 'Les marques veulent voir des exemples de ton travail avant de te contacter. Du contenu récent rassure immédiatement.',
    gain: 6,
    cta: 'Gérer mon contenu',
    href: '/dashboard/mediakit',
  })
  if (!(profile.formats ?? []).length) priorities.push({
    title: 'Choisir tes formats de collaboration',
    description: 'Indiquer les formats que tu acceptes (intégration, live sponsorisé, ambassadeur…) aide les marques à te faire une proposition adaptée.',
    gain: 4,
    cta: 'Choisir mes formats',
    href: '/dashboard/mediakit',
  })
  if (!(profile.partnerships ?? []).length) priorities.push({
    title: 'Ajouter des partenariats passés',
    description: 'Des références de partenariats existants prouvent ton expérience et réduisent le risque perçu pour une marque.',
    gain: 3,
    cta: 'Ajouter des références',
    href: '/dashboard/mediakit',
  })

  // Tier 3 — logistique
  if (!profile.availableForCollabs) priorities.push({
    title: 'Activer ta disponibilité',
    description: 'Indique que tu es ouvert aux collaborations — signal simple qui change la perception immédiate de ton profil.',
    gain: 2,
    cta: 'Activer ma disponibilité',
    href: '/dashboard/mediakit',
  })
  if (!profile.calendlyUrl) priorities.push({
    title: 'Ajouter un lien Calendly',
    description: 'Faciliter la prise de contact réduit la friction et augmente le taux de conversion des marques intéressées.',
    gain: 2,
    cta: 'Ajouter Calendly',
    href: '/dashboard/mediakit',
  })

  return priorities.slice(0, 3)
}

// ─── Brand categories ──────────────────────────────────────────────────────────

function getBrandCategories(totalAudience: number, score: number): BrandCategory[] {
  const all: (BrandCategory & { minAudience: number })[] = [
    { name: 'Affiliation logiciel & outils', description: 'VPN, outils créateur, logiciels — accessible dès les premières centaines d\'abonnés.', accessible: false, minAudience: 0 },
    { name: 'Energy drink & nutrition', description: 'GFuel, Monster Gaming… Des programmes très actifs sur les créateurs gaming de toute taille.', accessible: false, minAudience: 0 },
    { name: 'Musique libre de droits', description: 'Epidemic Sound, Artlist — affiliation accessible et utile pour tout créateur qui publie des vidéos.', accessible: false, minAudience: 0 },
    { name: 'Communautés & plateformes', description: 'Discord, Kick… Programmes partenaires ouverts aux créateurs avec une communauté active.', accessible: false, minAudience: 500 },
    { name: 'Périphériques entrée de gamme', description: 'SteelSeries, HyperX, Corsair — premiers programmes accessibles avec une audience gaming engagée.', accessible: false, minAudience: 500 },
    { name: 'Streaming gear', description: 'Elgato, Blue Microphones — matériel de production, souvent proposé en dotation ou partenariat.', accessible: false, minAudience: 2500 },
    { name: 'Chaises & setup gaming', description: 'DXRacer, Secretlab — partenariats courants chez les streamers avec une audience solide.', accessible: false, minAudience: 2500 },
    { name: 'Jeux service live & MMORPG', description: 'Collaborations de lancement, dotations de clés, accès early access — courant dans le gaming FR.', accessible: false, minAudience: 2500 },
    { name: 'Hardware & composants', description: 'MSI, ASUS ROG, Intel — marques premium qui ciblent les créateurs avec une audience technique fidèle.', accessible: false, minAudience: 10000 },
    { name: 'Télécom & tech grand public', description: 'SFR Gaming, Free, etc. — partenariats institutionnels, audience large et diversifiée attendue.', accessible: false, minAudience: 10000 },
    { name: 'VPN premium', description: 'NordVPN, ExpressVPN — programmes généreux mais qui ciblent des créateurs avec une base établie.', accessible: false, minAudience: 10000 },
  ]

  const result = all.map(cat => ({
    ...cat,
    accessible: totalAudience >= cat.minAudience && score >= 25,
  }))

  // Retourner max 3 accessibles + max 3 à débloquer
  const accessible = result.filter(c => c.accessible).slice(0, 4)
  const locked = result.filter(c => !c.accessible).slice(0, 3)
  return [...accessible, ...locked.slice(0, Math.max(0, 6 - accessible.length))]
}

// ─── Snapshot items ────────────────────────────────────────────────────────────

function buildSnapshotItems(platforms: PlatformData[], profile: ProfileData, profileCompleteness: number): SnapshotItem[] {
  const hasContent = (platforms.find(p => p.type === 'youtube')?.stats?.recentVideos?.length ?? 0) > 0
    || (platforms.find(p => p.type === 'twitch')?.stats?.recentStreams?.length ?? 0) > 0

  return [
    {
      label: 'Complétude du profil',
      value: `${profileCompleteness}%`,
      done: profileCompleteness >= 80,
    },
    {
      label: 'Plateformes connectées',
      value: `${platforms.length} / 2`,
      done: platforms.length >= 1,
    },
    {
      label: 'Contenu récent visible',
      value: hasContent ? 'Visible' : 'Non visible',
      done: hasContent,
    },
    {
      label: 'Disponible pour partenariats',
      value: profile.availableForCollabs ? 'Activé' : 'Non activé',
      done: !!profile.availableForCollabs,
    },
  ]
}

// ─── Pro gate ──────────────────────────────────────────────────────────────────

const ProGate = ({ message }: { message: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: `rgba(13,13,15,0.88)`, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 20px', marginTop: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Lock size={14} color={MUTED} />
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

  useEffect(() => {
    Promise.all([
      fetch('/api/me').then(r => r.ok ? r.json() : null),
      fetch('/api/profile').then(r => r.ok ? r.json() : null),
    ]).then(([meData, profData]) => {
      const isPro = meData?.isPro ?? false
      setPro(isPro)

      const plats: PlatformData[] = (meData?.platforms ?? []).map((p: PlatformData) => ({
        type: p.type,
        stats: p.stats as PlatformStats | null,
      }))
      setPlatforms(plats)

      const prof: ProfileData = profData?.profile ?? {}
      setProfileData(prof)

      setScoreResult(calcScoreDetailed(plats, prof))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const hasPlatforms = platforms.length > 0
  const level = scoreResult ? getScoreLevel(scoreResult.total, profileData, hasPlatforms) : null
  const priorities = scoreResult ? buildPriorities(platforms, profileData) : []
  const categories = scoreResult ? getBrandCategories(scoreResult.totalAudience, scoreResult.total) : []
  const snapshotItems = scoreResult ? buildSnapshotItems(platforms, profileData, scoreResult.profileCompleteness) : []
  const dimensions = scoreResult?.dimensions ?? []
  const strengths = dimensions.filter(d => d.score / d.max >= 0.6)
  const weaknesses = dimensions.filter(d => d.score / d.max < 0.6)

  const fmtNum = (n: number) => n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
    : String(n)

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: SYNE }}>
      <Sidebar />
      <main className="dash-main" style={{ marginLeft: '240px', padding: '40px 48px', maxWidth: '1100px' }}>

        {/* Bandeau Pro */}
        {!pro && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 20px', marginBottom: '28px', color: TEXT }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: SYNE }}>Score visible gratuitement.</p>
              <p style={{ fontSize: '12px', color: MUTED, marginTop: '2px', fontFamily: SYNE }}>Les recommandations détaillées et le plan d'action complet sont réservés au plan Pro.</p>
            </div>
            <Link href="/dashboard/settings" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '6px', background: ACCENT, color: '#000000', fontWeight: 700, fontSize: '13px', textDecoration: 'none', flexShrink: 0, fontFamily: SYNE }}>
              <Zap size={13} /> Passer au Pro — 19€/mois
            </Link>
          </div>
        )}

        {/* Hero */}
        <div style={{ marginBottom: '32px' }}>
          <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, color: MUTED, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '3px 10px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: SYNE }}>
            Privé
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: TEXT, marginBottom: '6px', letterSpacing: '-0.02em', fontFamily: DISPLAY }}>Sponsorabilité</h1>
          <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, fontFamily: SYNE }}>
            Une vue privée de ton niveau de préparation pour les partenariats. Non visible par les marques.
          </p>
        </div>

        {loading ? (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '60px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: MUTED, fontFamily: SYNE }}>Calcul en cours…</p>
          </div>
        ) : !hasPlatforms ? (
          // État vide — aucune plateforme
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '60px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: TEXT, marginBottom: '8px', fontFamily: SYNE }}>Connecte au moins une plateforme pour commencer</p>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '24px', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 24px', fontFamily: SYNE }}>
              Pour calculer ton score et t'indiquer des pistes d'amélioration, on a besoin de tes statistiques YouTube ou Twitch vérifiées.
            </p>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', background: ACCENT, color: '#000000', fontWeight: 600, fontSize: '14px', textDecoration: 'none', fontFamily: SYNE }}>
              Connecter mes plateformes
            </Link>
            {scoreResult && scoreResult.total > 0 && (
              <p style={{ fontSize: '12px', color: MUTED, marginTop: '20px', fontFamily: SYNE }}>
                Score partiel basé sur ton profil éditorial : {scoreResult.total}/100
              </p>
            )}
          </div>
        ) : (
          <>
            {/* ── BLOC SCORE PRINCIPAL ─────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', marginBottom: '20px', alignItems: 'stretch' }}>

              {/* Gauche — score */}
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '60px', fontWeight: 600, color: TEXT, lineHeight: 1, letterSpacing: '-0.04em', fontFamily: NUM, fontVariantNumeric: 'tabular-nums' }}>
                    {scoreResult?.total ?? 0}
                  </div>
                  <div style={{ fontSize: '14px', color: MUTED, marginTop: '2px', fontFamily: SYNE }}>/100</div>
                </div>

                {level && (
                  <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, color: level.color, background: `${level.color}20`, border: `1px solid ${level.color}40`, letterSpacing: '0.01em', fontFamily: SYNE }}>
                    {level.label}
                  </span>
                )}

                {/* Encart "Ce score est privé" */}
                <div style={{ width: '100%', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '12px 14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: MUTED, marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: SYNE }}>
                    <Lock size={10} /> Ce score est privé
                  </p>
                  <p style={{ fontSize: '11px', color: MUTED, lineHeight: 1.6, fontFamily: SYNE }}>
                    Il n'est pas visible par les marques.<br />
                    Il sert uniquement à t'aider à améliorer ton profil.
                  </p>
                </div>
              </div>

              {/* Droite — interprétation + mini-stats */}
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: SYNE }}>Interprétation</p>
                  <p style={{ fontSize: '15px', color: TEXT, lineHeight: 1.75, maxWidth: '560px', fontFamily: SYNE }}>
                    {level?.interpretation}
                  </p>
                </div>

                {/* Mini-stats */}
                <div style={{ display: 'flex', gap: '24px', marginTop: '28px', paddingTop: '20px', borderTop: `1px solid ${BORDER}` }}>
                  <div>
                    <p style={{ fontSize: '11px', color: MUTED, marginBottom: '3px', fontWeight: 500, fontFamily: SYNE }}>Plateformes</p>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, fontFamily: SYNE }}>{platforms.length} / 2</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: MUTED, marginBottom: '3px', fontWeight: 500, fontFamily: SYNE }}>Abonnés / followers</p>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, fontFamily: SYNE }}>
                      {scoreResult && scoreResult.totalAudience > 0 ? fmtNum(scoreResult.totalAudience) : '—'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: MUTED, marginBottom: '3px', fontWeight: 500, fontFamily: SYNE }}>Profil complété</p>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, fontFamily: SYNE }}>{scoreResult?.profileCompleteness ?? 0}%</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: MUTED, marginBottom: '3px', fontWeight: 500, fontFamily: SYNE }}>Données</p>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: ACCENT, fontFamily: SYNE }}>Actuelles</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── BLOC POURQUOI CE SCORE ──────────────────────────────────── */}
            {pro ? (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '28px 32px', marginBottom: '20px' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '4px', fontFamily: SYNE }}>Pourquoi ce score</p>
                <p style={{ fontSize: '13px', color: MUTED, marginBottom: '24px', fontFamily: SYNE }}>Ce qui aide et ce qui peut encore progresser.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  {/* Points forts */}
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px', fontFamily: SYNE }}>Points forts</p>
                    {strengths.length === 0 ? (
                      <p style={{ fontSize: '13px', color: MUTED, fontStyle: 'italic', fontFamily: SYNE }}>Complète ton profil pour faire apparaître tes points forts.</p>
                    ) : strengths.map(d => (
                      <div key={d.key} style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'flex-start' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', marginTop: '6px', flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '2px', fontFamily: SYNE }}>{d.label}</p>
                          <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5, fontFamily: SYNE }}>{d.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Axes d'amélioration */}
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px', fontFamily: SYNE }}>Axes d'amélioration</p>
                    {weaknesses.length === 0 ? (
                      <p style={{ fontSize: '13px', color: MUTED, fontStyle: 'italic', fontFamily: SYNE }}>Aucun frein majeur identifié.</p>
                    ) : weaknesses.map(d => {
                      const pct = d.score / d.max
                      const dotColor = pct >= 0.3 ? '#d97706' : MUTED
                      return (
                        <div key={d.key} style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'flex-start' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, marginTop: '6px', flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '2px', fontFamily: SYNE }}>
                              {d.label}
                              <span style={{ fontSize: '11px', fontWeight: 500, color: MUTED, marginLeft: '8px', fontFamily: SYNE }}>{d.score}/{d.max} pts</span>
                            </p>
                            <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5, fontFamily: SYNE }}>{d.comment}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '28px 32px', marginBottom: '20px' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '4px', fontFamily: SYNE }}>Pourquoi ce score</p>
                <p style={{ fontSize: '13px', color: MUTED, marginBottom: '16px', fontFamily: SYNE }}>Détail des 6 dimensions qui composent ton score.</p>
                <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ height: '48px', background: CARD, borderRadius: '6px' }} />
                    ))}
                  </div>
                </div>
                <ProGate message="Le détail des points forts et axes d'amélioration est réservé au plan Pro." />
              </div>
            )}

            {/* ── BLOC TES 3 PRIORITÉS ────────────────────────────────────── */}
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '28px 32px', marginBottom: '20px' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '4px', fontFamily: SYNE }}>Tes priorités</p>
              <p style={{ fontSize: '13px', color: MUTED, marginBottom: '24px', fontFamily: SYNE }}>Les actions les plus impactantes pour progresser, dans l'ordre.</p>

              {priorities.length === 0 ? (
                <p style={{ fontSize: '14px', color: MUTED, fontStyle: 'italic', fontFamily: SYNE }}>Ton profil est déjà bien optimisé. Continue à publier régulièrement.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Priorité 1 — toujours visible */}
                  {priorities[0] && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '18px 20px', borderLeft: `3px solid ${ACCENT}` }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: ACCENT, color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0, fontFamily: SYNE }}>1</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, marginBottom: '3px', fontFamily: SYNE }}>{priorities[0].title}</p>
                        <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5, fontFamily: SYNE }}>{priorities[0].description}</p>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', color: ACCENT, fontWeight: 700, marginBottom: '8px', fontFamily: SYNE }}>+{priorities[0].gain} pts</p>
                        <Link href={priorities[0].href} style={{ display: 'inline-block', padding: '7px 14px', borderRadius: '6px', background: ACCENT, color: '#000000', fontWeight: 600, fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: SYNE }}>
                          {priorities[0].cta}
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Priorités 2 & 3 — Pro uniquement */}
                  {pro ? (
                    priorities.slice(1).map((p, i) => (
                      <div key={p.title} style={{ display: 'flex', alignItems: 'center', gap: '20px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '18px 20px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: BORDER, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0, fontFamily: SYNE }}>{i + 2}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, marginBottom: '3px', fontFamily: SYNE }}>{p.title}</p>
                          <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5, fontFamily: SYNE }}>{p.description}</p>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <p style={{ fontSize: '12px', color: ACCENT, fontWeight: 700, marginBottom: '8px', fontFamily: SYNE }}>+{p.gain} pts</p>
                          <Link href={p.href} style={{ display: 'inline-block', padding: '7px 14px', borderRadius: '6px', background: BORDER, color: TEXT, fontWeight: 600, fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: SYNE }}>
                            {p.cta}
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <div style={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[2, 3].map(n => (
                          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '20px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '18px 20px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: BORDER, flexShrink: 0 }} />
                            <div style={{ flex: 1, height: '36px', background: BORDER, borderRadius: '4px' }} />
                            <div style={{ width: '80px', height: '32px', background: BORDER, borderRadius: '6px', flexShrink: 0 }} />
                          </div>
                        ))}
                      </div>
                      <ProGate message="Les priorités 2 et 3 sont disponibles avec le plan Pro." />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── CATÉGORIES DE MARQUES ───────────────────────────────────── */}
            {pro ? (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '28px 32px', marginBottom: '20px' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '4px', fontFamily: SYNE }}>Catégories que ton profil peut viser</p>
                <p style={{ fontSize: '13px', color: MUTED, marginBottom: '24px', lineHeight: 1.6, fontFamily: SYNE }}>
                  Une direction indicative — pas une garantie. Les partenariats dépendent aussi de ton contenu, ta régularité et ta niche.
                </p>

                {scoreResult && scoreResult.totalAudience < 500 && scoreResult.total < 30 ? (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '20px 24px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: TEXT, marginBottom: '6px', fontFamily: SYNE }}>Les premières catégories arrivent vite</p>
                    <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, maxWidth: '440px', margin: '0 auto', fontFamily: SYNE }}>
                      Les premières opportunités arrivent plus vite qu'on ne le croit. Complète ton profil et les catégories accessibles apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {categories.map(cat => (
                      <div key={cat.name} style={{
                        border: `1px solid ${cat.accessible ? ACCENT : BORDER}`,
                        borderRadius: '8px',
                        padding: '16px 18px',
                        background: cat.accessible ? 'rgba(34,197,94,0.06)' : CARD,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, lineHeight: 1.3, fontFamily: SYNE }}>{cat.name}</p>
                          <span style={{
                            fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0, padding: '3px 8px', borderRadius: '4px', fontFamily: SYNE,
                            color: cat.accessible ? ACCENT : MUTED,
                            background: cat.accessible ? 'rgba(34,197,94,0.12)' : `rgba(255,255,255,0.05)`,
                            border: `1px solid ${cat.accessible ? 'rgba(34,197,94,0.3)' : BORDER}`,
                          }}>
                            {cat.accessible ? 'À viser maintenant' : 'Accessible prochainement'}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.55, fontFamily: SYNE }}>{cat.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '28px 32px', marginBottom: '20px' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '4px', fontFamily: SYNE }}>Catégories que ton profil peut viser</p>
                <p style={{ fontSize: '13px', color: MUTED, marginBottom: '16px', fontFamily: SYNE }}>Catégories de marques compatibles avec ton profil gaming.</p>
                <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: '80px', background: CARD, borderRadius: '8px' }} />)}
                  </div>
                </div>
                <ProGate message="Les catégories de marques compatibles sont disponibles avec le plan Pro." />
              </div>
            )}

            {/* ── TON PROFIL AUJOURD'HUI ──────────────────────────────────── */}
            {pro && (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '28px 32px', marginBottom: '20px' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '4px', fontFamily: SYNE }}>Ton profil aujourd'hui</p>
                <p style={{ fontSize: '13px', color: MUTED, marginBottom: '24px', fontFamily: SYNE }}>Un instantané de l'état actuel de ton profil.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  {snapshotItems.map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 18px', background: CARD }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.done ? ACCENT : BORDER, flexShrink: 0 }} />
                        <p style={{ fontSize: '13px', color: MUTED, fontWeight: 500, fontFamily: SYNE }}>{item.label}</p>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: item.done ? TEXT : MUTED, fontFamily: SYNE }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Message de clôture dynamique */}
                <div style={{ background: CARD, borderRadius: '6px', padding: '14px 18px', borderLeft: `3px solid ${BORDER}` }}>
                  <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, fontFamily: SYNE }}>
                    {(scoreResult?.total ?? 0) >= 76
                      ? 'Ton profil est en excellente forme. Continue à publier régulièrement et à mettre à jour tes partenariats.'
                      : (scoreResult?.total ?? 0) >= 51
                        ? 'Tu es sur la bonne voie. Quelques actions ciblées suffisent à passer dans la catégorie supérieure.'
                        : (scoreResult?.total ?? 0) >= 26
                          ? 'Chaque amélioration compte. Concentre-toi sur les priorités ci-dessus — les résultats arrivent vite.'
                          : 'Tout commence par les bases. Un profil structuré et une plateforme connectée font toute la différence.'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
