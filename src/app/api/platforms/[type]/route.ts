import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type PlatformType = 'youtube' | 'twitch'
const ALLOWED_TYPES = ['youtube', 'twitch'] as const
const PROVIDER_MAP: Record<PlatformType, string> = { youtube: 'google', twitch: 'twitch' }

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { type } = await params
  if (!ALLOWED_TYPES.includes(type as PlatformType)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  }

  const platform = await prisma.platform.findUnique({
    where: { userId_type: { userId: session.user.id, type: type as PlatformType } },
    select: { id: true, type: true, platformId: true, username: true, displayName: true, avatarUrl: true, stats: true, lastFetched: true },
  })

  if (!platform) {
    return NextResponse.json({ error: 'Plateforme non connectée' }, { status: 404 })
  }

  return NextResponse.json({ platform })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { type } = await params
  if (!ALLOWED_TYPES.includes(type as PlatformType)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  }

  const platformType = type as PlatformType
  const userId = session.user.id

  await prisma.$transaction([
    prisma.platform.deleteMany({ where: { userId, type: platformType } }),
    prisma.account.deleteMany({ where: { userId, provider: PROVIDER_MAP[platformType] } }),
  ])

  return NextResponse.json({ success: true })
}
