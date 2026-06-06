import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

function getBaseUrl(): string {
  const envUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL
  if (envUrl) {
    try { return new URL(envUrl).origin } catch { /* fall through */ }
  }
  return 'http://localhost:3000'
}

// Ouvre le portail de facturation Stripe : l'utilisateur gère son abonnement
// (annuler, changer de carte, voir ses factures) directement chez Stripe.
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    })
    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: 'Aucun abonnement à gérer.' }, { status: 400 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getBaseUrl()}/dashboard/settings#plan`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (err) {
    console.error('[portal] erreur:', err)
    return NextResponse.json({ error: "Impossible d'ouvrir le portail de facturation." }, { status: 500 })
  }
}
