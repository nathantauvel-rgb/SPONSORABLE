// Source de vérité unique pour déterminer si un abonnement Stripe donne accès au Pro.
// Évite les incohérences entre routes (user/plan, me, page publique, webhooks).

/** Un utilisateur est Pro si son abonnement est actif OU en période d'essai. */
export function isProStatus(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing'
}
