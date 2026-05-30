import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const cookieHeader = req.headers.get('cookie') ?? ''
  const baseUrl = process.env.NEXTAUTH_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const platforms = await prisma.platform.findMany({
    where: { userId: session.user.id },
    select: { type: true, platformId: true, username: true },
  })

  const results: Record<string, string> = {}

  await Promise.all(platforms.map(async (platform) => {
    try {
      if (platform.type === 'youtube') {
        const res = await fetch(`${baseUrl}/api/platforms/youtube`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
          body: JSON.stringify({ channelId: platform.platformId }),
        })
        results.youtube = res.ok ? 'ok' : 'error'
      }
      if (platform.type === 'twitch') {
        const res = await fetch(`${baseUrl}/api/platforms/twitch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
          body: JSON.stringify({ username: platform.username }),
        })
        results.twitch = res.ok ? 'ok' : 'error'
      }
    } catch {
      results[platform.type] = 'error'
    }
  }))

  return NextResponse.json({ refreshed: results })
}
