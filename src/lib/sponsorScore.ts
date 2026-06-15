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

export type PlatformKind = 'youtube' | 'twitch' | 'tiktok'

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
  /** Rétention YouTube : % moyen de la vidéo réellement visionné (YouTube Analytics). */
  avgViewPercentage?: number | null
  /** Cadence exacte : vidéos publiées sur 90 j (comptage précis côté collecte). */
  videosLast90Days?: number | null
  /** Abonnés payants Twitch (affiliés/partners) — preuve de communauté monétisée. */
  subscriptionCount?: number | null
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

/**
 * Plafonds de crédibilité — le score ne peut pas dépasser ce qu'on a réellement prouvé.
 * - Sans AUCUNE plateforme : profil + conversion ne suffisent pas. On plafonne bas
 *   (le créateur reste « Grade 1 » tant qu'il n'a pas connecté de plateforme).
 * - Sans preuve d'ENGAGEMENT (la dimension reine) : on ne peut pas couronner « Négocier
 *   haut ». On plafonne sous le Grade 3.
 */
const NO_PLATFORM_CAP = 35
const NO_ENGAGEMENT_CAP = 69

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

const ANCHOR_ACTIVITY: [number, number][] = [[0, 0], [1, 40], [3, 70], [6, 100]] // contenus récents (repli)
const ANCHOR_CADENCE: [number, number][] = [[0, 0], [0.5, 30], [1, 55], [2, 85], [3, 100]] // vidéos / semaine (cadence exacte 90 j)
const ANCHOR_YT_REACH: [number, number][] = [[0, 0], [5, 40], [10, 75], [20, 100]] // % vues/abonnés (fallback)
const ANCHOR_RETENTION: [number, number][] = [[0, 0], [30, 45], [40, 70], [55, 100]] // % rétention (avgViewPercentage)
const ANCHOR_TW_SUBS: [number, number][] = [[0, 0], [0.5, 50], [1.5, 80], [3, 100]] // % abonnés payants/followers

/**
 * Engagement YouTube RELATIF À LA TAILLE, ancré sur les taux d'engagement MOYENS
 * réels par palier (likes+commentaires/vues, benchmarks 2024-2025) :
 *   nano 5,2 % · micro 3,7 % · mid 2,8 % · macro 2,1 % · mega 1,4 %.
 * La moyenne du palier ≈ 50 (« dans la norme de ta taille »), le bon ≈ 75,
 * l'excellent ≈ 100. `good` = seuil affichable comme cible (= point à 75).
 */
function ytEngagementProfile(subs: number | null): { anchor: [number, number][]; good: number } {
  if (subs == null)    return { anchor: [[0, 0], [3.7, 50], [5, 75], [7, 100]],   good: 5 } // défaut ≈ micro
  if (subs < 10000)    return { anchor: [[0, 0], [5, 50], [7, 75], [10, 100]],    good: 7 } // nano
  if (subs < 50000)    return { anchor: [[0, 0], [3.7, 50], [5, 75], [7, 100]],   good: 5 } // micro
  if (subs < 100000)   return { anchor: [[0, 0], [2.8, 50], [4, 75], [5.5, 100]], good: 4 } // mid
  if (subs < 500000)   return { anchor: [[0, 0], [2.1, 50], [3, 75], [4.2, 100]], good: 3 } // macro
  return { anchor: [[0, 0], [1.4, 50], [2, 75], [2.8, 100]], good: 2 }                       // mega
}

/**
 * Ratio spectateurs/followers Twitch. Effet de taille plus faible que sur YouTube :
 * on relâche seulement la barre pour les très gros canaux (followers qui s'accumulent),
 * sans durcir pour les petits (qui peinent déjà à rassembler des viewers en live).
 */
function twRatioProfile(followers: number | null): { anchor: [number, number][]; good: number } {
  if (followers != null && followers >= 100000) return { anchor: [[0, 0], [0.4, 40], [1.5, 75], [4, 100]], good: 1.5 }
  return { anchor: [[0, 0], [0.5, 40], [2, 75], [5, 100]], good: 2 }
}

/**
 * Engagement TikTok RELATIF À LA TAILLE. Structurellement BIEN plus élevé que
 * YouTube (likes+commentaires+partages/vues) — benchmarks 2024 : nano 10,3 % ·
 * micro 8,7 % · mid 7,5 %. Moyenne du palier ≈ 50, bon ≈ 75, excellent ≈ 100.
 */
function tiktokEngagementProfile(followers: number | null): { anchor: [number, number][]; good: number } {
  if (followers == null)   return { anchor: [[0, 0], [8, 50], [11, 75], [15, 100]],   good: 11 }
  if (followers < 10000)   return { anchor: [[0, 0], [10.5, 50], [14, 75], [18, 100]], good: 14 } // nano
  if (followers < 100000)  return { anchor: [[0, 0], [8, 50], [11, 75], [15, 100]],   good: 11 } // micro/mid
  if (followers < 500000)  return { anchor: [[0, 0], [6, 50], [8, 75], [11, 100]],    good: 8 }  // macro
  if (followers < 1000000) return { anchor: [[0, 0], [4.5, 50], [6, 75], [8, 100]],   good: 6 }  // large
  return { anchor: [[0, 0], [3.5, 50], [5, 75], [7, 100]], good: 5 }                              // mega
}

function youtubeProvider(s: RawPlatformStats): PlatformContribution {
  const subs = s.subscriberCount && s.subscriberCount > 0 ? s.subscriberCount : null

  // Activité : cadence exacte sur 90 j si dispo (vidéos/semaine), sinon repli sur
  // le comptage des vidéos récentes. undefined dans les deux cas → non mesurable.
  let activite: number | null = null
  if (s.videosLast90Days != null) {
    const perWeek = (s.videosLast90Days / 90) * 7
    activite = clamp(interpolate(perWeek, ANCHOR_CADENCE))
  } else if (s.recentVideosCount != null) {
    activite = clamp(interpolate(s.recentVideosCount, ANCHOR_ACTIVITY))
  }

  // Engagement : taux d'engagement réel si dispo, sinon portée vues/abonnés en repli.
  // Le barème d'engagement est RELATIF À LA TAILLE de la chaîne (équité d'échelle).
  const ytEng = ytEngagementProfile(subs)
  let engagement: number | null = null
  let metricLabel = 'Taux d\'engagement'
  let metricValue: number | null = null
  let metricTarget = ytEng.good
  if (s.engagementRate != null && s.engagementRate >= 0) {
    engagement = clamp(interpolate(s.engagementRate, ytEng.anchor))
    metricValue = s.engagementRate
    metricTarget = ytEng.good
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

  // Rétention : signal universel de qualité d'audience. Elle se fond dans
  // l'engagement (peut le tirer vers le haut OU le bas — c'est un vrai critère).
  if (s.avgViewPercentage != null && s.avgViewPercentage >= 0) {
    const retentionScore = clamp(interpolate(s.avgViewPercentage, ANCHOR_RETENTION))
    engagement = engagement == null ? retentionScore : clamp(0.65 * engagement + 0.35 * retentionScore)
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

  // Engagement : ratio spectateurs moyens / followers (concurrence live réelle),
  // barème relâché pour les très gros canaux.
  const twProfile = twRatioProfile(followers)
  let engagement: number | null = null
  let metricValue: number | null = null
  const metricTarget = twProfile.good
  if (s.avgVodViews != null && followers) {
    const ratio = (s.avgVodViews / followers) * 100
    engagement = clamp(interpolate(ratio, twProfile.anchor))
    metricValue = ratio
  }

  // Abonnés payants : preuve d'une communauté qui paie déjà. Affilié-dépendant, donc
  // traité en BONUS — il ne peut que tirer l'engagement vers le haut, jamais le baisser
  // (un petit créateur sans subs n'est pas pénalisé).
  if (s.subscriptionCount != null && s.subscriptionCount > 0 && followers) {
    const subRatio = (s.subscriptionCount / followers) * 100
    const subScore = clamp(interpolate(subRatio, ANCHOR_TW_SUBS))
    engagement = engagement == null ? subScore : Math.max(engagement, clamp(0.6 * engagement + 0.4 * subScore))
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

function tiktokProvider(s: RawPlatformStats): PlatformContribution {
  const followers = s.followerCount && s.followerCount > 0 ? s.followerCount : null

  // Activité : cadence exacte sur 90 j si dispo, sinon comptage des vidéos récentes.
  let activite: number | null = null
  if (s.videosLast90Days != null) {
    const perWeek = (s.videosLast90Days / 90) * 7
    activite = clamp(interpolate(perWeek, ANCHOR_CADENCE))
  } else if (s.recentVideosCount != null) {
    activite = clamp(interpolate(s.recentVideosCount, ANCHOR_ACTIVITY))
  }

  // Engagement : taux (likes+commentaires+partages/vues), barème TikTok relatif à la taille.
  const ttEng = tiktokEngagementProfile(followers)
  let engagement: number | null = null
  let metricValue: number | null = null
  const metricTarget = ttEng.good
  if (s.engagementRate != null && s.engagementRate >= 0) {
    engagement = clamp(interpolate(s.engagementRate, ttEng.anchor))
    metricValue = s.engagementRate
  }

  const progress = metricValue == null ? 0 : clamp(metricValue / metricTarget, 0, 1)
  const tip = metricValue == null
    ? 'Publie quelques vidéos pour mesurer ton engagement.'
    : progress >= 1
      ? 'Engagement au top — ton meilleur argument de négo.'
      : 'Poste plus régulièrement pour faire monter ton engagement.'

  return {
    kind: 'tiktok',
    audienceCount: followers,
    activite,
    engagement,
    readout: { metricLabel: 'Taux d\'engagement', metricValue, metricUnit: '%', metricTarget, metricProgress: progress, tip },
  }
}

const PROVIDERS: Record<PlatformKind, (s: RawPlatformStats) => PlatformContribution> = {
  youtube: youtubeProvider,
  twitch: twitchProvider,
  tiktok: tiktokProvider,
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
  return s === 'youtube' ? 'YouTube' : s === 'twitch' ? 'Twitch' : s === 'tiktok' ? 'TikTok' : 'profil'
}

// ─── Conseil de coaching ────────────────────────────────────────────────────

function buildAdvice(dims: DimensionResult[]): string {
  const evaluated = dims.filter(d => d.score != null) as (DimensionResult & { score: number })[]
  if (!evaluated.length) return 'Connecte une plateforme ou complète ton profil pour lancer ton diagnostic.'

  // Sans aucune plateforme, le profil ne suffit pas : la priorité absolue est d'en connecter une.
  const noPlatform = dims.filter(d => PLATFORM_DIMENSIONS.includes(d.key)).every(d => d.status === 'unavailable')
  if (noPlatform) {
    return 'Connecte YouTube ou Twitch : sans stats vérifiées, les marques ne peuvent pas juger ta sponsorabilité — c\'est ce qui débloque ton vrai score.'
  }

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

  // Plateformes réellement exploitables (au moins un signal mesuré)
  const usablePlatforms = contributions.filter(
    c => c.audienceCount != null || c.activite != null || c.engagement != null,
  )
  const hasPlatform = usablePlatforms.length > 0
  const engagementProven = rawScores.engagement != null

  // 3. Score global pondéré (sur les dimensions évaluées uniquement), puis plafonné
  // par le niveau de preuve : on ne crédite pas ce qui n'est pas démontré.
  let globalScore = clamp(round(
    evaluated.reduce((sum, k) => sum + (rawScores[k] as number) * effectiveWeight(k), 0),
  ))
  if (!hasPlatform) {
    globalScore = Math.min(globalScore, NO_PLATFORM_CAP)
  } else if (!engagementProven) {
    globalScore = Math.min(globalScore, NO_ENGAGEMENT_CAP)
  }

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
      // La rétention vit dans l'objet imbriqué `analytics`.
      const analytics = (s.analytics && typeof s.analytics === 'object') ? s.analytics as Record<string, unknown> : {}
      platforms.push({
        kind: 'youtube',
        stats: {
          subscriberCount: toNum(s.subscriberCount),
          engagementRate: toNum(s.engagementRate),
          avgViewsPerVideo: toNum(s.avgViewsPerVideo),
          viewCount: toNum(s.viewCount),
          videoCount: toNum(s.videoCount),
          recentVideosCount: lenOf(s.recentVideos),
          videosLast90Days: toNum(s.videosLast90Days),
          avgViewPercentage: toNum(analytics.avgViewPercentage),
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
          subscriptionCount: toNum(s.subscriptionCount),
        },
      })
    } else if (p.type === 'tiktok') {
      platforms.push({
        kind: 'tiktok',
        stats: {
          followerCount: toNum(s.followerCount),
          engagementRate: toNum(s.engagementRate),
          recentVideosCount: lenOf(s.recentVideos),
          videosLast90Days: toNum(s.videosLast90Days),
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
