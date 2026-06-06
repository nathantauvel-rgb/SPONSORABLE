import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, STRIPE_PRICE_ID } from '@/lib/stripe'
import { isProStatus } from '@/lib/subscription'

function getBaseUrl(): string {
  const envUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL
  if (envUrl) {
    try { return new URL(envUrl).origin } catch { /* fall through */ }
  }
  return 'http://localhost:3000'
}

export async function POST() {
  try {
    if (!STRIPE_PRICE_ID) {
      return NextResponse.json({ error: 'Offre Pro non configurée (STRIPE_PRICE_ID manquant).' }, { status: 503 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, stripeCustomerId: true, stripeSubscriptionStatus: true },
    })
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    // Empêche un second abonnement (double facturation) si déjà Pro.
    if (isProStatus(user.stripeSubscriptionStatus)) {
      return NextResponse.json({ error: 'Tu es déjà abonné Pro.' }, { status: 409 })
    }

    // Récupérer ou créer le customer Stripe, et le persister immédiatement
    // (évite les customers orphelins si l'étape suivante échoue).
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const baseUrl = getBaseUrl()
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      // userId en metadata ET client_reference_id : redondance utile pour retrouver
      // l'utilisateur côté webhook quoi qu'il arrive.
      metadata: { userId: user.id },
      client_reference_id: user.id,
      success_url: `${baseUrl}/dashboard/settings?success=true`,
      cancel_url: `${baseUrl}/dashboard/settings?canceled=true`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('[checkout] erreur:', err)
    return NextResponse.json({ error: 'Erreur lors de la création de la session de paiement' }, { status: 500 })
  }
}
