import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const PrefsSchema = z.object({
  notifNewMessage: z.boolean().optional(),
  notifWeeklyReport: z.boolean().optional(),
  notifProductUpdates: z.boolean().optional(),
})

type NotifPrefs = {
  notifNewMessage: boolean
  notifWeeklyReport: boolean
  notifProductUpdates: boolean
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await (prisma as any).$queryRaw`
    SELECT "notifNewMessage", "notifWeeklyReport", "notifProductUpdates"
    FROM "User"
    WHERE id = ${session.user.id}
    LIMIT 1
  ` as NotifPrefs[]

  if (!rows.length) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  return NextResponse.json({ prefs: rows[0] })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const parsed = PrefsSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { notifNewMessage, notifWeeklyReport, notifProductUpdates } = parsed.data

  // Build SET clause dynamically only for provided fields
  if (notifNewMessage !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).$executeRaw`UPDATE "User" SET "notifNewMessage" = ${notifNewMessage}, "updatedAt" = NOW() WHERE id = ${session.user.id}`
  }
  if (notifWeeklyReport !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).$executeRaw`UPDATE "User" SET "notifWeeklyReport" = ${notifWeeklyReport}, "updatedAt" = NOW() WHERE id = ${session.user.id}`
  }
  if (notifProductUpdates !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).$executeRaw`UPDATE "User" SET "notifProductUpdates" = ${notifProductUpdates}, "updatedAt" = NOW() WHERE id = ${session.user.id}`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await (prisma as any).$queryRaw`
    SELECT "notifNewMessage", "notifWeeklyReport", "notifProductUpdates"
    FROM "User"
    WHERE id = ${session.user.id}
    LIMIT 1
  ` as NotifPrefs[]

  return NextResponse.json({ prefs: rows[0] ?? {} })
}
