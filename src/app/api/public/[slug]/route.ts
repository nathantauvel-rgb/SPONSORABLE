import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const profile = await prisma.profile.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          stripeSubscriptionStatus: true,
          platforms: {
            select: { type: true, username: true, stats: true, lastFetched: true },
          },
        },
      },
    },
  })

  if (!profile || !profile.isPublic) {
    return NextResponse.json({ error: 'Page introuvable' }, { status: 404 })
  }

  const isPro = profile.user.stripeSubscriptionStatus === 'active' || profile.user.stripeSubscriptionStatus === 'trialing'

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
    twitterHandle: profile.twitterHandle ?? null,
    instagramHandle: profile.instagramHandle ?? null,
    tiktokHandle: profile.tiktokHandle ?? null,
    country: profile.country ?? null,
    languages: profile.languages ?? null,
    contentStyle: profile.contentStyle ?? null,
    targetBrands: profile.targetBrands ?? null,
    availableForCollabs: profile.availableForCollabs,
    positioningPhrase: profile.positioningPhrase ?? null,
    sponsorSummary: profile.sponsorSummary ?? null,
    platforms: profile.user.platforms,
    isPro,
  })
}
