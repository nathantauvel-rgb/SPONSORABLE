import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ProfileSchema = z.object({
  slug: z.string().trim().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Pseudo invalide (lettres, chiffres, _ et - uniquement)'),
  displayName: z.string().trim().max(100).optional(),
  bio: z.string().trim().max(1000).optional(),
  niche: z.string().trim().max(200).optional(),
  theme: z.string().trim().max(50).optional(),
  formats: z.array(z.string().trim().max(100)).max(20).optional(),
  showPartnerships: z.boolean().optional(),
  partnerships: z.array(z.object({
    name: z.string().trim().max(200),
    category: z.string().trim().max(100),
    result: z.string().trim().max(500),
    date: z.string().trim().max(50),
  })).max(50).optional(),
  bannerUrl: z.string().trim().max(2048).optional(),
  calendlyUrl: z.string().trim().max(2048).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json({ profile })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = ProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 })
  }

  const { slug, ...rest } = parsed.data

  // Check slug uniqueness (excluding current user)
  const existing = await prisma.profile.findUnique({ where: { slug } })
  if (existing && existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Ce pseudo est déjà pris' }, { status: 409 })
  }

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: { slug, ...rest },
    create: { userId: session.user.id, slug, ...rest },
  })

  return NextResponse.json({ profile })
}
