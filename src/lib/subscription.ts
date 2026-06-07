// Source de vérité unique pour l'accès Pro (abonnement payant OU essai gratuit).

/** Durée de l'essai gratuit Pro offert à la création du compte. */
export const TRIAL_DAYS = 14

/** True si l'abonnement Stripe payant donne accès au Pro (actif ou en essai Stripe). */
export function isProStatus(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing'
}

/** Date de fin de l'essai gratuit pour un compte créé à `createdAt`. */
export function trialEndsAt(createdAt: Date | string): Date {
  return new Date(new Date(createdAt).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
}

/** True si le compte est encore dans sa période d'essai gratuit. */
export function isInTrial(createdAt: Date | string): boolean {
  return Date.now() < trialEndsAt(createdAt).getTime()
}

/** Nombre de jours d'essai restants (0 si terminé). */
export function trialDaysLeft(createdAt: Date | string): number {
  const ms = trialEndsAt(createdAt).getTime() - Date.now()
  return ms <= 0 ? 0 : Math.ceil(ms / (24 * 60 * 60 * 1000))
}

/** Accès Pro effectif = abonnement payant OU essai gratuit en cours. */
export function isProUser(opts: { status: string | null | undefined; createdAt: Date | string }): boolean {
  return isProStatus(opts.status) || isInTrial(opts.createdAt)
}
