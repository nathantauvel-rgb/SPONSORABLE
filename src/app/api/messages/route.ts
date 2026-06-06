import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const PatchSchema = z.object({ id: z.string().min(1).max(64), read: z.boolean() })

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!profile) return NextResponse.json({ messages: [] })

  // Borné : évite de charger des milliers de messages d'un coup.
  const messages = await prisma.message.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ messages })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const parsed = PatchSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  const { id, read } = parsed.data

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id }, select: { id: true } })
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  // updateMany avec where composite : atomique + garantit l'ownership (pas de TOCTOU).
  const result = await prisma.message.updateMany({
    where: { id, profileId: profile.id },
    data: { read },
  })
  if (result.count === 0) return NextResponse.json({ error: 'Message introuvable' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
