import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isProStatus } from '@/lib/subscription'

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Annuler l'abonnement Stripe AVANT de supprimer le compte, sinon le
  // stripeSubscriptionId est perdu et l'utilisateur continue d'être facturé.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeSubscriptionId: true, stripeCustomerId: true },
  })

  if (user?.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      await stripe.subscriptions.cancel(user.stripeSubscriptionId)
      if (user.stripeCustomerId) {
        await stripe.customers.del(user.stripeCustomerId).catch(() => {})
      }
    } catch (err) {
      // On loggue mais on bloque la suppression : ne pas supprimer un compte
      // dont l'abonnement n'a pas pu être annulé (facturation fantôme).
      console.error('[me DELETE] échec annulation abonnement Stripe:', err)
      return NextResponse.json(
        { error: "Impossible d'annuler l'abonnement. Réessaie ou contacte le support." },
        { status: 502 }
      )
    }
  }

  // Cascade: Account, Session, Platform, Profile (+ Messages, PageViews) supprimés automatiquement
  await prisma.user.delete({ where: { id: session.user.id } })

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      stripeSubscriptionStatus: true,
      password: true,
      platforms: {
        select: { type: true, stats: true },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  const isPro = isProStatus(user.stripeSubscriptionStatus)
  const hasPassword = !!user.password

  return NextResponse.json({ isPro, hasPassword, platforms: user.platforms })
}
