import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) throw new Error('Missing env var: STRIPE_SECRET_KEY')

const stripe = new Stripe(STRIPE_SECRET_KEY)

function getBaseUrl(request: Request): string {
  const envUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL
  if (envUrl) {
    try {
      return new URL(envUrl).origin
    } catch { /* fall through */ }
  }
  return 'http://localhost:3000'
}

export async function POST(request: Request) {
  try {
    const baseUrl = getBaseUrl(request)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
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

    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création de la session de paiement' }, { status: 500 })
  }
}
