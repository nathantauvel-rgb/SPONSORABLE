import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const platform = await prisma.platform.findUnique({
    where: { userId_type: { userId: session.user.id, type: 'tiktok' } },
    select: { id: true, type: true, platformId: true, username: true, displayName: true, avatarUrl: true, stats: true, lastFetched: true },
  })

  if (!platform) {
    return NextResponse.json({ error: 'Plateforme TikTok non connectée' }, { status: 404 })
  }

  return NextResponse.json({ platform })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  await prisma.$transaction([
    prisma.platform.deleteMany({ where: { userId: session.user.id, type: 'tiktok' } }),
    prisma.account.deleteMany({ where: { userId: session.user.id, provider: 'tiktok' } }),
  ])
  return NextResponse.json({ success: true })
}
