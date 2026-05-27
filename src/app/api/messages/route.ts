import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!profile) return NextResponse.json({ messages: [] })

  const messages = await prisma.message.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ messages })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id, read } = await req.json()

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id }, select: { id: true } })
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const message = await prisma.message.findFirst({ where: { id, profileId: profile.id } })
  if (!message) return NextResponse.json({ error: 'Message introuvable' }, { status: 404 })

  const updated = await prisma.message.update({ where: { id }, data: { read } })
  return NextResponse.json({ message: updated })
}
