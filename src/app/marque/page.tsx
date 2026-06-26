'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Accueil de l'espace marque. Pour l'instant (Lot B) le seul écran est l'édition
// du profil → on redirige. Le Lot C en fera le vrai accueil (annuaire créateurs).
export default function MarqueHomePage() {
  const router = useRouter()
  useEffect(() => { router.replace('/marque/profil') }, [router])
  return null
}
