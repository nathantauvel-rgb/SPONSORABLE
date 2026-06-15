import { auth } from '@/auth'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { buildSnapshot, pushHistory, readHistory } from '@/lib/statsHistory'
import { NextResponse } from 'next/server'

// ⚠️ Non vérifié en conditions réelles : nécessite une app TikTok approuvée
// (scopes user.info.stats + video.list). Le mapping des champs peut demander un
// ajustement après un premier test avec de vraies clés AUTH_TIKTOK_ID/SECRET.

async function refreshTikTokToken(account: { id: string; refresh_token: string | null }) {
  if (!account.refresh_token) return null
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.AUTH_TIKTOK_ID ?? '',
      client_secret: process.env.AUTH_TIKTOK_SECRET ?? '',
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
      expires_at: Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 86400),
    },
  })
  return tokens.access_token as string
}

type TikTokVideo = { id: string; title: string; viewCount: number; likeCount: number; commentCount: number; shareCount: number; createdAt: number }

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: 'tiktok' },
  })
  if (!account?.access_token) {
    return NextResponse.json({ error: 'Compte TikTok non lié' }, { status: 404 })
  }

  let token = account.access_token
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    const refreshed = await refreshTikTokToken(account)
    if (!refreshed) return NextResponse.json({ error: 'Token expiré, reconnecte-toi avec TikTok' }, { status: 401 })
    token = refreshed
  }

  const headers = { Authorization: `Bearer ${token}` }

  // Infos de profil (follower_count nécessite le scope user.info.stats)
  const userRes = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,follower_count,likes_count,video_count',
    { headers },
  )
  const userJson = await userRes.json()
  const user = userJson?.data?.user
  if (!userRes.ok || !user) {
    return NextResponse.json({ error: 'Impossible de récupérer le profil TikTok.' }, { status: 400 })
  }

  // Vidéos récentes (engagement)
  let videos: TikTokVideo[] = []
  try {
    const vidRes = await fetch(
      'https://open.tiktokapis.com/v2/video/list/?fields=id,title,view_count,like_count,comment_count,share_count,create_time',
      { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ max_count: 20 }) },
    )
    const vidJson = vidRes.ok ? await vidRes.json() : null
    videos = (vidJson?.data?.videos ?? []).map((v: Record<string, unknown>) => ({
      id: String(v.id),
      title: String(v.title ?? ''),
      viewCount: Number(v.view_count ?? 0),
      likeCount: Number(v.like_count ?? 0),
      commentCount: Number(v.comment_count ?? 0),
      shareCount: Number(v.share_count ?? 0),
      createdAt: Number(v.create_time ?? 0),
    }))
  } catch { /* video.list peut ne pas être approuvé : on continue sans */ }

  // Taux d'engagement TikTok : (likes + commentaires + partages) / vues
  const withViews = videos.filter(v => v.viewCount > 0)
  const engagementRate = withViews.length
    ? Math.round((withViews.reduce((s, v) => s + (v.likeCount + v.commentCount + v.shareCount) / v.viewCount * 100, 0) / withViews.length) * 100) / 100
    : null

  // Cadence sur 90 j (create_time est en secondes epoch)
  const now = Date.now()
  const videosLast90Days = videos.filter(v => v.createdAt > 0 && now - v.createdAt * 1000 <= 90 * 24 * 60 * 60 * 1000).length

  const result = {
    displayName: user.display_name ?? null,
    avatarUrl: user.avatar_url ?? null,
    followerCount: Number(user.follower_count ?? 0),
    likesCount: Number(user.likes_count ?? 0),
    videoCount: Number(user.video_count ?? 0),
    engagementRate,
    recentVideos: videos.slice(0, 10),
    videosLast90Days,
    lastFetched: new Date().toISOString(),
  }

  const prev = await prisma.platform.findUnique({
    where: { userId_type: { userId: session.user.id, type: 'tiktok' } },
    select: { stats: true },
  })
  const stored = { ...result, history: pushHistory(readHistory(prev?.stats), buildSnapshot(result, 'tiktok')) }
  const avatar = (user.avatar_url as string | undefined) ?? undefined

  await prisma.platform.upsert({
    where: { userId_type: { userId: session.user.id, type: 'tiktok' } },
    update: { stats: JSON.parse(JSON.stringify(stored)), lastFetched: new Date(), avatarUrl: avatar },
    create: {
      userId: session.user.id,
      type: 'tiktok',
      platformId: (user.open_id as string) ?? 'tiktok',
      username: (user.display_name as string) ?? 'tiktok',
      displayName: (user.display_name as string) ?? null,
      avatarUrl: avatar,
      stats: JSON.parse(JSON.stringify(stored)),
      lastFetched: new Date(),
    },
  }).catch(err => console.error('[tiktok/channel] upsert failed', err))

  return NextResponse.json(result)
}
