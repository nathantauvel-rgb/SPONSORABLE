// Gestion du consentement cookies/analytics (RGPD/CNIL).
// Le consentement est stocké côté client. Tant qu'il n'est pas "accepted",
// aucun traceur non essentiel (mesure d'audience) ne doit se déclencher.

export const CONSENT_KEY = 'sponsorable_cookie_consent'
export type ConsentValue = 'accepted' | 'refused'

/** Retourne le consentement actuel, ou null si l'utilisateur n'a pas encore choisi. */
export function getConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(CONSENT_KEY)
  return v === 'accepted' || v === 'refused' ? v : null
}

/** True uniquement si l'utilisateur a explicitement accepté la mesure d'audience. */
export function hasAnalyticsConsent(): boolean {
  return getConsent() === 'accepted'
}

/** Enregistre le choix et notifie le reste de l'app via un événement custom. */
export function setConsent(value: ConsentValue): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONSENT_KEY, value)
  window.dispatchEvent(new CustomEvent('consent-change', { detail: value }))
}
