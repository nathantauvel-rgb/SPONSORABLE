import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recomputeProfileDenormalization } from '@/lib/profileDenormalize'
import { z } from 'zod'

const ProfileSchema = z.object({
  slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  displayName: z.string().max(80).optional(),
  bio: z.string().max(500).optional(),
  niche: z.string().max(200).optional(),
  theme: z.string().max(64).optional(),
  formats: z.array(z.string()).max(10).optional(),
  showPartnerships: z.boolean().optional(),
  partnerships: z.array(z.object({
    name: z.string(),
    category: z.string(),
    result: z.string(),
    date: z.string(),
  })).max(50).optional(),
  bannerUrl: z.string().max(2048).optional(),
  calendlyUrl: z.string().max(2048).optional(),
  twitterHandle: z.string().max(64).optional().nullable(),
  instagramHandle: z.string().max(64).optional().nullable(),
  tiktokHandle: z.string().max(64).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  languages: z.array(z.string()).max(10).optional(),
  contentStyle: z.string().max(100).optional().nullable(),
  targetBrands: z.string().max(300).optional().nullable(),
  availableForCollabs: z.boolean().optional(),
  positioningPhrase: z.string().max(300).optional().nullable(),
  sponsorSummary: z.string().max(600).optional().nullable(),
  isPublic: z.boolean().optional(),
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
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }

  const { slug, ...rest } = parsed.data

  const existing = await prisma.profile.findUnique({ where: { slug } })
  if (existing && existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Ce pseudo est déjà pris' }, { status: 409 })
  }

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, slug, ...rest },
    update: { slug, ...rest },
  })

  // Recalcule les champs dénormalisés (score/audience) pour l'annuaire : la
  // complétude éditoriale et la dispo collab font partie du score.
  await recomputeProfileDenormalization(session.user.id)

  return NextResponse.json({ profile })
}
