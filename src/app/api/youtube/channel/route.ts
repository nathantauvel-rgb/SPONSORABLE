import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

async function refreshGoogleToken(account: { id: string; refresh_token: string | null }) {
  if (!account.refresh_token) return null
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: account.refresh_token,
    }),
  })
  const tokens = await res.json()
  if (!tokens.access_token) return null
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: tokens.access_token,
      expires_at: Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 3600),
    },
  })
  return tokens.access_token as string
}

type VideoItem = {
  id: string
  title: string
  publishedAt: string
  thumbnail: string | null
  viewCount: string
  likeCount: string
  commentCount: string
}

function computeEngagementRate(videos: VideoItem[]): number | null {
  const valid = videos.filter(v => Number(v.viewCount) > 0)
  if (!valid.length) return null
  const rates = valid.map(v =>
    (Number(v.likeCount) + Number(v.commentCount)) / Number(v.viewCount) * 100
  )
  const avg = rates.reduce((a, b) => a + b, 0) / rates.length
  return Math.round(avg * 100) / 100
}

async function fetchRecentVideos(token: string, uploadsPlaylistId: string): Promise<VideoItem[]> {
  try {
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const playlistData = await playlistRes.json()
    if (!playlistData.items?.length) return []

    const videoIds = playlistData.items.map((i: { contentDetails: { videoId: string } }) => i.contentDetails.videoId).join(',')
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const videosData = await videosRes.json()
    if (!videosData.items?.length) return []

    return videosData.items.map((v: { id: string; snippet: { title: string; publishedAt: string; thumbnails?: { medium?: { url: string } } }; statistics: { viewCount?: string; likeCount?: string; commentCount?: string } }) => ({
      id: v.id,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      thumbnail: v.snippet.thumbnails?.medium?.url ?? null,
      viewCount: v.statistics.viewCount ?? '0',
      likeCount: v.statistics.likeCount ?? '0',
      commentCount: v.statistics.commentCount ?? '0',
    }))
  } catch {
    return []
  }
}

async function fetchYouTubeAnalytics(token: string) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const base = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}`
  const headers = { Authorization: `Bearer ${token}` }

  const [overviewRes, countriesRes, demographicsRes] = await Promise.allSettled([
    fetch(`${base}&metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage`, { headers }),
    fetch(`${base}&metrics=views&dimensions=country&sort=-views&maxResults=5`, { headers }),
    fetch(`${base}&metrics=viewerPercentage&dimensions=ageGroup,gender`, { headers }),
  ])

  const overview = overviewRes.status === 'fulfilled' && overviewRes.value.ok
    ? await overviewRes.value.json() : null
  const countries = countriesRes.status === 'fulfilled' && countriesRes.value.ok
    ? await countriesRes.value.json() : null
  const demographics = demographicsRes.status === 'fulfilled' && demographicsRes.value.ok
    ? await demographicsRes.value.json() : null

  const overviewRow = overview?.rows?.[0]

  // Parse countries
  const topCountries = countries?.rows?.map((r: [string, number]) => ({ country: r[0], views: r[1] })) ?? []

  // Parse demographics: rows are [ageGroup, gender, viewerPercentage]
  const ageMap: Record<string, number> = {}
  const genderMap: Record<string, number> = { male: 0, female: 0 }
  if (demographics?.rows) {
    for (const [age, gender, pct] of demographics.rows as [string, string, number][]) {
      ageMap[age] = (ageMap[age] ?? 0) + pct
      if (gender === 'male') genderMap.male += pct
      else if (gender === 'female') genderMap.female += pct
    }
  }

  return {
    views90d: overviewRow?.[0] ?? null,
    avgViewDuration: overviewRow?.[2] ? Math.round(overviewRow[2]) : null,
    avgViewPercentage: overviewRow?.[3] ? Math.round(overviewRow[3] * 10) / 10 : null,
    estimatedMinutesWatched: overviewRow?.[1] ?? null,
    topCountries,
    ageGroups: Object.entries(ageMap).map(([age, pct]) => ({ age, pct: Math.round(pct * 10) / 10 })),
    gender: {
      male: Math.round(genderMap.male * 10) / 10,
      female: Math.round(genderMap.female * 10) / 10,
    },
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: 'google' },
  })

  if (!account?.access_token) {
    return NextResponse.json({ error: 'Compte Google non lié' }, { status: 404 })
  }

  let token = account.access_token

  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    const refreshed = await refreshGoogleToken(account)
    if (!refreshed) {
      return NextResponse.json({ error: 'Token expiré, reconnecte-toi avec Google' }, { status: 401 })
    }
    token = refreshed
  }

  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()

  if (data.error) {
    if (data.error.code === 401) {
      const refreshed = await refreshGoogleToken(account)
      if (refreshed) {
        const retry = await fetch(
          'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true',
          { headers: { Authorization: `Bearer ${refreshed}` } }
        )
        const retryData = await retry.json()
        if (!retryData.error && retryData.items?.length) {
          token = refreshed
          const ch = retryData.items[0]
          const [videos, analytics] = await Promise.all([
            fetchRecentVideos(token, ch.contentDetails?.relatedPlaylists?.uploads ?? ''),
            fetchYouTubeAnalytics(token),
          ])
          const result = formatChannel(ch, videos, analytics)
          await prisma.platform.upsert({
            where: { userId_type: { userId: session.user.id, type: 'youtube' } },
            update: { stats: JSON.parse(JSON.stringify(result)), lastFetched: new Date() },
            create: {
              userId: session.user.id,
              type: 'youtube',
              platformId: ch.id as string,
              username: (ch.snippet.customUrl || ch.id) as string,
              displayName: ch.snippet.title as string,
              avatarUrl: ch.snippet.thumbnails?.default?.url as string | undefined,
              stats: JSON.parse(JSON.stringify(result)),
              lastFetched: new Date(),
            },
          }).catch(err => console.error('[youtube/channel] upsert failed', err))
          return NextResponse.json(result)
        }
      }
    }
    return NextResponse.json({ error: data.error.message }, { status: 400 })
  }

  if (!data.items?.length) {
    return NextResponse.json({ error: 'Aucune chaîne YouTube associée à ce compte' }, { status: 404 })
  }

  const ch = data.items[0]
  const uploadsPlaylistId = ch.contentDetails?.relatedPlaylists?.uploads ?? ''

  const [videos, analytics] = await Promise.all([
    fetchRecentVideos(token, uploadsPlaylistId),
    fetchYouTubeAnalytics(token),
  ])

  const result = formatChannel(ch, videos, analytics)

  // Persist to Platform DB so the public media kit can display enriched data
  await prisma.platform.upsert({
    where: { userId_type: { userId: session.user.id, type: 'youtube' } },
    update: { stats: JSON.parse(JSON.stringify(result)), lastFetched: new Date() },
    create: {
      userId: session.user.id,
      type: 'youtube',
      platformId: ch.id as string,
      username: (ch.snippet.customUrl || ch.id) as string,
      displayName: ch.snippet.title as string,
      avatarUrl: ch.snippet.thumbnails?.default?.url as string | undefined,
      stats: JSON.parse(JSON.stringify(result)),
      lastFetched: new Date(),
    },
  }).catch(err => console.error('[youtube/channel] upsert failed', err))

  return NextResponse.json(result)
}

function formatChannel(
  ch: { id: string; snippet: { title: string; thumbnails?: { default?: { url: string } } }; statistics: { subscriberCount?: string; viewCount?: string; videoCount?: string } },
  videos: VideoItem[],
  analytics: object,
) {
  const videoCount = Number(ch.statistics.videoCount ?? '0')
  const totalViews = Number(ch.statistics.viewCount ?? '0')
  const avgViewsPerVideo = videoCount > 0 ? Math.round(totalViews / videoCount) : null
  const engagementRate = computeEngagementRate(videos)

  return {
    channelId: ch.id,
    title: ch.snippet.title,
    thumbnail: ch.snippet.thumbnails?.default?.url ?? null,
    subscriberCount: ch.statistics.subscriberCount ?? '0',
    viewCount: ch.statistics.viewCount ?? '0',
    videoCount: ch.statistics.videoCount ?? '0',
    avgViewsPerVideo,
    engagementRate,
    recentVideos: videos,
    analytics,
    lastFetched: new Date().toISOString(),
  }
}
