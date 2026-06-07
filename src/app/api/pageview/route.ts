import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isRateLimited } from '@/lib/redis'
import { z } from 'zod'

const Schema = z.object({ slug: z.string().min(1).max(64) })

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

    const { slug } = parsed.data

    // Rate-limit par IP + slug : empêche de gonfler/fausser les analytics d'un profil.
    if (await isRateLimited(`pageview:${ip}:${slug}`, 10, 600)) {
      return NextResponse.json({ ok: true }) // silencieux : pas d'erreur côté visiteur
    }

    const profile = await prisma.profile.findUnique({
      where: { slug },
      select: { id: true, isPublic: true, userId: true },
    })
    if (!profile || !profile.isPublic) return NextResponse.json({ ok: false }, { status: 404 })

    // Ne pas compter les visites du créateur sur sa propre page : les stats doivent
    // refléter de vraies vues externes (marques, visiteurs), pas l'auto-consultation.
    const session = await auth()
    if (session?.user?.id === profile.userId) {
      return NextResponse.json({ ok: true }) // silencieux : pas une vraie vue
    }

    // RGPD : on ne stocke PAS l'IP ni le user-agent (données personnelles jamais
    // exploitées par les analytics). Seuls le pays et le referer, non identifiants,
    // sont conservés pour la mesure d'audience.
    const referer = req.headers.get('referer') ?? null
    const country = req.headers.get('x-vercel-ip-country') ?? null

    await prisma.pageView.create({
      data: { profileId: profile.id, referer, country },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
