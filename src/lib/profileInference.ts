import type { ProfileStrategy, InferredProfileData, BriefCard, ReadinessScore } from '@/types/mediakit'

type RawStats = Record<string, unknown> | null

interface StrategySignals {
  ytSubs: number
  twFollowers: number
  hasRecentContent: boolean
  hasRecentVideos: boolean
  hasRecentStreams: boolean
  hasClips: boolean
  platformConnected: boolean
  editorialScore: number
}

export function computeProfileStrategy(signals: StrategySignals): ProfileStrategy {
  const { ytSubs, twFollowers, hasRecentVideos, hasRecentStreams, hasClips, editorialScore, platformConnected } = signals

  let statsScore = 0
  if (ytSubs >= 10_000 || twFollowers >= 1_000) statsScore = 3
  else if (ytSubs >= 2_000 || twFollowers >= 300) statsScore = 2
  else if (ytSubs >= 200 || twFollowers >= 50) statsScore = 1

  const contentScore = (hasRecentVideos ? 1 : 0) + (hasRecentStreams ? 1 : 0) + (hasClips ? 1 : 0)

  if (statsScore >= 3) return 'rich'
  if (statsScore >= 2) return 'medium'
  if (contentScore >= 1) return 'positioned'
  if (editorialScore >= 3) return 'positioned'
  if (editorialScore >= 2 && platformConnected) return 'positioned'
  return 'sparse'
}

export function computeEditorialScore(manual: {
  bio: string
  niche: string
  formats: string[]
  country: string
  languages: string[]
}): number {
  let score = 0
  if ((manual.bio ?? '').length > 20) score++
  if ((manual.niche ?? '').length > 0) score++
  if ((manual.formats ?? []).length > 0) score++
  if ((manual.country ?? '') || (manual.languages?.length ?? 0) > 0) score++
  return score
}

export function inferProfileData(ytStats: RawStats, twitchStats: RawStats): Omit<InferredProfileData, 'strategy'> {
  const recentVideos = ytStats?.recentVideos as unknown[] | undefined
  const recentStreams = twitchStats?.recentStreams as unknown[] | undefined
  const clips = twitchStats?.topClips as unknown[] | undefined

  const hasRecentVideos = (recentVideos?.length ?? 0) > 0
  const hasRecentStreams = (recentStreams?.length ?? 0) > 0
  const hasClips = (clips?.length ?? 0) > 0
  const hasRecentContent = hasRecentVideos || hasRecentStreams || hasClips
  const platformConnected = !!ytStats || !!twitchStats

  const ytSubs = Number(ytStats?.subscriberCount ?? 0)
  const twFollowers = Number(twitchStats?.followerCount ?? 0)

  let dominantPlatform: 'youtube' | 'twitch' | null = null
  if (ytStats && twitchStats) dominantPlatform = ytSubs >= twFollowers ? 'youtube' : 'twitch'
  else if (ytStats) dominantPlatform = 'youtube'
  else if (twitchStats) dominantPlatform = 'twitch'

  let publishingFrequency: string | null = null
  if (hasRecentVideos && recentVideos) {
    const n = recentVideos.length
    if (n >= 8) publishingFrequency = '2–3× / semaine'
    else if (n >= 4) publishingFrequency = '1× / semaine'
    else if (n >= 2) publishingFrequency = 'Régulier'
    else publishingFrequency = 'Occasionnel'
  } else if (hasRecentStreams && recentStreams) {
    const n = recentStreams.length
    if (n >= 8) publishingFrequency = '2–3× / semaine'
    else if (n >= 4) publishingFrequency = 'Hebdomadaire'
    else publishingFrequency = 'Régulier'
  }

  const mainGameFromTwitch = twitchStats?.gameName ? String(twitchStats.gameName) : null

  return {
    dominantPlatform,
    dominantFormat: hasRecentVideos ? 'video' : hasRecentStreams ? 'live' : null,
    publishingFrequency,
    mainGameFromTwitch,
    hasRecentContent,
    hasRecentVideos,
    hasRecentStreams,
    hasClips,
    platformConnected,
  }
}

export function selectBriefCards(
  manual: { niche: string; formats: string[]; country: string; languages: string[]; availableForCollabs: boolean; contentStyle?: string },
  inferred: InferredProfileData
): BriefCard[] {
  const cards: BriefCard[] = []

  // 1. Niche / jeu principal
  const nicheTokens = (manual.niche ?? '').split(/\s*[·,]\s*/).map(s => s.trim()).filter(Boolean)
  if (nicheTokens.length > 0) {
    cards.push({
      icon: '🎮',
      label: 'Niche',
      value: nicheTokens[0],
      sublabel: nicheTokens.slice(1, 3).join(' · ') || undefined,
    })
  } else if (inferred.mainGameFromTwitch) {
    cards.push({ icon: '🎮', label: 'Jeu principal', value: inferred.mainGameFromTwitch })
  } else if ((manual.formats ?? []).length > 0) {
    cards.push({ icon: '🎮', label: 'Contenu', value: manual.formats[0], sublabel: manual.formats.slice(1, 3).join(' · ') || undefined })
  }

  // 2. Marché & langue
  if (manual.country || (manual.languages?.length ?? 0) > 0) {
    const lang = manual.languages?.join(' · ') || 'Français'
    cards.push({
      icon: '🌍',
      label: 'Marché',
      value: manual.country || lang,
      sublabel: manual.country && manual.languages?.length ? manual.languages.join(' · ') : undefined,
    })
  }

  // 3. Plateforme dominante
  if (inferred.dominantPlatform && cards.length < 4) {
    const formatLabel = inferred.dominantFormat === 'video' ? 'Vidéos' : inferred.dominantFormat === 'live' ? 'Streams live' : 'Contenu'
    const name = inferred.dominantPlatform === 'youtube' ? `YouTube · ${formatLabel}` : `Twitch · ${formatLabel}`
    cards.push({ icon: inferred.dominantPlatform === 'youtube' ? '▶' : '🟣', label: 'Plateforme principale', value: name })
  }

  // 4. Fréquence
  if (inferred.publishingFrequency && cards.length < 4) {
    cards.push({ icon: '📅', label: 'Fréquence', value: inferred.publishingFrequency })
  }

  // 5. Disponibilité
  if (manual.availableForCollabs && cards.length < 4) {
    cards.push({ icon: '✓', label: 'Disponibilité', value: 'Ouvert aux collaborations' })
  }

  // 6. Style éditorial
  if (manual.contentStyle && cards.length < 4) {
    cards.push({ icon: '✨', label: 'Style', value: manual.contentStyle })
  }

  // 7. Présence vérifiée (fallback)
  if (inferred.platformConnected && cards.length < 4) {
    cards.push({ icon: '✓', label: 'Profil vérifié', value: 'Données vérifiées', sublabel: 'Via OAuth — stats authentifiées' })
  }

  return cards.slice(0, 4)
}

export function computeReadinessScore(
  manual: {
    bio: string; niche: string; formats: string[]; country: string
    languages: string[]; positioningPhrase: string; availableForCollabs: boolean
  },
  inferred: Pick<InferredProfileData, 'platformConnected' | 'hasRecentContent'>
): ReadinessScore {
  const items: ReadinessScore['items'] = [
    {
      label: 'Bio renseignée',
      done: (manual.bio ?? '').length > 20,
      tip: 'Explique en 2-3 phrases qui tu es et ton style de contenu',
    },
    {
      label: 'Niche définie',
      done: (manual.niche ?? '').length > 0,
      tip: 'Ex : "FPS · Battle Royale · Esport"',
    },
    {
      label: 'Pays / marché',
      done: !!(manual.country),
      tip: 'Indique ton marché principal pour les marques',
    },
    {
      label: 'Langue(s)',
      done: (manual.languages ?? []).length > 0,
      tip: 'Ex : Français, Anglais…',
    },
    {
      label: 'Formats de collab',
      done: (manual.formats ?? []).length > 0,
      tip: 'Sélectionne au moins un format de collaboration',
    },
    {
      label: 'Phrase de positionnement',
      done: (manual.positioningPhrase ?? '').length > 0,
      tip: 'Génère ou écris ta phrase sponsor-friendly',
    },
    {
      label: 'Plateforme connectée',
      done: inferred.platformConnected,
      tip: 'Connecte YouTube ou Twitch pour des stats vérifiées',
    },
    {
      label: 'Contenu visible',
      done: inferred.hasRecentContent,
      tip: 'Du contenu récent sera automatiquement mis en avant',
    },
  ]

  const done = items.filter(i => i.done).length
  return { score: done, total: items.length, pct: Math.round((done / items.length) * 100), items }
}
