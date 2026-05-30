import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const platforms = await prisma.platform.findMany({
    where: { userId },
    select: { type: true, platformId: true, username: true },
    take: 20,
  })

  const results: Record<string, string> = {}

  // Refresh directement sans passer par HTTP interne pour éviter la propagation du cookie client
  await Promise.all(platforms.map(async (platform) => {
    try {
      if (platform.type === 'youtube') {
        const apiKey = process.env.YOUTUBE_API_KEY
        if (!apiKey) { results.youtube = 'error'; return }
        const param = `id=${encodeURIComponent(platform.platformId)}`
        const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&${param}&key=${apiKey}`)
        const data = await res.json()
        if (data.items?.length) {
          const ch = data.items[0]
          await prisma.platform.update({
            where: { userId_type: { userId, type: 'youtube' } },
            data: {
              stats: {
                subscriberCount: ch.statistics.subscriberCount,
                viewCount: ch.statistics.viewCount,
                videoCount: ch.statistics.videoCount,
              },
              lastFetched: new Date(),
            },
          })
          results.youtube = 'ok'
        } else {
          results.youtube = 'error'
        }
      }
      if (platform.type === 'twitch') {
        const clientId = process.env.AUTH_TWITCH_ID
        const clientSecret = process.env.AUTH_TWITCH_SECRET
        if (!clientId || !clientSecret) { results.twitch = 'error'; return }
        const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
        })
        const { access_token } = await tokenRes.json()
        const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(platform.username)}`, {
          headers: { 'Client-ID': clientId, Authorization: `Bearer ${access_token}` },
        })
        const userData = await userRes.json()
        if (userData.data?.[0]) {
          const twitchUser = userData.data[0]
          const followerRes = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${twitchUser.id}`, {
            headers: { 'Client-ID': clientId, Authorization: `Bearer ${access_token}` },
          })
          const followerData = await followerRes.json()
          await prisma.platform.update({
            where: { userId_type: { userId, type: 'twitch' } },
            data: {
              stats: { followerCount: followerData.total ?? 0, viewCount: twitchUser.view_count },
              lastFetched: new Date(),
            },
          })
          results.twitch = 'ok'
        } else {
          results.twitch = 'error'
        }
      }
    } catch {
      results[platform.type] = 'error'
    }
  }))

  return NextResponse.json({ refreshed: results })
}
