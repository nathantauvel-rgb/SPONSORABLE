interface ManualData {
  displayName?: string
  bio?: string
  niche?: string
  formats?: string[]
  country?: string
  languages?: string[]
  contentStyle?: string
  availableForCollabs?: boolean
}

interface InferredData {
  dominantPlatform: 'youtube' | 'twitch' | null
  dominantFormat: 'video' | 'live' | null
  mainGameFromTwitch: string | null
}

function mainNicheFrom(manual: ManualData, inferred: InferredData): string {
  const tokens = (manual.niche ?? '').split(/\s*[·,]\s*/).map(s => s.trim()).filter(Boolean)
  return tokens[0] || inferred.mainGameFromTwitch || (manual.formats ?? [])[0] || ''
}

// Génère 1 phrase courte, concrète, sponsor-friendly
export function generatePositioningPhrase(manual: ManualData, inferred: InferredData): string {
  const niche = mainNicheFrom(manual, inferred)
  const lang = manual.languages?.[0] || 'Français'
  const country = manual.country || ''
  const platform = inferred.dominantPlatform === 'youtube' ? 'YouTube'
    : inferred.dominantPlatform === 'twitch' ? 'Twitch' : ''
  const format = inferred.dominantFormat === 'video' ? 'vidéaste' : inferred.dominantFormat === 'live' ? 'streamer' : 'créateur'

  if (niche && platform && country) {
    return `Créateur ${niche} ${lang.toLowerCase()} sur ${platform}, marché ${country}`
  }
  if (niche && platform) {
    return `${format.charAt(0).toUpperCase() + format.slice(1)} ${niche} sur ${platform}, communauté ${lang.toLowerCase()}`
  }
  if (niche && country) {
    return `Créateur de contenu ${niche}, marché ${country}, disponible pour des partenariats`
  }
  if (niche) {
    return `Créateur de contenu ${niche} pour une audience ${lang.toLowerCase()}`
  }
  if (platform) {
    return `Créateur gaming ${lang.toLowerCase()} actif sur ${platform}, disponible pour des collaborations`
  }
  return `Créateur de contenu gaming ${lang.toLowerCase()}, disponible pour des partenariats`
}

// Génère 2 phrases max, concrètes, orientées sponsor
export function generateSponsorSummary(manual: ManualData, inferred: InferredData): string {
  const niche = mainNicheFrom(manual, inferred)
  const lang = manual.languages?.[0] || 'Français'
  const country = manual.country || ''
  const platform = inferred.dominantPlatform === 'youtube' ? 'YouTube'
    : inferred.dominantPlatform === 'twitch' ? 'Twitch' : 'ses plateformes'
  const available = manual.availableForCollabs !== false
  const formats = (manual.formats ?? []).slice(0, 2)

  let phrase1: string
  const bio = (manual.bio ?? '').trim()
  if (bio.length > 30) {
    phrase1 = bio.length > 160 ? bio.slice(0, 157) + '…' : bio
  } else {
    const geo = country ? ` basé en ${country}` : ''
    phrase1 = `Créateur de contenu ${niche || 'gaming'} sur ${platform}${geo}, avec une communauté ${lang.toLowerCase()} engagée.`
  }

  const collabText = formats.length > 0
    ? formats.join(', ').toLowerCase()
    : 'intégrations sponsorisées'

  const phrase2 = available
    ? `Disponible pour des ${collabText} — réponse garantie sous 48h.`
    : `Ouvert à des propositions adaptées à son univers éditorial.`

  return `${phrase1} ${phrase2}`
}
