import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Annuaire créateurs — réservé aux comptes marque.
// Filtres : jeu, langue, taille d'audience minimale, "prêt pour le sponsoring".
// IMPORTANT : le score de sponsorabilité est PRIVÉ (promesse faite aux créateurs).
// On l'utilise pour TRIER et pour le filtre "sponsor-ready", mais on ne le renvoie
// JAMAIS dans la réponse (cf. décision produit : filtre caché).

// Seuil "prêt pour le sponsoring" = Grade 2 du moteur de score ("Prêt à démarcher").
const SPONSOR_READY_MIN = 40
const PAGE_SIZE = 12
// Borne dure : on ne charge jamais plus que ça avant le filtrage langue en mémoire.
const MAX_SCAN = 200

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  // L'annuaire est l'outil des marques.
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accountType: true },
  })
  if (me?.accountType !== 'company') {
    return NextResponse.json({ error: 'Réservé aux comptes marque' }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const game = sp.get('game')?.trim() || null
  const lang = sp.get('lang')?.trim() || null
  const minAudience = Number.parseInt(sp.get('minAudience') ?? '', 10)
  const sponsorReady = sp.get('sponsorReady') === '1'
  const q = sp.get('q')?.trim() || null
  const page = Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10) || 1)

  // Filtres exprimables en SQL (rapides via les champs dénormalisés du Profile).
  const where: Prisma.ProfileWhereInput = { isPublic: true }
  if (game) where.games = { has: game }
  if (Number.isFinite(minAudience) && minAudience > 0) where.audienceTotal = { gte: minAudience }
  if (sponsorReady) where.sponsorScore = { gte: SPONSOR_READY_MIN }
  if (q) {
    where.OR = [
      { displayName: { contains: q, mode: 'insensitive' } },
      { niche: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
    ]
  }

  // Tri par score décroissant (caché) : les meilleurs profils en tête, nulls en dernier.
  const rows = await prisma.profile.findMany({
    where,
    orderBy: [{ sponsorScore: { sort: 'desc', nulls: 'last' } }, { audienceTotal: { sort: 'desc', nulls: 'last' } }],
    take: MAX_SCAN,
    select: {
      slug: true,
      displayName: true,
      niche: true,
      games: true,
      languages: true,
      audienceTotal: true,
      availableForCollabs: true,
      user: {
        select: {
          id: true,
          image: true,
          platforms: { select: { type: true } },
        },
      },
    },
  })

  // Filtre langue en mémoire : `Profile.languages` est un champ Json (pas un String[]),
  // donc non filtrable proprement en SQL. Volume borné par MAX_SCAN.
  const filtered = lang
    ? rows.filter(r => Array.isArray(r.languages) && (r.languages as unknown[]).includes(lang))
    : rows

  const total = filtered.length
  const start = (page - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  // Mapping de sortie : on n'expose PAS le score, seulement de quoi afficher la carte.
  const creators = pageItems.map(r => ({
    creatorId: r.user.id,
    slug: r.slug,
    displayName: r.displayName,
    niche: r.niche,
    games: r.games,
    languages: Array.isArray(r.languages) ? r.languages : [],
    audienceTotal: r.audienceTotal ?? 0,
    availableForCollabs: r.availableForCollabs,
    avatarUrl: r.user.image,
    platforms: r.user.platforms.map(p => p.type),
  }))

  return NextResponse.json({
    creators,
    total,
    page,
    pageSize: PAGE_SIZE,
    hasMore: start + PAGE_SIZE < total,
  })
}
