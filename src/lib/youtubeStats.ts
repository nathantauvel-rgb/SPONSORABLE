/**
 * Helpers de collecte YouTube partagés entre la route à la demande
 * (`api/youtube/channel`) et le cron quotidien (`api/cron/refresh-stats`).
 * Centralisé ici pour que les deux chemins ne divergent jamais.
 */

export type YtVideo = {
  id: string
  title: string
  publishedAt: string
  thumbnail: string | null
  viewCount: string
  likeCount: string
  commentCount: string
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

/** Nombre de vidéos récentes conservées (affichage media kit + engagement). */
const DISPLAY_VIDEOS = 10
/** Vidéos balayées pour compter la cadence sur 90 j (page playlist). */
const ACTIVITY_SCAN = 50

/** Taux d'engagement moyen : (likes + commentaires) / vues, en %. null si rien d'exploitable. */
export function computeEngagementRate(videos: YtVideo[]): number | null {
  const valid = videos.filter(v => Number(v.viewCount) > 0)
  if (!valid.length) return null
  const rates = valid.map(v => (Number(v.likeCount) + Number(v.commentCount)) / Number(v.viewCount) * 100)
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length * 100) / 100
}

/**
 * Récupère l'activité vidéo : les N dernières vidéos détaillées (affichage +
 * engagement) ET le nombre de vidéos publiées sur 90 j (régularité).
 * On scanne jusqu'à 50 items de playlist (légers : juste les dates) mais on ne
 * charge les statistiques complètes que pour les 10 plus récentes.
 */
export async function fetchVideoActivity(
  token: string,
  uploadsPlaylistId: string,
  now: number = Date.now(),
): Promise<{ recentVideos: YtVideo[]; videosLast90Days: number }> {
  const empty = { recentVideos: [] as YtVideo[], videosLast90Days: 0 }
  if (!uploadsPlaylistId) return empty
  try {
    const plRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${ACTIVITY_SCAN}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const plData = plRes.ok ? await plRes.json() : null
    const items: { contentDetails?: { videoId?: string; videoPublishedAt?: string } }[] = plData?.items ?? []
    if (!items.length) return empty

    // Cadence : compte les vidéos publiées dans la fenêtre de 90 jours
    const windowStart = now - NINETY_DAYS_MS
    const videosLast90Days = items.filter(i => {
      const t = Date.parse(i.contentDetails?.videoPublishedAt ?? '')
      return !Number.isNaN(t) && t >= windowStart && t <= now
    }).length

    // Statistiques complètes uniquement pour les 10 plus récentes
    const topIds = items
      .map(i => i.contentDetails?.videoId)
      .filter((id): id is string => !!id)
      .slice(0, DISPLAY_VIDEOS)
    if (!topIds.length) return { recentVideos: [], videosLast90Days }

    const vRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${topIds.join(',')}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const vData = vRes.ok ? await vRes.json() : null
    const recentVideos: YtVideo[] = (vData?.items ?? []).map((v: { id: string; snippet: { title: string; publishedAt: string; thumbnails?: { medium?: { url: string } } }; statistics: { viewCount?: string; likeCount?: string; commentCount?: string } }) => ({
      id: v.id,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      thumbnail: v.snippet.thumbnails?.medium?.url ?? null,
      viewCount: v.statistics.viewCount ?? '0',
      likeCount: v.statistics.likeCount ?? '0',
      commentCount: v.statistics.commentCount ?? '0',
    }))

    return { recentVideos, videosLast90Days }
  } catch {
    return empty
  }
}

/**
 * Estime le nombre d'abonnés il y a 30 jours, pour le critère de croissance.
 * YouTube ne donne pas l'historique d'abonnés, mais l'API Analytics fournit le
 * solde gagné/perdu sur une période : baseline = abonnés actuels − solde net 30 j.
 * Renvoie null si la donnée n'est pas exploitable (croissance alors redistribuée).
 */
export async function fetchSubscriberBaseline30d(
  token: string,
  currentSubs: number | null,
  now: number = Date.now(),
): Promise<number | null> {
  if (currentSubs == null || currentSubs <= 0) return null
  try {
    const endDate = new Date(now).toISOString().split('T')[0]
    const startDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const res = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=subscribersGained,subscribersLost`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!res.ok) return null
    const data = await res.json()
    const row = data?.rows?.[0]
    if (!row) return null
    const gained = Number(row[0]) || 0
    const lost = Number(row[1]) || 0
    const net = gained - lost
    const baseline = currentSubs - net
    return baseline > 0 ? baseline : null
  } catch {
    return null
  }
}
