/**
 * Score de sponsorabilité — moteur de calcul pur (sans UI, testable).
 * ──────────────────────────────────────────────────────────────────────────
 * Le score reflète la VALEUR PERÇUE PAR UN SPONSOR, pas la complétude du profil.
 * La complétude ne pèse qu'un bonus de +5 pts maximum, jamais le cœur du score.
 *
 * Pondération de base (avant redistribution) :
 *   engagement   30 %   (likes + commentaires) / vues
 *   viewsToSubs  25 %   vues récentes moyennes / abonnés
 *   regularity   20 %   vidéos sur 90 j → cadence hebdo
 *   growth       15 %   variation d'abonnés sur 30 j
 *   retention    10 %   % de la vidéo réellement visionnée
 *
 * Tout critère dont la donnée est absente est marqué `unavailable` et son poids
 * est redistribué proportionnellement sur les critères disponibles. Si AUCUN
 * critère n'est calculable, le score global vaut 0 (+ bonus complétude éventuel).
 *
 * Chaque critère est normalisé 0–100 par interpolation linéaire entre les seuils
 * du barème (pas de paliers brutaux).
 */

// ─── Types publics ──────────────────────────────────────────────────────────

export type CriterionKey = 'engagement' | 'viewsToSubs' | 'regularity' | 'growth' | 'retention'

export type CriterionStatus = 'strong' | 'improve' | 'weak' | 'unavailable'

export interface CriterionResult {
  criteria: CriterionKey
  /** Sous-score normalisé 0–100, ou null si la donnée manque. */
  score: number | null
  /** Poids effectif APRÈS redistribution (somme des poids effectifs = 1). */
  weight: number
  status: CriterionStatus
  /** Explication d'une phrase, spécifique à la valeur réelle. */
  message: string
}

export interface SponsorScore {
  globalScore: number
  breakdown: CriterionResult[]
  insights: string
}

/** Une vidéo récente, telle que renvoyée par l'API YouTube Data. */
export interface RawVideo {
  views: number
  likes: number
  comments: number
  /** ISO date de publication. */
  publishedAt: string
}

/**
 * Entrées brutes du calcul. Les formules vivent DANS la fonction pure (donc
 * testées) ; l'adaptateur (plus bas) se contente de mapper la DB vers ceci.
 */
export interface ScoreInputs {
  /** Vidéos récentes (jusqu'aux 10 dernières utilisées pour les vues moyennes). */
  recentVideos: RawVideo[]
  subscribers: number | null
  /** Abonnés il y a 30 jours (snapshot). null si pas d'historique. */
  subscribers30dAgo: number | null
  /** % moyen de la vidéo visionné (YouTube Analytics averageViewPercentage). null si indispo. */
  avgViewPercentage: number | null
  /**
   * Nombre de vidéos publiées sur les 90 derniers jours (comptage exact côté API,
   * non limité aux 10 récentes). Si fourni, prime sur le décompte du tableau.
   */
  videosLast90Days?: number | null
  /** Date de création de la chaîne (ISO) — équité de régularité pour les chaînes récentes. */
  channelPublishedAt?: string | null
  /** Complétude du profil éditorial, 0..1 (bio, niche, formats…). */
  profileCompleteness: number
  /** Followers Twitch (optionnel) — déclenche un bonus jusqu'à +8 pts. */
  twitchFollowers?: number | null
  /** Horodatage de référence (injectable pour des tests déterministes). */
  now?: number
}

// ─── Constantes de barème (faciles à ajuster) ───────────────────────────────

const BASE_WEIGHTS: Record<CriterionKey, number> = {
  engagement:  0.35, // critère #1 pour les marques
  viewsToSubs: 0.15, // réduit, moins déterminant
  regularity:  0.25, // remonté, l'activité compte beaucoup
  growth:      0.20, // remonté, une audience qui grandit = valeur future
  retention:   0.05, // gardé mais minoré, souvent indisponible
}

/** Bonus maximum apporté par la complétude du profil (en points de score). */
const PROFILE_BONUS_MAX = 5

/** Fenêtre de régularité, en jours. */
const REGULARITY_WINDOW_DAYS = 90

/** Nombre de vidéos récentes utilisées pour la moyenne de vues. */
const RECENT_VIDEOS_FOR_AVG = 10

/**
 * Points d'ancrage [valeurInput, sousScore] par critère. L'interpolation
 * linéaire passe par ces points ; en dehors, on borne au premier/dernier.
 * Les seuils du barème métier sont respectés (ex. engagement : 2 % = bas, 5 % = bon).
 */
const ANCHORS: Record<CriterionKey, [number, number][]> = {
  engagement: [[0, 0], [2, 40], [5, 75], [10, 100]], // % engagement
  viewsToSubs: [[0, 0], [5, 40], [10, 75], [20, 100]], // % vues/abonnés
  regularity: [[0, 0], [0.5, 30], [1, 55], [2, 85], [3, 100]], // vidéos / semaine
  growth: [[0, 30], [2, 55], [5, 90], [8, 100]], // % croissance 30 j (négatif borné à 0 en amont)
  retention: [[0, 0], [30, 45], [40, 70], [55, 100]], // % rétention
}

/** Seuils de statut sur le sous-score normalisé. */
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

function statusFromScore(score: number): Exclude<CriterionStatus, 'unavailable'> {
  if (score >= STATUS_STRONG) return 'strong'
  if (score >= STATUS_WEAK) return 'improve'
  return 'weak'
}

/** Bonus Twitch par paliers de followers. */
function calcTwitchBonus(followers: number | null | undefined): number {
  if (!followers || followers <= 0) return 0
  if (followers >= 50000) return 8
  if (followers >= 20000) return 6
  if (followers >= 5000)  return 4
  if (followers >= 1000)  return 2
  return 0
}

// ─── Calcul des valeurs métier (formules du barème) ─────────────────────────
// Chaque fonction renvoie soit la valeur, soit null si la donnée est insuffisante.

function calcEngagement(videos: RawVideo[]): number | null {
  const valid = videos.filter(v => v.views > 0)
  if (!valid.length) return null
  const rates = valid.map(v => ((v.likes + v.comments) / v.views) * 100)
  return rates.reduce((a, b) => a + b, 0) / rates.length
}

function calcViewsToSubs(videos: RawVideo[], subscribers: number | null): number | null {
  if (!subscribers || subscribers <= 0) return null // division par zéro / chaîne sans abonnés
  const sample = videos.slice(0, RECENT_VIDEOS_FOR_AVG).filter(v => v.views >= 0)
  if (!sample.length) return null
  const avgViews = sample.reduce((a, v) => a + v.views, 0) / sample.length
  return (avgViews / subscribers) * 100
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Âge de la chaîne en jours, ou null si la date est absente/invalide. */
function channelAgeDays(channelPublishedAt: string | null | undefined, now: number): number | null {
  if (!channelPublishedAt) return null
  const t = Date.parse(channelPublishedAt)
  if (Number.isNaN(t) || t > now) return null
  return (now - t) / DAY_MS
}

/** Borne le temps écoulé pour le calcul de cadence : entre 7 et 90 jours. */
function clampElapsed(ageDays: number | null): number {
  if (ageDays == null) return REGULARITY_WINDOW_DAYS
  return Math.min(REGULARITY_WINDOW_DAYS, Math.max(7, ageDays))
}

function calcRegularityPerWeek(
  videos: RawVideo[],
  now: number,
  videosLast90Days?: number | null,
  channelPublishedAt?: string | null,
): number | null {
  // Chemin production : comptage exact sur 90 j + âge de chaîne pour l'équité
  if (videosLast90Days != null) {
    if (videosLast90Days <= 0) {
      // 0 vidéo sur 90 j : chaîne ancienne = vrai 0 (inactive) ; chaîne récente = indispo
      const age = channelAgeDays(channelPublishedAt, now)
      return age != null && age >= 14 ? 0 : null
    }
    return (videosLast90Days / clampElapsed(channelAgeDays(channelPublishedAt, now))) * 7
  }

  // Fallback : décompte depuis le tableau de vidéos (données anciennes / tests)
  if (!videos.length) return null
  const windowStart = now - REGULARITY_WINDOW_DAYS * DAY_MS
  const inWindow = videos.filter(v => {
    const t = Date.parse(v.publishedAt)
    return !Number.isNaN(t) && t >= windowStart && t <= now
  })
  const oldest = videos
    .map(v => Date.parse(v.publishedAt))
    .filter(t => !Number.isNaN(t) && t <= now)
    .sort((a, b) => a - b)[0]
  if (oldest === undefined) return null
  return (inWindow.length / clampElapsed((now - oldest) / DAY_MS)) * 7
}

function calcGrowthPercent(subscribers: number | null, subs30dAgo: number | null): number | null {
  if (subscribers == null || subs30dAgo == null || subs30dAgo <= 0) return null
  return ((subscribers - subs30dAgo) / subs30dAgo) * 100
}

// ─── Messages spécifiques au profil ─────────────────────────────────────────

function messageFor(key: CriterionKey, value: number | null, status: CriterionStatus): string {
  if (status === 'unavailable' || value == null) {
    switch (key) {
      case 'engagement': return 'Pas assez de vidéos récentes avec des vues pour mesurer l\'engagement.'
      case 'viewsToSubs': return 'Vues récentes ou nombre d\'abonnés indisponibles.'
      case 'regularity': return 'Historique de publication insuffisant pour évaluer ta régularité.'
      case 'growth': return 'Croissance non calculable : il faut un historique d\'abonnés sur 30 jours.'
      case 'retention': return 'Donnée de rétention non disponible (active YouTube Analytics).'
    }
  }
  const v = value as number
  switch (key) {
    case 'engagement':
      return status === 'strong'
        ? `Engagement de ${v.toFixed(1)} %, bien au-dessus de la moyenne : ton meilleur argument.`
        : status === 'improve'
          ? `Engagement de ${v.toFixed(1)} %, correct mais améliorable pour rassurer les sponsors.`
          : `Engagement de ${v.toFixed(1)} %, sous la barre : une audience peu réactive freine les marques.`
    case 'viewsToSubs':
      return status === 'strong'
        ? `Tes vidéos touchent ${v.toFixed(0)} % de tes abonnés : forte portée réelle.`
        : status === 'improve'
          ? `Portée de ${v.toFixed(0)} % de tes abonnés : honorable, sans plus.`
          : `Seulement ${v.toFixed(0)} % de tes abonnés voient tes vidéos : portée faible.`
    case 'regularity':
      return status === 'strong'
        ? `Rythme de ${v.toFixed(1)} vidéo/semaine : régularité rassurante pour un partenaire.`
        : status === 'improve'
          ? `Rythme de ${v.toFixed(1)} vidéo/semaine : une cadence plus stable renforcerait ton profil.`
          : `Rythme de ${v.toFixed(1)} vidéo/semaine : trop irrégulier, ça inquiète les sponsors.`
    case 'growth':
      return status === 'strong'
        ? `Croissance de +${v.toFixed(1)} % sur 30 j : trajectoire qui attire les marques.`
        : status === 'improve'
          ? `Croissance de ${v >= 0 ? '+' : ''}${v.toFixed(1)} % sur 30 j : stable, sans réelle dynamique.`
          : `Croissance de ${v.toFixed(1)} % sur 30 j : audience en recul, signal négatif.`
    case 'retention':
      return status === 'strong'
        ? `Rétention de ${v.toFixed(0)} % : ton audience reste, gage de contenu solide.`
        : status === 'improve'
          ? `Rétention de ${v.toFixed(0)} % : correcte, un meilleur accroche aiderait.`
          : `Rétention de ${v.toFixed(0)} % : l'audience décroche tôt, à travailler.`
  }
}

// ─── Fonction pure principale ───────────────────────────────────────────────

export function computeSponsorScore(inputs: ScoreInputs): SponsorScore {
  const now = inputs.now ?? Date.now()
  const videos = inputs.recentVideos ?? []

  // 1. Valeurs métier brutes (null = donnée manquante)
  const raw: Record<CriterionKey, number | null> = {
    engagement: calcEngagement(videos),
    viewsToSubs: calcViewsToSubs(videos, inputs.subscribers),
    regularity: calcRegularityPerWeek(videos, now, inputs.videosLast90Days, inputs.channelPublishedAt),
    growth: calcGrowthPercent(inputs.subscribers, inputs.subscribers30dAgo),
    retention: inputs.avgViewPercentage,
  }

  // 2. Normalisation 0–100 par interpolation
  const normalized: Record<CriterionKey, number | null> = {
    engagement: raw.engagement == null ? null : clamp(interpolate(raw.engagement, ANCHORS.engagement)),
    viewsToSubs: raw.viewsToSubs == null ? null : clamp(interpolate(raw.viewsToSubs, ANCHORS.viewsToSubs)),
    regularity: raw.regularity == null ? null : clamp(interpolate(raw.regularity, ANCHORS.regularity)),
    // Croissance négative → 0 pt (donnée disponible, mais score nul)
    growth: raw.growth == null ? null : raw.growth < 0 ? 0 : clamp(interpolate(raw.growth, ANCHORS.growth)),
    retention: raw.retention == null ? null : clamp(interpolate(raw.retention, ANCHORS.retention)),
  }

  // 3. Redistribution des poids des critères indisponibles
  const keys = Object.keys(BASE_WEIGHTS) as CriterionKey[]
  const available = keys.filter(k => normalized[k] != null)
  const availableWeightSum = available.reduce((s, k) => s + BASE_WEIGHTS[k], 0)

  const effectiveWeight = (k: CriterionKey): number => {
    if (normalized[k] == null || availableWeightSum === 0) return 0
    return BASE_WEIGHTS[k] / availableWeightSum
  }

  // 4. Score pondéré + bonus Twitch + bonus complétude (jamais pénalisants)
  const weightedCore = available.reduce((sum, k) => sum + (normalized[k] as number) * effectiveWeight(k), 0)
  // Bonus Twitch : jusqu'à +8 pts si followers Twitch disponibles
  // Paliers : 1k→+2, 5k→+4, 20k→+6, 50k→+8
  const twitchBonus = calcTwitchBonus(inputs.twitchFollowers)
  const profileBonus = clamp(inputs.profileCompleteness, 0, 1) * PROFILE_BONUS_MAX
  const globalScore = clamp(round(weightedCore + (available.length ? twitchBonus + profileBonus : 0)))

  // 5. Breakdown détaillé (les 5 critères, même indisponibles)
  const breakdown: CriterionResult[] = keys.map(k => {
    const score = normalized[k]
    const status: CriterionStatus = score == null ? 'unavailable' : statusFromScore(score)
    return {
      criteria: k,
      score: score == null ? null : round(score),
      weight: round(effectiveWeight(k) * 100) / 100,
      status,
      // Le message s'appuie sur la valeur métier réelle (raw), pas la normalisée
      message: messageFor(k, raw[k], status),
    }
  })

  // 6. Insights : meilleur appui + frein prioritaire
  const insights = buildInsights(breakdown)

  return { globalScore, breakdown, insights }
}

const CRITERION_LABEL: Record<CriterionKey, string> = {
  engagement: 'ton engagement',
  viewsToSubs: 'ta portée (vues/abonnés)',
  regularity: 'ta régularité',
  growth: 'ta croissance',
  retention: 'ta rétention',
}

function buildInsights(breakdown: CriterionResult[]): string {
  const scored = breakdown.filter(b => b.score != null) as (CriterionResult & { score: number })[]
  if (!scored.length) {
    return 'Connecte ta chaîne et publie quelques vidéos pour calculer ta sponsorabilité réelle.'
  }
  const best = [...scored].sort((a, b) => b.score - a.score)[0]
  const worst = [...scored].sort((a, b) => a.score - b.score)[0]

  if (best.criteria === worst.criteria) {
    return best.score >= STATUS_STRONG
      ? `${cap(CRITERION_LABEL[best.criteria])} est ton point fort. Continue sur cette lancée.`
      : `Concentre-toi sur ${CRITERION_LABEL[best.criteria]} pour décoller.`
  }
  const lead = best.score >= STATUS_STRONG
    ? `${cap(CRITERION_LABEL[best.criteria])} est ton meilleur atout aux yeux des marques.`
    : `Aucun critère ne sort encore vraiment du lot.`
  return `${lead} À travailler en priorité : ${CRITERION_LABEL[worst.criteria]}.`
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// ─── Adaptateur DB → ScoreInputs ────────────────────────────────────────────
// Sépare la réalité de l'API (champs optionnels, snapshots manquants) de la
// fonction pure. C'est ICI qu'on voit ce qui est réellement collecté aujourd'hui.

export interface PlatformStatsLike {
  subscriberCount?: string | number | null
  recentVideos?: { viewCount?: string | number; likeCount?: string | number; commentCount?: string | number; publishedAt?: string }[] | null
  analytics?: { avgViewPercentage?: number | null } | null
  /** Estimation des abonnés à J-30 (via Analytics subscribersGained/Lost). */
  subscribers30dAgo?: number | null
  /** Vidéos publiées sur 90 j (comptage exact côté collecte). */
  videosLast90Days?: number | null
  /** Date de création de la chaîne. */
  channelPublishedAt?: string | null
}

export function statsToScoreInputs(
  stats: PlatformStatsLike | null,
  profileCompleteness: number,
  now = Date.now(),
): ScoreInputs {
  const num = (v: unknown): number => {
    const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10)
    return Number.isFinite(n) ? n : 0
  }
  const recentVideos: RawVideo[] = (stats?.recentVideos ?? []).map(v => ({
    views: num(v.viewCount),
    likes: num(v.likeCount),
    comments: num(v.commentCount),
    publishedAt: v.publishedAt ?? '',
  }))
  const subs = stats?.subscriberCount != null ? num(stats.subscriberCount) : null

  return {
    recentVideos,
    subscribers: subs && subs > 0 ? subs : null,
    subscribers30dAgo: stats?.subscribers30dAgo ?? null,
    avgViewPercentage: stats?.analytics?.avgViewPercentage ?? null,
    videosLast90Days: stats?.videosLast90Days ?? null,
    channelPublishedAt: stats?.channelPublishedAt ?? null,
    profileCompleteness,
    now,
  }
}
