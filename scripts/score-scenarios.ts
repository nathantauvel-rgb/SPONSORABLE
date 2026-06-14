/**
 * Banc d'essai du score de sponsorabilité.
 * Fait tourner le moteur sur des archétypes de créateurs réalistes et affiche
 * le détail — pour juger / calibrer le barème SANS avoir de chaîne réelle.
 *
 * Lancer : npx tsx scripts/score-scenarios.ts
 */
import { buildScoreInputs, computeUniversalScore, type ApiPlatform, type ApiProfile } from '../src/lib/sponsorScore'

type Scenario = { label: string; platforms: ApiPlatform[]; profile: ApiProfile }

const fullProfile: ApiProfile = {
  bio: 'Créateur gaming FR, contenu FPS et lives quotidiens, dispo pour collabs.',
  niche: 'FPS / Battle Royale',
  formats: ['Intégration', 'Vidéo dédiée', 'Live sponsorisé'],
  positioningPhrase: 'Le créateur FPS qui convertit sa commu',
  country: 'FR',
  languages: ['fr'],
  availableForCollabs: true,
  calendlyUrl: 'https://cal.com/x',
  targetBrands: 'Razer, Logitech',
  partnerships: [{ name: 'Razer' }],
}
const thinProfile: ApiProfile = { bio: '', niche: '', formats: [], availableForCollabs: false }

const scenarios: Scenario[] = [
  {
    label: 'Profil seul (aucune plateforme)',
    platforms: [],
    profile: fullProfile,
  },
  {
    label: 'Petit streamer Twitch (5k, modeste)',
    platforms: [{ type: 'twitch', stats: { followerCount: 5000, avgVodViews: 25, recentStreams: [{}, {}, {}], topClips: [{}] } }],
    profile: fullProfile,
  },
  {
    label: 'Streamer Twitch établi (40k, bon ratio, subs)',
    platforms: [{ type: 'twitch', stats: { followerCount: 40000, avgVodViews: 700, subscriptionCount: 800, recentStreams: [{}, {}, {}, {}, {}], topClips: [{}, {}] } }],
    profile: fullProfile,
  },
  {
    label: 'Petit YouTubeur (8k, engagement moyen)',
    platforms: [{ type: 'youtube', stats: { subscriberCount: 8000, engagementRate: 3, recentVideos: [{}, {}], videosLast90Days: 6, analytics: { avgViewPercentage: 35 } } }],
    profile: fullProfile,
  },
  {
    label: 'YouTubeur établi (90k, fort, bonne rétention, régulier)',
    platforms: [{ type: 'youtube', stats: { subscriberCount: 90000, engagementRate: 6, avgViewsPerVideo: 12000, recentVideos: [{}, {}, {}, {}, {}], videosLast90Days: 26, analytics: { avgViewPercentage: 50 } } }],
    profile: fullProfile,
  },
  {
    label: 'YouTubeur 90k mais MAUVAISE rétention (18%)',
    platforms: [{ type: 'youtube', stats: { subscriberCount: 90000, engagementRate: 6, recentVideos: [{}, {}, {}, {}, {}], videosLast90Days: 26, analytics: { avgViewPercentage: 18 } } }],
    profile: fullProfile,
  },
  {
    label: 'Multi-plateforme (YT 90k + Twitch 40k)',
    platforms: [
      { type: 'youtube', stats: { subscriberCount: 90000, engagementRate: 6, recentVideos: [{}, {}, {}, {}, {}], videosLast90Days: 26, analytics: { avgViewPercentage: 50 } } },
      { type: 'twitch', stats: { followerCount: 40000, avgVodViews: 700, subscriptionCount: 800, recentStreams: [{}, {}, {}, {}, {}], topClips: [{}, {}] } },
    ],
    profile: fullProfile,
  },
  {
    label: 'Streamer 40k mais profil VIDE',
    platforms: [{ type: 'twitch', stats: { followerCount: 40000, avgVodViews: 700, subscriptionCount: 800, recentStreams: [{}, {}, {}, {}, {}] } }],
    profile: thinProfile,
  },
]

const bar = (n: number | null) => n == null ? '─────── n/a' : '█'.repeat(Math.round(n / 10)).padEnd(10, '░') + ` ${n}`

// ── Démo équité d'échelle : MÊME taux d'engagement, tailles différentes ──────
console.log('\n══ Équité d\'échelle — même taux d\'engagement YouTube jugé selon la taille ══')
for (const rate of [3, 5, 8]) {
  const line = [5000, 50000, 200000, 600000].map(subs => {
    const r = computeUniversalScore(buildScoreInputs([{ type: 'youtube', stats: { subscriberCount: subs, engagementRate: rate } }], fullProfile))
    const e = r.dimensions.find(d => d.key === 'engagement')!.score
    return `${(subs / 1000) + 'k'}: ${String(e).padStart(3)}`
  }).join('   ')
  console.log(`  ${rate}% d'engagement →   ${line}`)
}
console.log('  (un petit créateur doit "mériter" plus pour le même score : barre relative à sa taille)')

for (const sc of scenarios) {
  const r = computeUniversalScore(buildScoreInputs(sc.platforms, sc.profile))
  console.log(`\n┌─ ${sc.label}`)
  console.log(`│  SCORE ${r.globalScore}/100 · Grade ${r.grade.level}/${r.grade.total} « ${r.grade.name} » · Diagnostic : ${r.confidence.label}`)
  console.log(`│  Sources : ${r.sources.join(' + ')}`)
  console.log(`│  Verdict : ${r.grade.verdict}`)
  console.log(`│  Conseil : ${r.advice}`)
  console.log('│')
  for (const d of r.dimensions) {
    const src = d.sources.length ? `(${d.sources.join('+')})` : ''
    console.log(`│   ${d.label.padEnd(20)} ${bar(d.score)}  poids ${d.weight}  ${src}`)
  }
  console.log('└' + '─'.repeat(60))
}
