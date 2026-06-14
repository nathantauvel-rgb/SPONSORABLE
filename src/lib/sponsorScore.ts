/**
 * Score de sponsorabilité — moteur UNIVERSEL, modulaire et testable.
 * ──────────────────────────────────────────────────────────────────────────
 * Principe : on n'impose AUCUNE structure plateforme. Le score évalue 5
 * dimensions universelles, chacune alimentée par les signaux réellement
 * disponibles (profil toujours présent ; YouTube / Twitch / autres si connectés).
 *
 *   profil       15 %   complétude éditoriale (toujours évaluable)
 *   activite     20 %   régularité du contenu (plateformes)
 *   audience     20 %   taille cumulée de l'audience (plateformes)
 *   engagement   30 %   qualité de l'interaction — la dimension reine (plateformes)
 *   conversion   15 %   prêt-à-vendre : dispo, Calendly, refs (toujours évaluable)
 *
 * RÈGLE D'OR : une dimension sans aucune source n'est JAMAIS comptée zéro.
 * Elle est marquée `unavailable` et son poids est redistribué sur les dimensions
 * évaluées. Un créateur Twitch-only ou YouTube-only n'est donc pas pénalisé.
 *
 * Seules les dimensions PLATEFORME (activite, audience, engagement) peuvent être
 * `unavailable`. `profil` et `conversion` sont toujours évaluées (le créateur
 * peut toujours remplir ces champs) — vides, elles valent « faible », pas « non évalué ».
 *
 * Extensibilité : le cœur ne connaît pas « YouTube » ou « Twitch ». Il agrège des
 * CONTRIBUTIONS produites par des fournisseurs de signaux (un par plateforme).
 * Ajouter Instagram / TikTok = écrire un fournisseur, sans toucher au calcul central.
 */

// ─── Types publics ──────────────────────────────────────────────────────────

export type DimensionKey = 'profil' | 'activite' | 'audience' | 'engagement' | 'conversion'

export type DimensionStatus = 'strong' | 'improve' | 'weak' | 'unavailable'

export type PlatformKind = 'youtube' | 'twitch'

/** Niveau de confiance du diagnostic — séparé du score (combien on VOIT, pas combien tu vaux). */
export type ConfidenceLevel = 'faible' | 'moyen' | 'eleve'

export interface DimensionResult {
  key: DimensionKey
  label: string
  /** Sous-score 0–100, ou null si non évalué (aucune source). */
  score: number | null
  /** Poids effectif APRÈS redistribution (somme = 1 sur les dimensions évaluées). */
  weight: number
  status: DimensionStatus
  /** Plateformes/sources ayant alimenté la dimension (vide si non évaluée). */
  sources: ('profil' | PlatformKind)[]
  message: string
}

/** Lecture par plateforme pour les cartes UI (métrique reine + cible). */
export interface PlatformReadout {
  kind: PlatformKind
  /** Audience de CETTE plateforme (abonnés YouTube / followers Twitch). */
  audienceCount: number | null
  /** Libellé de la métrique reine ("Taux d'engagement", "Spectateurs / followers"…). */
  metricLabel: string
  /** Valeur affichable de la métrique (ex. 4.2 pour 4,2 %). null si indispo. */
  metricValue: number | null
  metricUnit: string
  /** Cible à viser pour un profil très attractif. */
  metricTarget: number
  /** Progression vers la cible, 0..1. */
  metricProgress: number
  tip: string
}

export interface GradeInfo {
  /** 1, 2 ou 3. */
  level: number
  total: number
  name: string
  verdict: string
}

export interface UniversalSponsorScore {
  globalScore: number
  grade: GradeInfo
  confidence: { level: ConfidenceLevel; label: string }
  /** Noms affichables des sources prises en compte ("Twitch", "profil"…). */
  sources: string[]
  dimensions: DimensionResult[]
  platforms: PlatformReadout[]
  advice: string
}

// ─── Entrées du moteur ──────────────────────────────────────────────────────

export interface ProfileInputs {
  /** Complétude éditoriale 0..1 (bio, niche, formats, positionnement…). */
  completeness: number
  availableForCollabs?: boolean
  hasCalendly?: boolean
  hasPartnerships?: boolean
  hasTargetBrands?: boolean
}

/** Stats brutes d'une plateforme, déjà numérisées. Champs optionnels selon la source. */
export interface RawPlatformStats {
  subscriberCount?: number | null
  followerCount?: number | null
  engagementRate?: number | null
  avgViewsPerVideo?: number | null
  viewCount?: number | null
  videoCount?: number | null
  avgVodViews?: number | null
  recentVideosCount?: number
  recentStreamsCount?: number
  clipsCount?: number
}

export interface PlatformInput {
  kind: PlatformKind
  stats: RawPlatformStats
}

export interface UniversalScoreInputs {
  profile: ProfileInputs
  platforms: PlatformInput[]
  now?: number
}

// ─── Barème (faciles à ajuster) ─────────────────────────────────────────────

const BASE_WEIGHTS: Record<DimensionKey, number> = {
  profil:     0.15,
  activite:   0.20,
  audience:   0.20,
  engagement: 0.30, // la dimension reine : l'engagement prime sur la taille
  conversion: 0.15,
}

const DIMENSION_LABEL: Record<DimensionKey, string> = {
  profil:     'Profil',
  activite:   'Activité',
  audience:   'Audience',
  engagement: 'Engagement',
  conversion: 'Conversion business',
}

/** Dimensions qui dépendent d'une plateforme : seules elles peuvent être « non évaluées ». */
const PLATFORM_DIMENSIONS: DimensionKey[] = ['activite', 'audience', 'engagement']

/** Seuils de grade sur le score global (non affichés au créateur). */
const GRADE2_MIN = 40
const GRADE3_MIN = 70

const GRADES: { level: number; min: number; name: string; verdict: string }[] = [
  { level: 1, min: 0,         name: 'Les bases',          verdict: 'Construis tes fondations avant de démarcher des marques.' },
  { level: 2, min: GRADE2_MIN, name: 'Prêt à démarcher',  verdict: 'Tu peux contacter des marques toi-même.' },
  { level: 3, min: GRADE3_MIN, name: 'Négocier haut',     verdict: 'Les marques premium te prennent au sérieux — négocie haut.' },
]

const STATUS_STRONG = 70
const STATUS_WEAK = 40

// ─── Helpers numériques ─────────────────────────────────────────────────────

/** Interpolation linéaire par morceaux, bornée aux extrémités. */
function interpolate(value: number, points: [number, number][]): number {
  if (value <= points[0][0]) return points[0][1]
  const last = points[points.length - 1]
  if (value >= last[0]) return last[1]
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    if (value >= x0 && value <= x1) {
      const t = (value - x0) / (x1 - x0)
      return y0 + t * (y1 - y0)
    }
  }
  return last[1]
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))
const round = (n: number) => Math.round(n)

function statusFromScore(score: number): Exclude<DimensionStatus, 'unavailable'> {
  if (score >= STATUS_STRONG) return 'strong'
  if (score >= STATUS_WEAK) return 'improve'
  return 'weak'
}

// ─── Fournisseurs de signaux (un par plateforme) ────────────────────────────
// Chaque fournisseur traduit des stats brutes en contributions normalisées 0–100
// vers les 3 dimensions plateforme, + la métrique reine affichable de la carte.

interface PlatformContribution {
  kind: PlatformKind
  /** Audience de la plateforme (pour la somme cumulée). null si inconnue. */
  audienceCount: number | null
  /** Contribution normalisée 0–100 à l'activité. null si non mesurable. */
  activite: number | null
  /** Contribution normalisée 0–100 à l'engagement. null si non mesurable. */
  engagement: number | null
  /** Métrique reine affichable (carte plateforme). */
  readout: Omit<PlatformReadout, 'kind' | 'audienceCount'>
}

const ANCHOR_ACTIVITY: [number, number][] = [[0, 0], [1, 40], [3, 70], [6, 100]] // contenus récents
const ANCHOR_YT_ENGAGEMENT: [number, number][] = [[0, 0], [2, 40], [5, 75], [8, 100]] // % engagement
const ANCHOR_YT_REACH: [number, number][] = [[0, 0], [5, 40], [10, 75], [20, 100]] // % vues/abonnés (fallback)
const ANCHOR_TW_RATIO: [number, number][] = [[0, 0], [0.5, 40], [2, 75], [5, 100]] // % spectateurs/followers

function youtubeProvider(s: RawPlatformStats): PlatformContribution {
  const subs = s.subscriberCount && s.subscriberCount > 0 ? s.subscriberCount : null

  // Activité : nombre de vidéos récentes (régularité). undefined → non mesurable.
  const activite = s.recentVideosCount == null ? null : clamp(interpolate(s.recentVideosCount, ANCHOR_ACTIVITY))

  // Engagement : taux d'engagement réel si dispo, sinon portée vues/abonnés en repli.
  let engagement: number | null = null
  let metricLabel = 'Taux d\'engagement'
  let metricValue: number | null = null
  let metricTarget = 6
  if (s.engagementRate != null && s.engagementRate >= 0) {
    engagement = clamp(interpolate(s.engagementRate, ANCHOR_YT_ENGAGEMENT))
    metricValue = s.engagementRate
    metricTarget = 6
  } else if (s.avgViewsPerVideo != null && subs) {
    const reach = (s.avgViewsPerVideo / subs) * 100
    engagement = clamp(interpolate(reach, ANCHOR_YT_REACH))
    metricLabel = 'Portée (vues / abonnés)'
    metricValue = reach
    metricTarget = 12
  } else if (s.viewCount != null && s.videoCount && subs) {
    const reach = ((s.viewCount / s.videoCount) / subs) * 100
    engagement = clamp(interpolate(reach, ANCHOR_YT_REACH))
    metricLabel = 'Portée (vues / abonnés)'
    metricValue = reach
    metricTarget = 12
  }

  const progress = metricValue == null ? 0 : clamp(metricValue / metricTarget, 0, 1)
  const tip = metricValue == null
    ? 'Publie quelques vidéos pour mesurer ton engagement.'
    : progress >= 1
      ? 'Engagement au top — c\'est ton meilleur argument de négo.'
      : metricLabel.startsWith('Portée')
        ? 'Des vidéos plus régulières augmenteront ta portée.'
        : 'Poste plus régulièrement pour faire monter ton engagement.'

  return {
    kind: 'youtube',
    audienceCount: subs,
    activite,
    engagement,
    readout: { metricLabel, metricValue, metricUnit: '%', metricTarget, metricProgress: progress, tip },
  }
}

function twitchProvider(s: RawPlatformStats): PlatformContribution {
  const followers = s.followerCount && s.followerCount > 0 ? s.followerCount : null

  // Activité : streams récents (+ léger apport des clips).
  let activite: number | null = null
  if (s.recentStreamsCount != null) {
    activite = clamp(interpolate(s.recentStreamsCount, ANCHOR_ACTIVITY) + ((s.clipsCount ?? 0) > 0 ? 8 : 0))
  } else if (s.clipsCount != null && s.clipsCount > 0) {
    activite = 40
  }

  // Engagement : ratio spectateurs moyens / followers (concurrence live réelle).
  let engagement: number | null = null
  let metricValue: number | null = null
  const metricTarget = 2
  if (s.avgVodViews != null && followers) {
    const ratio = (s.avgVodViews / followers) * 100
    engagement = clamp(interpolate(ratio, ANCHOR_TW_RATIO))
    metricValue = ratio
  }

  const progress = metricValue == null ? 0 : clamp(metricValue / metricTarget, 0, 1)
  const tip = metricValue == null
    ? 'Streame régulièrement pour mesurer ta fidélisation.'
    : progress >= 1
      ? 'Belle fidélisation live — un vrai atout pour les marques.'
      : 'Anime tes lives pour fidéliser tes spectateurs.'

  return {
    kind: 'twitch',
    audienceCount: followers,
    activite,
    engagement,
    readout: { metricLabel: 'Spectateurs / followers', metricValue, metricUnit: '%', metricTarget, metricProgress: progress, tip },
  }
}

const PROVIDERS: Record<PlatformKind, (s: RawPlatformStats) => PlatformContribution> = {
  youtube: youtubeProvider,
  twitch: twitchProvider,
}

// ─── Dimensions profil / conversion (toujours évaluées) ─────────────────────

const ANCHOR_AUDIENCE: [number, number][] = [
  [0, 0], [1000, 25], [5000, 40], [10000, 55], [50000, 75], [100000, 88], [500000, 100],
]

function conversionScore(p: ProfileInputs): number {
  let s = 0
  if (p.availableForCollabs) s += 40
  if (p.hasCalendly) s += 30
  if (p.hasPartnerships) s += 20
  if (p.hasTargetBrands) s += 10
  return clamp(s)
}

// ─── Messages courts par dimension ──────────────────────────────────────────

function messageFor(key: DimensionKey, status: DimensionStatus, sources: ('profil' | PlatformKind)[]): string {
  if (status === 'unavailable') {
    switch (key) {
      case 'activite': return 'Connecte une plateforme pour évaluer ta régularité.'
      case 'audience': return 'Connecte une plateforme pour mesurer ton audience.'
      case 'engagement': return 'Connecte une plateforme pour mesurer ton engagement.'
      default: return 'Non évalué.'
    }
  }
  const via = sources.length ? ` (${sources.map(sourceLabel).join(' + ')})` : ''
  switch (key) {
    case 'profil':
      return status === 'strong' ? 'Profil complet — bon signal pour les marques.'
        : status === 'improve' ? 'Profil correct, quelques champs encore à remplir.'
        : 'Profil incomplet — remplis niche, bio et positionnement.'
    case 'activite':
      return status === 'strong' ? `Contenu régulier${via} — partenaire fiable.`
        : status === 'improve' ? `Activité présente${via}, une cadence plus stable aiderait.`
        : `Peu de contenu récent${via} — les marques veulent des preuves d'activité.`
    case 'audience':
      return status === 'strong' ? `Audience solide${via} — dans les radars des marques.`
        : status === 'improve' ? `Audience en croissance${via} — premières opportunités jouables.`
        : `Audience encore petite${via} — l'affiliation reste accessible.`
    case 'engagement':
      return status === 'strong' ? `Engagement fort${via} — ton meilleur levier de négo.`
        : status === 'improve' ? `Engagement correct${via} — il justifie tes tarifs.`
        : `Engagement à prouver${via} — il compte plus que la taille.`
    case 'conversion':
      return status === 'strong' ? 'Prise de contact opérationnelle — profil prêt à vendre.'
        : status === 'improve' ? 'Contact partiellement en place — ajoute un Calendly ou tes refs.'
        : 'Active ta dispo et un moyen de contact pour ne rater aucun deal.'
  }
}

function sourceLabel(s: 'profil' | PlatformKind): string {
  return s === 'youtube' ? 'YouTube' : s === 'twitch' ? 'Twitch' : 'profil'
}

// ─── Conseil de coaching ────────────────────────────────────────────────────

function buildAdvice(dims: DimensionResult[]): string {
  const evaluated = dims.filter(d => d.score != null) as (DimensionResult & { score: number })[]
  if (!evaluated.length) return 'Connecte une plateforme ou complète ton profil pour lancer ton diagnostic.'

  const engagement = dims.find(d => d.key === 'engagement')
  if (engagement && engagement.status !== 'unavailable' && (engagement.score ?? 0) < STATUS_STRONG) {
    return 'Fais monter ton engagement — un public réactif vaut mieux qu\'une grosse audience, c\'est ce qui justifie tes tarifs.'
  }
  const weakest = [...evaluated].sort((a, b) => a.score - b.score)[0]
  switch (weakest.key) {
    case 'profil': return 'Complète ton profil (niche, bio, positionnement) : une marque doit savoir où te ranger en 5 secondes.'
    case 'activite': return 'Publie plus régulièrement : la régularité rassure les marques sur ta fiabilité.'
    case 'audience': return 'Ton audience grandit — continue, et soigne ta rétention pour accélérer.'
    case 'conversion': return 'Active ta disponibilité sponsor et ajoute un Calendly : ne laisse aucune marque repartir.'
    default: return 'Ton engagement est ton atout — capitalise dessus dans tes échanges avec les marques.'
  }
}

// ─── Fonction pure principale ───────────────────────────────────────────────

export function computeUniversalScore(inputs: UniversalScoreInputs): UniversalSponsorScore {
  const contributions = inputs.platforms.map(p => PROVIDERS[p.kind](p.stats))

  // 1. Sous-scores bruts par dimension (null = non évaluée)
  const audienceTotal = contributions.reduce((sum, c) => sum + (c.audienceCount ?? 0), 0)
  const anyAudience = contributions.some(c => c.audienceCount != null)

  const collectBest = (pick: (c: PlatformContribution) => number | null) => {
    const vals = contributions.map(pick).filter((v): v is number => v != null)
    return vals.length ? Math.max(...vals) : null
  }
  const sourcesFor = (pick: (c: PlatformContribution) => number | null): PlatformKind[] =>
    contributions.filter(c => pick(c) != null).map(c => c.kind)

  const rawScores: Record<DimensionKey, number | null> = {
    profil: clamp(inputs.profile.completeness * 100),
    conversion: conversionScore(inputs.profile),
    audience: anyAudience ? clamp(interpolate(audienceTotal, ANCHOR_AUDIENCE)) : null,
    activite: collectBest(c => c.activite),
    engagement: collectBest(c => c.engagement),
  }

  const dimSources: Record<DimensionKey, ('profil' | PlatformKind)[]> = {
    profil: ['profil'],
    conversion: ['profil'],
    audience: anyAudience ? contributions.filter(c => c.audienceCount != null).map(c => c.kind) : [],
    activite: sourcesFor(c => c.activite),
    engagement: sourcesFor(c => c.engagement),
  }

  // 2. Redistribution des poids des dimensions non évaluées
  const keys = Object.keys(BASE_WEIGHTS) as DimensionKey[]
  const evaluated = keys.filter(k => rawScores[k] != null)
  const availableWeightSum = evaluated.reduce((s, k) => s + BASE_WEIGHTS[k], 0)
  const effectiveWeight = (k: DimensionKey): number => {
    if (rawScores[k] == null || availableWeightSum === 0) return 0
    return BASE_WEIGHTS[k] / availableWeightSum
  }

  // 3. Score global pondéré (sur les dimensions évaluées uniquement)
  const globalScore = clamp(round(
    evaluated.reduce((sum, k) => sum + (rawScores[k] as number) * effectiveWeight(k), 0),
  ))

  // 4. Détail des dimensions
  const dimensions: DimensionResult[] = keys.map(k => {
    const score = rawScores[k]
    const status: DimensionStatus = score == null ? 'unavailable' : statusFromScore(score)
    const sources = dimSources[k]
    return {
      key: k,
      label: DIMENSION_LABEL[k],
      score: score == null ? null : round(score),
      weight: Math.round(effectiveWeight(k) * 100) / 100,
      status,
      sources,
      message: messageFor(k, status, sources),
    }
  })

  // 5. Grade (dérivé du score, seuils non affichés)
  const g = [...GRADES].reverse().find(t => globalScore >= t.min) ?? GRADES[0]
  const grade: GradeInfo = { level: g.level, total: GRADES.length, name: g.name, verdict: g.verdict }

  // 6. Confiance : combien de sources réelles alimentent le diagnostic
  const usablePlatforms = contributions.filter(
    c => c.audienceCount != null || c.activite != null || c.engagement != null,
  )
  const confidence = buildConfidence(usablePlatforms.length)

  // 7. Sources affichables : plateformes connectées (le profil n'est listé que
  // s'il est l'unique source, pour ne pas afficher une liste vide).
  const platformSources = usablePlatforms.map(c => sourceLabel(c.kind))
  const sources = platformSources.length ? platformSources : ['profil']

  // 8. Lectures par plateforme (cartes UI)
  const platforms: PlatformReadout[] = contributions.map(c => ({
    kind: c.kind,
    audienceCount: c.audienceCount,
    ...c.readout,
  }))

  return {
    globalScore,
    grade,
    confidence,
    sources,
    dimensions,
    platforms,
    advice: buildAdvice(dimensions),
  }
}

function buildConfidence(platformCount: number): { level: ConfidenceLevel; label: string } {
  if (platformCount >= 2) return { level: 'eleve', label: 'Fiable élevé' }
  if (platformCount >= 1) return { level: 'moyen', label: 'Fiable moyen' }
  return { level: 'faible', label: 'Indicatif' }
}

// ─── Adaptateur : formes API (page) → entrées du moteur ─────────────────────
// Sépare la réalité de l'API (champs string, stats hétérogènes) du moteur pur.

export interface ApiPlatform {
  type: string
  stats: Record<string, unknown> | null
}

export interface ApiProfile {
  bio?: string | null
  niche?: string | null
  formats?: string[] | null
  positioningPhrase?: string | null
  country?: string | null
  languages?: string[] | null
  availableForCollabs?: boolean | null
  calendlyUrl?: string | null
  targetBrands?: string | null
  partnerships?: unknown[] | null
}

const toNum = (v: unknown): number | null => {
  if (v == null) return null
  const n = typeof v === 'number' ? v : parseInt(String(v), 10)
  return Number.isFinite(n) ? n : null
}
const lenOf = (v: unknown): number => (Array.isArray(v) ? v.length : 0)

/** Complétude éditoriale 0..1 (5 champs clés). */
export function profileCompleteness(p: ApiProfile): number {
  const items = [
    (p.bio ?? '').length > 20,
    (p.niche ?? '').length > 0,
    (p.formats ?? []).length > 0,
    (p.positioningPhrase ?? '').length > 0,
    !!p.country || (p.languages ?? []).length > 0,
  ]
  return items.filter(Boolean).length / items.length
}

export function buildScoreInputs(apiPlatforms: ApiPlatform[], profile: ApiProfile, now = Date.now()): UniversalScoreInputs {
  const platforms: PlatformInput[] = []
  for (const p of apiPlatforms) {
    const s = p.stats ?? {}
    if (p.type === 'youtube') {
      platforms.push({
        kind: 'youtube',
        stats: {
          subscriberCount: toNum(s.subscriberCount),
          engagementRate: toNum(s.engagementRate),
          avgViewsPerVideo: toNum(s.avgViewsPerVideo),
          viewCount: toNum(s.viewCount),
          videoCount: toNum(s.videoCount),
          recentVideosCount: lenOf(s.recentVideos),
        },
      })
    } else if (p.type === 'twitch') {
      platforms.push({
        kind: 'twitch',
        stats: {
          followerCount: toNum(s.followerCount),
          avgVodViews: toNum(s.avgVodViews),
          recentStreamsCount: lenOf(s.recentStreams),
          clipsCount: lenOf(s.topClips),
        },
      })
    }
  }

  return {
    profile: {
      completeness: profileCompleteness(profile),
      availableForCollabs: !!profile.availableForCollabs,
      hasCalendly: !!profile.calendlyUrl,
      hasPartnerships: (profile.partnerships ?? []).length > 0,
      hasTargetBrands: !!profile.targetBrands,
    },
    platforms,
    now,
  }
}

/** Liste des grades, exposée pour l'échelle de progression dans l'UI. */
export const SPONSOR_GRADES = GRADES.map(g => ({ level: g.level, name: g.name }))
