import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

async function refreshTwitchToken(account: { id: string; refresh_token: string | null }) {
  if (!account.refresh_token) return null
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AUTH_TWITCH_ID!,
      client_secret: process.env.AUTH_TWITCH_SECRET!,
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
      refresh_token: tokens.refresh_token ?? account.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 14400),
    },
  })
  return tokens.access_token as string
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: 'twitch' },
  })

  if (!account?.access_token) {
    return NextResponse.json({ error: 'Compte Twitch non lié' }, { status: 404 })
  }

  let token = account.access_token

  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    const refreshed = await refreshTwitchToken(account)
    if (!refreshed) {
      return NextResponse.json({ error: 'Token expiré, reconnecte-toi avec Twitch' }, { status: 401 })
    }
    token = refreshed
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Client-Id': process.env.AUTH_TWITCH_ID!,
  }

  const userRes = await fetch('https://api.twitch.tv/helix/users', { headers })
  const userData = await userRes.json()

  if (!userData.data?.length) {
    return NextResponse.json({ error: 'Utilisateur Twitch introuvable' }, { status: 404 })
  }

  const user = userData.data[0]

  // Fetch all enriched data in parallel
  const [followersRes, channelRes, vodsRes, clipsRes] = await Promise.allSettled([
    fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`, { headers }),
    fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${user.id}`, { headers }),
    fetch(`https://api.twitch.tv/helix/videos?user_id=${user.id}&type=archive&first=5`, { headers }),
    fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${user.id}&first=5`, { headers }),
  ])

  const followersData = followersRes.status === 'fulfilled' && followersRes.value.ok
    ? await followersRes.value.json() : null
  const channelData = channelRes.status === 'fulfilled' && channelRes.value.ok
    ? await channelRes.value.json() : null
  const vodsData = vodsRes.status === 'fulfilled' && vodsRes.value.ok
    ? await vodsRes.value.json() : null
  const clipsData = clipsRes.status === 'fulfilled' && clipsRes.value.ok
    ? await clipsRes.value.json() : null

  const channel = channelData?.data?.[0]

  // Subscription count — only available for Twitch affiliates/partners
  let subscriptionCount: number | null = null
  try {
    const subsRes = await fetch(
      `https://api.twitch.tv/helix/subscriptions?broadcaster_id=${user.id}`,
      { headers }
    )
    if (subsRes.ok) {
      const subsData = await subsRes.json()
      subscriptionCount = subsData.total ?? null
    }
  } catch { /* non-affiliate channels don't have subscriptions */ }

  type TwitchVod = { id: string; title: string; publishedAt: string; duration: string; thumbnail: string | null; viewCount: number }
  type TwitchClip = { id: string; title: string; viewCount: number; thumbnail: string | null; createdAt: string; duration: number }

  const recentStreams: TwitchVod[] = vodsData?.data?.map((v: {
    id: string; title: string; published_at: string; duration: string;
    thumbnail_url: string; view_count: number
  }) => ({
    id: v.id,
    title: v.title,
    publishedAt: v.published_at,
    duration: v.duration,
    thumbnail: v.thumbnail_url?.replace('%{width}', '320').replace('%{height}', '180') ?? null,
    viewCount: v.view_count,
  })) ?? []

  const topClips: TwitchClip[] = clipsData?.data?.map((c: {
    id: string; title: string; view_count: number;
    thumbnail_url: string; created_at: string; duration: number
  }) => ({
    id: c.id,
    title: c.title,
    viewCount: c.view_count,
    thumbnail: c.thumbnail_url ?? null,
    createdAt: c.created_at,
    duration: c.duration,
  })) ?? []

  // Total VOD views across recent streams
  const totalVodViews = recentStreams.reduce((sum, v) => sum + v.viewCount, 0)
  const avgVodViews = recentStreams.length > 0 ? Math.round(totalVodViews / recentStreams.length) : null

  const result = {
    userId: user.id,
    login: user.login,
    displayName: user.display_name,
    profileImageUrl: user.profile_image_url,
    viewCount: user.view_count ?? 0,
    followerCount: followersData?.total ?? 0,
    subscriptionCount,
    gameName: channel?.game_name ?? null,
    broadcasterLanguage: channel?.broadcaster_language ?? null,
    tags: channel?.tags ?? [],
    recentStreams,
    topClips,
    avgVodViews,
    lastFetched: new Date().toISOString(),
  }

  // Persist to Platform DB
  await prisma.platform.upsert({
    where: { userId_type: { userId: session.user.id, type: 'twitch' } },
    update: { stats: JSON.parse(JSON.stringify(result)), lastFetched: new Date() },
    create: {
      userId: session.user.id,
      type: 'twitch',
      platformId: user.id,
      username: user.login,
      displayName: user.display_name,
      avatarUrl: user.profile_image_url ?? undefined,
      stats: JSON.parse(JSON.stringify(result)),
      lastFetched: new Date(),
    },
  }).catch(err => console.error('[twitch/channel] upsert failed', err))

  return NextResponse.json(result)
}
