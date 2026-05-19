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
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const userId = session.user.id
  const email = session.user.email

  // Vérifier que l'utilisateur n'a pas déjà un abonnement actif
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionStatus: true, stripeCustomerId: true },
  })

  if (user?.stripeSubscriptionStatus === 'active') {
    return NextResponse.json({ error: 'Abonnement déjà actif' }, { status: 400 })
  }

  try {
    const baseUrl = getBaseUrl()

    // Réutiliser le customer Stripe existant ou en créer un
    let customerId = user?.stripeCustomerId ?? undefined
    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { userId } })
      customerId = customer.id
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      client_reference_id: userId,
      metadata: { userId, email },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Sponsorable Pro',
              description: 'Templates, statistiques, Calendly, export PDF, liens traçables et plus',
              images: [],
            },
            unit_amount: 1900,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/settings?success=true`,
      cancel_url: `${baseUrl}/dashboard/settings?canceled=true`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('[stripe] checkout session error:', err)
    return NextResponse.json({ error: 'Erreur lors de la création de la session de paiement' }, { status: 500 })
  }
}
