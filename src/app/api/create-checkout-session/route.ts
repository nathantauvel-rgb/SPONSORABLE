import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) throw new Error('Missing env var: STRIPE_SECRET_KEY')

const stripe = new Stripe(STRIPE_SECRET_KEY)

function getBaseUrl(): string {
  const envUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL
  if (envUrl) {
    try { return new URL(envUrl).origin } catch { /* fall through */ }
  }
  return 'http://localhost:3000'
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, stripeCustomerId: true },
    })
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    // Récupérer ou créer le customer Stripe
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
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Sponsorable Pro',
              description: 'Templates, statistiques, Calendly, export PDF, liens traçables et plus',
            },
            unit_amount: 1900,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: { userId: user.id },
      success_url: `${baseUrl}/dashboard/settings?success=true`,
      cancel_url: `${baseUrl}/dashboard/settings?canceled=true`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création de la session de paiement' }, { status: 500 })
  }
}
