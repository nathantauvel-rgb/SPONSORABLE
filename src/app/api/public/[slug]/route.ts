import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const profile = await prisma.profile.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          stripeSubscriptionStatus: true,
          platforms: {
            select: { type: true, stats: true, lastFetched: true, displayName: true, username: true },
          },
        },
      },
    },
  })

  if (!profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  const isPro = profile.user.stripeSubscriptionStatus === 'active'

  const platforms: Record<string, { stats: unknown; lastFetched: string | null; displayName: string | null; username: string }> = {}
  for (const p of profile.user.platforms) {
    platforms[p.type] = {
      stats: p.stats,
      lastFetched: p.lastFetched?.toISOString() ?? null,
      displayName: p.displayName,
      username: p.username,
    }
  }

  return NextResponse.json({
    slug: profile.slug,
    displayName: profile.displayName,
    bio: profile.bio,
    niche: profile.niche,
    theme: isPro ? profile.theme : null,
    formats: profile.formats,
    showPartnerships: profile.showPartnerships,
    partnerships: profile.partnerships,
    bannerUrl: isPro ? profile.bannerUrl : null,
    calendlyUrl: isPro ? profile.calendlyUrl : null,
    isPro,
    platforms,
  })
}
