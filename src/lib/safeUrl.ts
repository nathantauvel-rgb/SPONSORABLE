const ALLOWED_PROTOCOLS = ['https:']

/**
 * Returns the URL only if it uses an allowed protocol (https).
 * Prevents javascript: and data: XSS via user-controlled URLs.
 */
export function safeUrl(url: string | undefined | null): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return ''
    return url
  } catch {
    return ''
  }
}

/**
 * Restricts a Calendly URL to the calendly.com domain over https.
 */
export function safeCalendlyUrl(url: string | undefined | null): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return ''
    if (!parsed.hostname.endsWith('calendly.com')) return ''
    return url
  } catch {
    return ''
  }
}
