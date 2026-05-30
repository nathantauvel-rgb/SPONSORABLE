export type ProfileStrategy = 'rich' | 'medium' | 'positioned' | 'sparse'

export type InferredProfileData = {
  dominantPlatform: 'youtube' | 'twitch' | null
  dominantFormat: 'video' | 'live' | null
  publishingFrequency: string | null
  mainGameFromTwitch: string | null
  hasRecentContent: boolean
  hasRecentVideos: boolean
  hasRecentStreams: boolean
  hasClips: boolean
  platformConnected: boolean
  strategy: ProfileStrategy
}

export type BriefCard = {
  icon: string
  label: string
  value: string
  sublabel?: string
}

export type ReadinessItem = {
  label: string
  done: boolean
  tip: string
}

export type ReadinessScore = {
  score: number
  total: number
  pct: number
  items: ReadinessItem[]
}

export type ManualProfileData = {
  displayName: string
  bio: string
  niche: string
  formats: string[]
  country: string
  languages: string[]
  contentStyle: string
  targetBrands: string
  availableForCollabs: boolean
  positioningPhrase: string
  sponsorSummary: string
}
