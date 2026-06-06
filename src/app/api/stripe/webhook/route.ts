import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

const stripe = new Stripe(STRIPE_SECRET_KEY)

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  })
  return user?.id ?? null
}

export async function POST(req: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET manquant')
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature invalide'
    console.error('Webhook signature invalide:', message)
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  // Idempotence : si cet event a déjà été traité, on acquitte sans rejouer.
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
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const userId = (session.metadata?.userId) ?? await getUserIdFromCustomer(customerId)
        if (!userId) {
          console.error('checkout.session.completed: userId introuvable', { customerId })
          break
        }

        // Récupérer le statut réel de l'abonnement
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripeSubscriptionStatus: subscription.status, // 'active', 'trialing', etc.
          },
        })
        console.log(`✅ Paiement confirmé pour userId=${userId}, status=${subscription.status}`)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const userId = await getUserIdFromCustomer(customerId)
        if (!userId) {
          console.error('subscription.updated: userId introuvable', { customerId })
          break
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: sub.id,
            stripeSubscriptionStatus: sub.status, // 'active', 'trialing', 'past_due', 'canceled', etc.
          },
        })
        console.log(`🔄 Abonnement mis à jour pour userId=${userId} → ${sub.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const userId = await getUserIdFromCustomer(customerId)
        if (!userId) {
          console.error('subscription.deleted: userId introuvable', { customerId })
          break
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: null,
            stripeSubscriptionStatus: 'canceled',
          },
        })
        console.log(`❌ Abonnement annulé pour userId=${userId}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const userId = await getUserIdFromCustomer(customerId)
        if (!userId) break

        // On passe en free si le paiement échoue (après les tentatives Stripe)
        await prisma.user.update({
          where: { id: userId },
          data: { stripeSubscriptionStatus: 'past_due' },
        })
        console.log(`⚠️ Paiement échoué pour userId=${userId}`)
        break
      }

      default:
        // Événement non géré — on retourne 200 quand même
        break
    }
  } catch (err) {
    console.error('Erreur lors du traitement du webhook:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
