import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Cascade: Account, Session, Platform, Profile (+ Messages, PageViews) supprimés automatiquement
  await prisma.user.delete({ where: { id: session.user.id } })

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      stripeSubscriptionStatus: true,
      password: true,
      platforms: {
        select: { type: true, stats: true },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  const isPro = user.stripeSubscriptionStatus === 'active' || user.stripeSubscriptionStatus === 'trialing'
  const hasPassword = !!user.password

  return NextResponse.json({ isPro, hasPassword, platforms: user.platforms })
}
