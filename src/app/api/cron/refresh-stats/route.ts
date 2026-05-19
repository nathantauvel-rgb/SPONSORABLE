import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

        const r = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true`,
          { headers: { Authorization: `Bearer ${account.access_token}` } }
        )
        if (!r.ok) { results[platform.id] = 'yt_error'; return }
        const data = await r.json()
        const stats = data.items?.[0]?.statistics
        if (!stats) { results[platform.id] = 'no_stats'; return }

        await prisma.platform.update({
          where: { id: platform.id },
          data: { stats, lastFetched: new Date() },
        })
        results[platform.id] = 'ok'
      }

      if (platform.type === 'twitch' && twitchAppToken) {
        const r = await fetch(
          `https://api.twitch.tv/helix/users?login=${platform.username}`,
          { headers: { 'Client-Id': process.env.AUTH_TWITCH_ID ?? '', Authorization: `Bearer ${twitchAppToken}` } }
        )
        if (!r.ok) { results[platform.id] = 'twitch_error'; return }
        const userData = await r.json()
        const user = userData.data?.[0]
        if (!user) { results[platform.id] = 'no_user'; return }

        const fr = await fetch(
          `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`,
          { headers: { 'Client-Id': process.env.AUTH_TWITCH_ID ?? '', Authorization: `Bearer ${twitchAppToken}` } }
        )
        const followerData = fr.ok ? await fr.json() : null

        await prisma.platform.update({
          where: { id: platform.id },
          data: {
            stats: {
              viewCount: user.view_count,
              followerCount: followerData?.total ?? 0,
              displayName: user.display_name,
            },
            lastFetched: new Date(),
          },
        })
        results[platform.id] = 'ok'
      }
    } catch (err) {
      console.error(`[cron] platform ${platform.id} error`, err)
      results[platform.id] = 'exception'
    }
  }))

  return NextResponse.json({ refreshed: results, ts: new Date().toISOString() })
}
