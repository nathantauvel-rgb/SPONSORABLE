import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { stripe, mapStripeStatus } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

/** Retrouve l'userId à partir du customer Stripe (fallback metadata). */
async function resolveUserId(customerId: string | null, metadataUserId?: string | null): Promise<string | null> {
  if (metadataUserId) return metadataUserId
  if (!customerId) return null
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  })
  return user?.id ?? null
}

/** Lit le statut réel de l'abonnement depuis Stripe et le synchronise en base. */
async function syncSubscription(subscriptionId: string, customerId: string, metadataUserId?: string | null) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = await resolveUserId(customerId, metadataUserId ?? subscription.metadata?.userId)
  if (!userId) {
    console.error('[stripe-webhook] userId introuvable', { customerId, subscriptionId })
    return
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: mapStripeStatus(subscription.status),
    },
  })
}

export async function POST(req: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET manquant')
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[stripe-webhook] signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  // Idempotence : Stripe redélivre les events. On ignore tout event déjà traité.
  try {
    await prisma.stripeEvent.create({ data: { id: event.id } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    throw err
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        if (s.mode !== 'subscription') break
        await syncSubscription(s.subscription as string, s.customer as string, s.metadata?.userId ?? s.client_reference_id)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await syncSubscription(sub.id, sub.customer as string, sub.metadata?.userId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = await resolveUserId(sub.customer as string, sub.metadata?.userId)
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeSubscriptionId: null, stripeSubscriptionStatus: 'free' },
          })
        }
        break
      }

      case 'invoice.paid': {
        // Réactivation après un paiement réussi (retour de past_due → active).
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null }
        if (invoice.subscription) {
          await syncSubscription(invoice.subscription, invoice.customer as string)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const userId = await resolveUserId(invoice.customer as string)
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeSubscriptionStatus: 'past_due' },
          })
        }
        break
      }

      default:
        // Event non géré → on acquitte quand même (200).
        break
    }
  } catch (err) {
    console.error('[stripe-webhook] erreur handler', event.type, err)
    // 500 → Stripe rejouera ; l'idempotence empêchera le double-traitement réussi.
    // On retire l'event de la table pour autoriser le retry.
    await prisma.stripeEvent.delete({ where: { id: event.id } }).catch(() => {})
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
