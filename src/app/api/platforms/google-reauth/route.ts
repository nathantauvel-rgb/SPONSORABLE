import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * DELETE — supprime le compte Google OAuth stocké.
 * Le prochain signIn('google') créera un nouveau token avec tous les scopes YouTube.
 */
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  await prisma.account.deleteMany({
    where: { userId: session.user.id, provider: 'google' },
  })

  return NextResponse.json({ ok: true })
}
