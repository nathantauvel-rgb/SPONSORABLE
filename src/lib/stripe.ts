import Stripe from 'stripe'

// Client Stripe unique, validé au démarrage. Source de vérité de toute l'app.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) throw new Error('Missing env var: STRIPE_SECRET_KEY')

export const stripe = new Stripe(STRIPE_SECRET_KEY)

/** ID du prix Stripe de l'abonnement Pro (créé une fois dans le dashboard Stripe). */
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? ''

/** Mappe un statut d'abonnement Stripe vers le statut stocké en base. */
export function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return status // 'active' | 'trialing' → considérés Pro (cf. isProStatus)
    case 'past_due':
    case 'unpaid':
      return 'past_due'
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      return 'free'
    default:
      console.warn('[stripe] statut inconnu:', status)
      return 'free'
  }
}
