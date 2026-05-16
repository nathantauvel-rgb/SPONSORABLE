import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const platforms = await prisma.platform.findMany({
    where: { userId: session.user.id },
  })

  const results: Record<string, string> = {}

  for (const platform of platforms) {
    try {
      if (platform.type === 'youtube') {
        const res = await fetch(
          `/api/platforms/youtube`,
          { method: 'POST', body: JSON.stringify({ channelId: platform.platformId }) }
        )
        results.youtube = res.ok ? 'ok' : 'error'
      }
      if (platform.type === 'twitch') {
        const res = await fetch(
          `/api/platforms/twitch`,
          { method: 'POST', body: JSON.stringify({ username: platform.username }) }
        )
        results.twitch = res.ok ? 'ok' : 'error'
      }
    } catch {
      results[platform.type] = 'error'
    }
  }

  return NextResponse.json({ refreshed: results })
}
