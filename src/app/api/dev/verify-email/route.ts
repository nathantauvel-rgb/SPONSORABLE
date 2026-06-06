import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Empêche Next de pré-rendre/collecter cette route au build (elle utilise Prisma)
export const dynamic = 'force-dynamic'

// Route DEV ONLY — force-vérifie un email sans token
// Ne jamais exposer en production
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Non disponible en production' }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, emailVerified: true } })
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  if (user.emailVerified) {
    return NextResponse.json({ ok: true, message: 'Email déjà vérifié' })
  }

  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } })
  return NextResponse.json({ ok: true, message: `Email vérifié pour ${email}` })
}
