/**
 * Historique de stats & calcul de tendance — pur, testable, sans dépendance DB.
 * ──────────────────────────────────────────────────────────────────────────
 * On stocke un tableau `history` de snapshots datés DANS le blob `stats` de la
 * plateforme (pas de table dédiée → aucune migration). Le cron quotidien et les
 * routes /channel appellent `pushHistory` pour ajouter un point par jour.
 *
 * La tendance compare le dernier point à un point ~N jours plus tôt. Tant qu'il
 * n'y a pas assez d'historique (< `minDays`), on renvoie null → l'UI affiche
 * « historique en construction » au lieu d'un faux chiffre.
 */

export interface StatPoint {
  /** Date du snapshot, 'YYYY-MM-DD'. */
  d: string
  /** Audience (abonnés YouTube / followers Twitch). */
  aud: number | null
  /** Métrique d'engagement : taux % (YouTube) ou ratio spectateurs/followers % (Twitch). */
  eng: number | null
  /** Rétention % (YouTube uniquement), null sinon. */
  ret: number | null
}

export interface Trend {
  /** Écart réel utilisé, en jours (≤ cible, selon l'historique disponible). */
  days: number
  /** Variation d'audience en %, null si non calculable. */
  audiencePct: number | null
  /** Variation d'engagement en points (valeur absolue), null si non calculable. */
  engagementDelta: number | null
  /** Variation de rétention en points, null si non calculable. */
  retentionDelta: number | null
  baselineDate: string
}

const DAY = 24 * 60 * 60 * 1000

const num = (v: unknown): number | null => {
  if (v == null) return null
  const n = typeof v === 'number' ? v : parseInt(String(v), 10)
  return Number.isFinite(n) ? n : null
}

/** Extrait un snapshot des stats brutes d'une plateforme. */
export function buildSnapshot(stats: Record<string, unknown>, type: string, now: number = Date.now()): StatPoint {
  const d = new Date(now).toISOString().slice(0, 10)
  if (type === 'youtube') {
    const analytics = (stats.analytics && typeof stats.analytics === 'object') ? stats.analytics as Record<string, unknown> : {}
    return { d, aud: num(stats.subscriberCount), eng: num(stats.engagementRate), ret: num(analytics.avgViewPercentage) }
  }
  // twitch : on dérive le ratio spectateurs/followers comme métrique d'engagement
  const followers = num(stats.followerCount)
  const avgVod = num(stats.avgVodViews)
  const eng = followers && avgVod != null ? Math.round((avgVod / followers) * 100 * 100) / 100 : null
  return { d, aud: followers, eng, ret: null }
}

/**
 * Ajoute un point à l'historique : un seul point par jour (le dernier gagne),
 * trié, capé aux `capDays` derniers jours.
 */
export function pushHistory(prev: StatPoint[] | undefined | null, point: StatPoint, capDays = 120): StatPoint[] {
  const arr = (prev ?? []).filter(p => p.d !== point.d)
  arr.push(point)
  arr.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0))
  return arr.slice(-capDays)
}

/** Lit l'historique d'un blob de stats (tolérant aux formes inattendues). */
export function readHistory(stats: unknown): StatPoint[] {
  if (!stats || typeof stats !== 'object') return []
  const h = (stats as Record<string, unknown>).history
  return Array.isArray(h) ? (h as StatPoint[]) : []
}

/**
 * Calcule la tendance entre le dernier point et un point ~`targetDays` plus tôt.
 * Renvoie null si l'historique est trop court (< `minDays` d'écart réel).
 */
export function computeTrend(
  history: StatPoint[],
  targetDays = 30,
  minDays = 7,
  now: number = Date.now(),
): Trend | null {
  if (!history || history.length < 2) return null
  const sorted = [...history].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0))
  const latest = sorted[sorted.length - 1]
  const latestT = Date.parse(latest.d)
  if (Number.isNaN(latestT)) return null

  // Baseline : le point le plus RÉCENT qui soit au moins `targetDays` plus tôt ;
  // sinon le plus ancien disponible (on adapte la fenêtre à ce qu'on a).
  const targetT = latestT - targetDays * DAY
  let baseline: StatPoint | null = null
  for (const p of sorted) {
    if (p === latest) continue
    const t = Date.parse(p.d)
    if (!Number.isNaN(t) && t <= targetT) baseline = p
  }
  if (!baseline) baseline = sorted[0] === latest ? null : sorted[0]
  if (!baseline) return null

  const ageDays = (latestT - Date.parse(baseline.d)) / DAY
  if (ageDays < minDays) return null

  const audiencePct = baseline.aud != null && baseline.aud > 0 && latest.aud != null
    ? Math.round(((latest.aud - baseline.aud) / baseline.aud) * 1000) / 10
    : null
  const engagementDelta = baseline.eng != null && latest.eng != null
    ? Math.round((latest.eng - baseline.eng) * 100) / 100
    : null
  const retentionDelta = baseline.ret != null && latest.ret != null
    ? Math.round((latest.ret - baseline.ret) * 10) / 10
    : null

  return { days: Math.round(ageDays), audiencePct, engagementDelta, retentionDelta, baselineDate: baseline.d }
}
