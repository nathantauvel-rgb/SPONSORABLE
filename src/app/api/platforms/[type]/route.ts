import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ALLOWED_TYPES = ['youtube', 'twitch'] as const
type PlatformType = typeof ALLOWED_TYPES[number]

const PROVIDER_MAP: Record<PlatformType, string> = {
  youtube: 'google',
  twitch: 'twitch',
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { type } = await params
  if (!ALLOWED_TYPES.includes(type as PlatformType)) {
    return NextResponse.json({ error: 'Type de plateforme invalide' }, { status: 400 })
  }

  const platformType = type as PlatformType
  const userId = session.user.id

  await prisma.$transaction([
    prisma.platform.deleteMany({ where: { userId, type: platformType } }),
    prisma.account.deleteMany({ where: { userId, provider: PROVIDER_MAP[platformType] } }),
  ])

  return NextResponse.json({ success: true })
}
