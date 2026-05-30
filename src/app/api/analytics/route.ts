import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!profile) return NextResponse.json({ views: [], total: 0, last30: 0, last7: 0, today: 0 })

  const now = new Date()
  const day30 = new Date(now); day30.setDate(day30.getDate() - 30)
  const day7 = new Date(now); day7.setDate(day7.getDate() - 7)
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)

  // Données des 30 derniers jours, groupées par jour
  const rawViews = await prisma.pageView.findMany({
    where: { profileId: profile.id, createdAt: { gte: day30 } },
    select: { createdAt: true, country: true, referer: true },
    orderBy: { createdAt: 'asc' },
  })

  // Agréger par jour
  const byDay: Record<string, number> = {}
  for (const v of rawViews) {
    const key = v.createdAt.toISOString().slice(0, 10)
    byDay[key] = (byDay[key] ?? 0) + 1
  }

  // Construire un tableau de 30 jours (avec 0 pour les jours sans vues)
  const views: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    views.push({ date: key, count: byDay[key] ?? 0 })
  }

  // Compteurs par pays (top 5)
  const countryMap: Record<string, number> = {}
  for (const v of rawViews) {
    if (v.country) countryMap[v.country] = (countryMap[v.country] ?? 0) + 1
  }
  const topCountries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country, count]) => ({ country, count }))

  // Compteurs par source (referer)
  const refererMap: Record<string, number> = {}
  for (const v of rawViews) {
    const src = v.referer
      ? (() => { try { return new URL(v.referer).hostname } catch { return v.referer } })()
      : 'Direct'
    refererMap[src] = (refererMap[src] ?? 0) + 1
  }
  const topReferers = Object.entries(refererMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }))

  const total = await prisma.pageView.count({ where: { profileId: profile.id } })
  const last30 = rawViews.length
  const last7 = rawViews.filter(v => v.createdAt >= day7).length
  const today = rawViews.filter(v => v.createdAt >= todayStart).length

  return NextResponse.json({ views, total, last30, last7, today, topCountries, topReferers })
}
