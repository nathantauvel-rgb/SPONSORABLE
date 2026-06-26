import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { computeEngagementRate, fetchSubscriberBaseline30d, fetchVideoActivity } from '@/lib/youtubeStats'
import { buildSnapshot, pushHistory, readHistory } from '@/lib/statsHistory'
import { recomputeProfileDenormalization } from '@/lib/profileDenormalize'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const platforms = await prisma.platform.findMany({
    include: {
      user: {
        select: {
          accounts: {
            where: { provider: 'google' },
            select: { access_token: true, refresh_token: true },
          },
        },
      },
    },
  })

  // Get a single Twitch app token for all Twitch platforms
  let twitchAppToken: string | null = null
  const hasTwitch = platforms.some(p => p.type === 'twitch')
  if (hasTwitch) {
    try {
      const r = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.AUTH_TWITCH_ID ?? '',
          client_secret: process.env.AUTH_TWITCH_SECRET ?? '',
          grant_type: 'client_credentials',
        }),
      })
      const data = await r.json()
      twitchAppToken = data.access_token ?? null
    } catch {
      console.error('[cron] Failed to get Twitch app token')
    }
  }

  const results: Record<string, string> = {}

  await Promise.allSettled(platforms.map(async (platform) => {
    try {
      if (platform.type === 'youtube') {
        const account = (platform as typeof platform & { user: { accounts: { access_token: string | null; refresh_token: string | null }[] } }).user.accounts[0]
        if (!account?.access_token) { results[platform.id] = 'no_token'; return }

        const headers = { Authorization: `Bearer ${account.access_token}` }

        const r = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true`,
          { headers }
        )
        if (!r.ok) { results[platform.id] = 'yt_error'; return }
        const data = await r.json()
        const ch = data.items?.[0]
        if (!ch) { results[platform.id] = 'no_stats'; return }

        // Activité vidéo (10 dernières + cadence 90 j) via le helper partagé
        const currentSubs = parseInt(String(ch.statistics.subscriberCount ?? '0')) || 0
        const uploadsId = ch.contentDetails?.relatedPlaylists?.uploads ?? ''
        const { recentVideos, videosLast90Days } = await fetchVideoActivity(account.access_token, uploadsId)
        const engagementRate = computeEngagementRate(recentVideos)
        const subscribers30dAgo = await fetchSubscriberBaseline30d(account.access_token, currentSubs)

        // Fetch YouTube Analytics
        let analytics: Record<string, unknown> = {}
        try {
          const end = new Date().toISOString().split('T')[0]
          const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          const base = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${start}&endDate=${end}`
          const [ovRes, ctRes, dmRes] = await Promise.allSettled([
            fetch(`${base}&metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage`, { headers }),
            fetch(`${base}&metrics=views&dimensions=country&sort=-views&maxResults=5`, { headers }),
            fetch(`${base}&metrics=viewerPercentage&dimensions=ageGroup,gender`, { headers }),
          ])
          const ov = ovRes.status === 'fulfilled' && ovRes.value.ok ? await ovRes.value.json() : null
          const ct = ctRes.status === 'fulfilled' && ctRes.value.ok ? await ctRes.value.json() : null
          const dm = dmRes.status === 'fulfilled' && dmRes.value.ok ? await dmRes.value.json() : null
          const row = ov?.rows?.[0]
          const ageMap: Record<string, number> = {}
          const gMap = { male: 0, female: 0 }
          if (dm?.rows) {
            for (const [age, gender, pct] of dm.rows as [string, string, number][]) {
              ageMap[age] = (ageMap[age] ?? 0) + pct
              if (gender === 'male') gMap.male += pct
              else if (gender === 'female') gMap.female += pct
            }
          }
          analytics = {
            views90d: row?.[0] ?? null,
            avgViewDuration: row?.[2] ? Math.round(row[2]) : null,
            avgViewPercentage: row?.[3] ? Math.round(row[3] * 10) / 10 : null,
            estimatedMinutesWatched: row?.[1] ?? null,
            topCountries: ct?.rows?.map((r: [string, number]) => ({ country: r[0], views: r[1] })) ?? [],
            ageGroups: Object.entries(ageMap).map(([age, pct]) => ({ age, pct: Math.round(pct * 10) / 10 })),
            gender: { male: Math.round(gMap.male * 10) / 10, female: Math.round(gMap.female * 10) / 10 },
          }
        } catch { /* non-blocking */ }

        const videoCount = Number(ch.statistics.videoCount ?? '0')
        const totalViews = Number(ch.statistics.viewCount ?? '0')
        const stats = {
          channelId: ch.id,
          title: ch.snippet.title,
          thumbnail: ch.snippet.thumbnails?.default?.url ?? null,
          channelPublishedAt: ch.snippet.publishedAt ?? null,
          subscriberCount: ch.statistics.subscriberCount ?? '0',
          viewCount: ch.statistics.viewCount ?? '0',
          videoCount: ch.statistics.videoCount ?? '0',
          avgViewsPerVideo: videoCount > 0 ? Math.round(totalViews / videoCount) : null,
          engagementRate,
          recentVideos,
          videosLast90Days,
          subscribers30dAgo,
          analytics,
          lastFetched: new Date().toISOString(),
        }

        const ytStats = { ...stats, history: pushHistory(readHistory(platform.stats), buildSnapshot(stats, 'youtube')) }
        await prisma.platform.update({
          where: { id: platform.id },
          data: { stats: JSON.parse(JSON.stringify(ytStats)), lastFetched: new Date() },
        })
        results[platform.id] = 'ok'
      }

      if (platform.type === 'twitch' && twitchAppToken) {
        const twitchHeaders = { 'Client-Id': process.env.AUTH_TWITCH_ID ?? '', Authorization: `Bearer ${twitchAppToken}` }

        const r = await fetch(
          `https://api.twitch.tv/helix/users?login=${platform.username}`,
          { headers: twitchHeaders }
        )
        if (!r.ok) { results[platform.id] = 'twitch_error'; return }
        const userData = await r.json()
        const user = userData.data?.[0]
        if (!user) { results[platform.id] = 'no_user'; return }

        const [frRes, chRes, vodsRes, clipsRes] = await Promise.allSettled([
          fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`, { headers: twitchHeaders }),
          fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${user.id}`, { headers: twitchHeaders }),
          fetch(`https://api.twitch.tv/helix/videos?user_id=${user.id}&type=archive&first=5`, { headers: twitchHeaders }),
          fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${user.id}&first=5`, { headers: twitchHeaders }),
        ])

        const followerData = frRes.status === 'fulfilled' && frRes.value.ok ? await frRes.value.json() : null
        const channelData = chRes.status === 'fulfilled' && chRes.value.ok ? await chRes.value.json() : null
        const vodsData = vodsRes.status === 'fulfilled' && vodsRes.value.ok ? await vodsRes.value.json() : null
        const clipsData = clipsRes.status === 'fulfilled' && clipsRes.value.ok ? await clipsRes.value.json() : null

        const channel = channelData?.data?.[0]

        type CronTwitchVod = { id: string; title: string; publishedAt: string; duration: string; thumbnail: string | null; viewCount: number }
        type CronTwitchClip = { id: string; title: string; viewCount: number; thumbnail: string | null; createdAt: string; duration: number }

        const recentStreams: CronTwitchVod[] = vodsData?.data?.map((v: { id: string; title: string; published_at: string; duration: string; thumbnail_url: string; view_count: number }) => ({
          id: v.id, title: v.title, publishedAt: v.published_at, duration: v.duration,
          thumbnail: v.thumbnail_url?.replace('%{width}', '320').replace('%{height}', '180') ?? null,
          viewCount: v.view_count,
        })) ?? []

        const topClips: CronTwitchClip[] = clipsData?.data?.map((c: { id: string; title: string; view_count: number; thumbnail_url: string; created_at: string; duration: number }) => ({
          id: c.id, title: c.title, viewCount: c.view_count,
          thumbnail: c.thumbnail_url ?? null, createdAt: c.created_at, duration: c.duration,
        })) ?? []

        const avgVodViews = recentStreams.length > 0
          ? Math.round(recentStreams.reduce((s, v) => s + v.viewCount, 0) / recentStreams.length)
          : null

        // Subscription count (affiliate/partner only)
        let subscriptionCount: number | null = null
        try {
          const subsRes = await fetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${user.id}`, { headers: twitchHeaders })
          if (subsRes.ok) { subscriptionCount = (await subsRes.json()).total ?? null }
        } catch { /* non-affiliate */ }

        const twStats = {
          viewCount: user.view_count,
          followerCount: followerData?.total ?? 0,
          displayName: user.display_name,
          subscriptionCount,
          gameName: channel?.game_name ?? null,
          broadcasterLanguage: channel?.broadcaster_language ?? null,
          tags: channel?.tags ?? [],
          recentStreams,
          topClips,
          avgVodViews,
        }
        const twWithHistory = { ...twStats, history: pushHistory(readHistory(platform.stats), buildSnapshot(twStats, 'twitch')) }
        await prisma.platform.update({
          where: { id: platform.id },
          data: { stats: JSON.parse(JSON.stringify(twWithHistory)), lastFetched: new Date() },
        })
        results[platform.id] = 'ok'
      }
    } catch (err) {
      console.error(`[cron] platform ${platform.id} error`, err)
      results[platform.id] = 'exception'
    }
  }))

  // Recalcule les champs dénormalisés (score/audience) pour chaque créateur dont
  // au moins une plateforme a été rafraîchie — alimente l'annuaire marketplace.
  const userIds = [...new Set(platforms.map((p) => p.userId))]
  await Promise.allSettled(userIds.map((userId) => recomputeProfileDenormalization(userId)))

  return NextResponse.json({ refreshed: results, ts: new Date().toISOString() })
}
