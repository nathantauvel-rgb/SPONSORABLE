import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isProStatus } from '@/lib/subscription'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeSubscriptionStatus: true },
  })

  const isPro = isProStatus(user?.stripeSubscriptionStatus)
  return NextResponse.json({ plan: isPro ? 'pro' : 'free', status: user?.stripeSubscriptionStatus ?? 'free' })
}
