import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const platform = await prisma.platform.findUnique({
    where: { userId_type: { userId: session.user.id, type: 'youtube' } },
  })

  if (!platform) {
    return NextResponse.json({ error: 'Plateforme YouTube non connectée' }, { status: 404 })
  }

  return NextResponse.json({ platform })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { channelId, handle } = await req.json()
  if (!channelId && !handle) {
    return NextResponse.json({ error: 'channelId ou handle requis' }, { status: 400 })
  }

  // Les clés API YouTube restent côté serveur — jamais exposées au client
  const apiKey = process.env.GOOGLE_CLIENT_SECRET
  const param = handle
    ? `forHandle=${encodeURIComponent(handle)}`
    : `id=${channelId}`

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&${param}&key=${apiKey}`
  )
  const data = await res.json()

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 400 })
  }
  if (!data.items?.length) {
    return NextResponse.json({ error: 'Chaîne introuvable' }, { status: 404 })
  }

  const ch = data.items[0]
  const stats = {
    subscriberCount: ch.statistics.subscriberCount,
    viewCount: ch.statistics.viewCount,
    videoCount: ch.statistics.videoCount,
  }

  const platform = await prisma.platform.upsert({
    where: { userId_type: { userId: session.user.id, type: 'youtube' } },
    update: { stats, lastFetched: new Date(), displayName: ch.snippet.title, platformId: ch.id, username: ch.snippet.customUrl || ch.id, avatarUrl: ch.snippet.thumbnails?.default?.url },
    create: { userId: session.user.id, type: 'youtube', platformId: ch.id, username: ch.snippet.customUrl || ch.id, displayName: ch.snippet.title, avatarUrl: ch.snippet.thumbnails?.default?.url, stats, lastFetched: new Date() },
  })

  return NextResponse.json({ platform })
}
