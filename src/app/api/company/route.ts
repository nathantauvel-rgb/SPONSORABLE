import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Profil marque édité par son propriétaire. `isVerified` n'est PAS modifiable ici
// (flag de vérification manuelle anti-fake, posé côté admin — cf. Lot F).
const CompanySchema = z.object({
  name: z.string().trim().min(1).max(150),
  sector: z.string().max(100).optional().nullable(),
  logoUrl: z.string().max(2048).optional().nullable(),
  website: z.string().max(2048).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  budgetMinEur: z.number().int().min(0).max(100_000_000).optional().nullable(),
  budgetMaxEur: z.number().int().min(0).max(100_000_000).optional().nullable(),
  preferredGames: z.array(z.string().max(60)).max(30).optional(),
  preferredLanguages: z.array(z.string().max(20)).max(10).optional(),
  targetAudienceAgeMin: z.number().int().min(0).max(120).optional().nullable(),
  targetAudienceAgeMax: z.number().int().min(0).max(120).optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json({ company })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Réservé aux comptes marque : un créateur n'a pas de profil entreprise à éditer.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accountType: true },
  })
  if (user?.accountType !== 'company') {
    return NextResponse.json({ error: 'Réservé aux comptes marque' }, { status: 403 })
  }

  const parsed = CompanySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  // Cohérence budgets : si les deux sont fournis, min ≤ max.
  if (
    data.budgetMinEur != null &&
    data.budgetMaxEur != null &&
    data.budgetMinEur > data.budgetMaxEur
  ) {
    return NextResponse.json({ error: 'Le budget minimum dépasse le maximum' }, { status: 400 })
  }
  if (
    data.targetAudienceAgeMin != null &&
    data.targetAudienceAgeMax != null &&
    data.targetAudienceAgeMin > data.targetAudienceAgeMax
  ) {
    return NextResponse.json({ error: "L'âge minimum dépasse l'âge maximum" }, { status: 400 })
  }

  const company = await prisma.company.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  })

  return NextResponse.json({ company })
}
