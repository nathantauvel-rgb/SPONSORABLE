import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const platforms = await prisma.platform.findMany({
    select: { id: true, userId: true, type: true, platformId: true, username: true },
    take: 500,
  })

  const results = { youtube: 0, twitch: 0, errors: 0 }

  const youtubeApiKey = process.env.YOUTUBE_API_KEY
  const twitchClientId = process.env.AUTH_TWITCH_ID
  const twitchClientSecret = process.env.AUTH_TWITCH_SECRET

  // Get Twitch app token once for all Twitch platforms
  let twitchToken: string | null = null
  if (twitchClientId && twitchClientSecret) {
    try {
      const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `client_id=${twitchClientId}&client_secret=${twitchClientSecret}&grant_type=client_credentials`,
      })
      const tokenData = await tokenRes.json()
      twitchToken = tokenData.access_token as string
    } catch {
      // continue without Twitch
    }
  }

  await Promise.all(platforms.map(async (p) => {
    try {
      if (p.type === 'youtube' && youtubeApiKey) {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${encodeURIComponent(p.platformId)}&key=${youtubeApiKey}`
        )
        const data = await res.json()
        if (data.items?.[0]) {
          const ch = data.items[0]
          await prisma.platform.update({
            where: { id: p.id },
            data: {
              stats: {
                subscriberCount: ch.statistics.subscriberCount,
                viewCount: ch.statistics.viewCount,
                videoCount: ch.statistics.videoCount,
              },
              lastFetched: new Date(),
            },
          })
          results.youtube++
        }
      }

      if (p.type === 'twitch' && twitchToken && twitchClientId) {
        const userRes = await fetch(
          `https://api.twitch.tv/helix/users?login=${encodeURIComponent(p.username)}`,
          { headers: { 'Client-ID': twitchClientId, Authorization: `Bearer ${twitchToken}` } }
        )
        const userData = await userRes.json()
        if (userData.data?.[0]) {
          const twitchUser = userData.data[0]
          const followerRes = await fetch(
            `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${twitchUser.id}`,
            { headers: { 'Client-ID': twitchClientId, Authorization: `Bearer ${twitchToken}` } }
          )
          const followerData = await followerRes.json()
          await prisma.platform.update({
            where: { id: p.id },
            data: {
              stats: { followerCount: followerData.total ?? 0, viewCount: twitchUser.view_count },
              lastFetched: new Date(),
            },
          })
          results.twitch++
        }
      }
    } catch {
      results.errors++
    }
  }))

  return NextResponse.json({ ok: true, ...results })
}
