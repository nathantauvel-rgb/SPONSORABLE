import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({ slug: z.string().min(1).max(64) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

    const { slug } = parsed.data

    const profile = await prisma.profile.findUnique({
      where: { slug },
      select: { id: true, isPublic: true },
    })
    if (!profile || !profile.isPublic) return NextResponse.json({ ok: false }, { status: 404 })

    // Extraire les infos de la requête
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null
    const userAgent = req.headers.get('user-agent') ?? null
    const referer = req.headers.get('referer') ?? null
    const country = req.headers.get('x-vercel-ip-country') ?? null

    await prisma.pageView.create({
      data: { profileId: profile.id, ip, userAgent, referer, country },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
