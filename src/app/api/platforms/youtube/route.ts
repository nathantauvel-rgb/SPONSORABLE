import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const PostSchema = z.object({
  channelId: z.string().max(64).optional(),
  handle: z.string().max(64).optional(),
}).refine(d => d.channelId || d.handle, { message: 'channelId ou handle requis' })

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const platform = await prisma.platform.findUnique({
    where: { userId_type: { userId: session.user.id, type: 'youtube' } },
    select: { id: true, type: true, platformId: true, username: true, displayName: true, avatarUrl: true, stats: true, lastFetched: true },
  })

  if (!platform) {
    return NextResponse.json({ error: 'Plateforme YouTube non connectée' }, { status: 404 })
  }

  return NextResponse.json({ platform })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Avant de supprimer, récupérer l'avatar Twitch si connecté (fallback photo de profil)
  const twitchPlatform = await prisma.platform.findUnique({
    where: { userId_type: { userId: session.user.id, type: 'twitch' } },
    select: { avatarUrl: true },
  })

  await prisma.$transaction([
    prisma.platform.deleteMany({ where: { userId: session.user.id, type: 'youtube' } }),
    prisma.account.deleteMany({ where: { userId: session.user.id, provider: 'google' } }),
  ])

  // Basculer la photo de profil sur Twitch si disponible, sinon remettre à null
  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: twitchPlatform?.avatarUrl ?? null },
  }).catch(err => console.error('[platforms/youtube DELETE] user image update failed', err))

  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Paramètres invalides' }, { status: 400 })
  }

  const { channelId, handle } = parsed.data

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API non configurée' }, { status: 503 })
  }

  const param = handle
    ? `forHandle=${encodeURIComponent(handle)}`
    : `id=${encodeURIComponent(channelId!)}`

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
    subscriberCount: ch.statistics.subscriberCount as string,
    viewCount: ch.statistics.viewCount as string,
    videoCount: ch.statistics.videoCount as string,
  }

  const platform = await prisma.platform.upsert({
    where: { userId_type: { userId: session.user.id, type: 'youtube' } },
    update: {
      stats,
      lastFetched: new Date(),
      displayName: ch.snippet.title as string,
      platformId: ch.id as string,
      username: (ch.snippet.customUrl || ch.id) as string,
      avatarUrl: ch.snippet.thumbnails?.default?.url as string | undefined,
    },
    create: {
      userId: session.user.id,
      type: 'youtube',
      platformId: ch.id as string,
      username: (ch.snippet.customUrl || ch.id) as string,
      displayName: ch.snippet.title as string,
      avatarUrl: ch.snippet.thumbnails?.default?.url as string | undefined,
      stats,
      lastFetched: new Date(),
    },
  })

  return NextResponse.json({ platform })
}
