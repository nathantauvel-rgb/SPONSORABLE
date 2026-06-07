'use client'

import { useEffect, useState } from 'react'

/**
 * Retourne true quand la largeur d'écran est ≤ breakpoint (768px par défaut).
 * Permet d'adapter les styles inline (CSS-in-JS) en mobile-first, là où les
 * media queries CSS ne peuvent pas surcharger les styles inline.
 *
 * SSR-safe : renvoie false au premier rendu serveur, puis se met à jour côté client.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [breakpoint])

  return isMobile
}
