/**
 * Tests du moteur de score de sponsorabilité.
 * Lancer : npm run test   (utilise le test runner natif de Node via tsx)
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computeSponsorScore, statsToScoreInputs, type ScoreInputs, type RawVideo } from './sponsorScore'

const NOW = Date.UTC(2026, 5, 15) // 15 juin 2026, référence fixe
const daysAgo = (d: number) => new Date(NOW - d * 24 * 60 * 60 * 1000).toISOString()

function video(views: number, likes: number, comments: number, publishedDaysAgo: number): RawVideo {
  return { views, likes, comments, publishedAt: daysAgo(publishedDaysAgo) }
}

/** Profil performant : engagement fort, bonne portée, régulier, en croissance, rétention OK. */
function strongInputs(over: Partial<ScoreInputs> = {}): ScoreInputs {
  const recentVideos: RawVideo[] = Array.from({ length: 12 }, (_, i) =>
    video(15000, 900, 150, i * 7), // ~7 % engagement, 1 vidéo/semaine
  )
  return {
    recentVideos,
    subscribers: 100000,
    subscribers30dAgo: 94000, // +6.4 %
    avgViewPercentage: 48,
    profileCompleteness: 1,
    now: NOW,
    ...over,
  }
}

test('profil performant → score élevé et 5 critères forts', () => {
  const r = computeSponsorScore(strongInputs())
  assert.ok(r.globalScore >= 80, `attendu ≥80, reçu ${r.globalScore}`)
  assert.equal(r.breakdown.length, 5)
  assert.ok(r.breakdown.every(b => b.status !== 'unavailable'))
  // Somme des poids effectifs ≈ 1
  const wsum = r.breakdown.reduce((s, b) => s + b.weight, 0)
  assert.ok(Math.abs(wsum - 1) < 0.02, `somme des poids = ${wsum}`)
})

test('complétude profil ne pèse que le bonus (≤ 5 pts)', () => {
  const full = computeSponsorScore(strongInputs({ profileCompleteness: 1 }))
  const empty = computeSponsorScore(strongInputs({ profileCompleteness: 0 }))
  const delta = full.globalScore - empty.globalScore
  assert.ok(delta >= 0 && delta <= 5, `le bonus profil doit être 0..5, reçu ${delta}`)
})

test('rétention absente → poids redistribué sur les 4 autres', () => {
  const r = computeSponsorScore(strongInputs({ avgViewPercentage: null }))
  const ret = r.breakdown.find(b => b.criteria === 'retention')!
  assert.equal(ret.status, 'unavailable')
  assert.equal(ret.score, null)
  assert.equal(ret.weight, 0)
  // Les 4 autres se partagent 100 % du poids
  const others = r.breakdown.filter(b => b.criteria !== 'retention')
  const wsum = others.reduce((s, b) => s + b.weight, 0)
  assert.ok(Math.abs(wsum - 1) < 0.02, `poids redistribué = ${wsum}`)
})

test('croissance indisponible (pas de snapshot J-30) → redistribuée, pas pénalisante', () => {
  const withGrowth = computeSponsorScore(strongInputs())
  const without = computeSponsorScore(strongInputs({ subscribers30dAgo: null }))
  const g = without.breakdown.find(b => b.criteria === 'growth')!
  assert.equal(g.status, 'unavailable')
  // Sans la croissance, le score ne doit pas s'effondrer (redistribution, pas zéro)
  assert.ok(without.globalScore >= withGrowth.globalScore - 6, 'la redistribution ne doit pas écrouler le score')
})

test('croissance négative → 0 pt mais critère disponible', () => {
  const r = computeSponsorScore(strongInputs({ subscribers: 90000, subscribers30dAgo: 100000 }))
  const g = r.breakdown.find(b => b.criteria === 'growth')!
  assert.equal(g.score, 0)
  assert.equal(g.status, 'weak')
  assert.match(g.message, /recul/)
})

test('chaîne sans abonnés → viewsToSubs et growth indisponibles (pas de division par zéro)', () => {
  const r = computeSponsorScore(strongInputs({ subscribers: 0, subscribers30dAgo: 0 }))
  assert.equal(r.breakdown.find(b => b.criteria === 'viewsToSubs')!.status, 'unavailable')
  assert.equal(r.breakdown.find(b => b.criteria === 'growth')!.status, 'unavailable')
  assert.ok(Number.isFinite(r.globalScore))
})

test('chaîne récente sans vidéos → engagement/portée/régularité indisponibles', () => {
  const r = computeSponsorScore(strongInputs({ recentVideos: [] }))
  for (const k of ['engagement', 'viewsToSubs', 'regularity'] as const) {
    assert.equal(r.breakdown.find(b => b.criteria === k)!.status, 'unavailable')
  }
})

test('aucune donnée exploitable → score 0 + insights d\'amorçage', () => {
  const r = computeSponsorScore({
    recentVideos: [],
    subscribers: null,
    subscribers30dAgo: null,
    avgViewPercentage: null,
    profileCompleteness: 1, // même profil complet : pas de score sans perf
    now: NOW,
  })
  assert.equal(r.globalScore, 0)
  assert.match(r.insights, /Connecte ta chaîne/)
})

test('vidéo à 0 vue ignorée dans l\'engagement (pas de division par zéro)', () => {
  const r = computeSponsorScore(strongInputs({
    recentVideos: [video(0, 0, 0, 1), video(1000, 80, 20, 8)], // 1re ignorée → 10 %
  }))
  const e = r.breakdown.find(b => b.criteria === 'engagement')!
  assert.notEqual(e.score, null)
  assert.equal(e.status, 'strong') // 10 % → 100
})

test('normalisation = interpolation linéaire, pas paliers (engagement 3,5 % entre 2 et 5)', () => {
  // 3,5 % doit donner un sous-score strictement entre les ancres 40 (2 %) et 75 (5 %)
  const mk = (rate: number): ScoreInputs => ({
    recentVideos: [video(10000, rate * 100, 0, 5)], // (likes)/views*100 = rate %
    subscribers: 50000, subscribers30dAgo: 49000, avgViewPercentage: 40,
    profileCompleteness: 0, now: NOW,
  })
  const s35 = computeSponsorScore(mk(3.5)).breakdown.find(b => b.criteria === 'engagement')!.score!
  assert.ok(s35 > 40 && s35 < 75, `interpolation attendue 40<x<75, reçu ${s35}`)
  // Monotonie : 4 % > 3,5 %
  const s4 = computeSponsorScore(mk(4)).breakdown.find(b => b.criteria === 'engagement')!.score!
  assert.ok(s4 > s35, 'le sous-score doit croître avec la valeur')
})

test('régularité : nouvelle chaîne active rapportée au temps écoulé, pas à 90 j fixes', () => {
  // 4 vidéos en 14 jours sur une chaîne née il y a 14 j → ~2 vidéos/semaine, pas /90j
  const recentVideos = [video(5000, 300, 50, 1), video(5000, 300, 50, 5), video(5000, 300, 50, 9), video(5000, 300, 50, 13)]
  const r = computeSponsorScore(strongInputs({ recentVideos }))
  const reg = r.breakdown.find(b => b.criteria === 'regularity')!
  assert.ok((reg.score ?? 0) >= 70, `nouvelle chaîne active mal notée: ${reg.score}`)
})

test('régularité : comptage explicite videosLast90Days prime sur le tableau', () => {
  // 26 vidéos sur 90 j (≈ 2/sem) via le comptage exact, chaîne ancienne → score élevé,
  // même si seules 12 vidéos sont dans recentVideos (limite d'affichage).
  const r = computeSponsorScore(strongInputs({
    videosLast90Days: 26,
    channelPublishedAt: daysAgo(800),
  }))
  const reg = r.breakdown.find(b => b.criteria === 'regularity')!
  assert.ok((reg.score ?? 0) >= 85, `cadence forte attendue, reçu ${reg.score}`)
})

test('régularité : chaîne ancienne sans vidéo sur 90 j → 0 (inactive), pas indispo', () => {
  const r = computeSponsorScore(strongInputs({
    videosLast90Days: 0,
    channelPublishedAt: daysAgo(800),
  }))
  const reg = r.breakdown.find(b => b.criteria === 'regularity')!
  assert.equal(reg.score, 0)
  assert.equal(reg.status, 'weak')
})

test('régularité : chaîne neuve sans historique → indisponible (pas pénalisée)', () => {
  const r = computeSponsorScore(strongInputs({
    videosLast90Days: 0,
    channelPublishedAt: daysAgo(5),
  }))
  assert.equal(r.breakdown.find(b => b.criteria === 'regularity')!.status, 'unavailable')
})

test('statsToScoreInputs : champs API string → nombres, snapshot J-30 absent géré', () => {
  const inputs = statsToScoreInputs(
    {
      subscriberCount: '12500',
      recentVideos: [{ viewCount: '900', likeCount: '40', commentCount: '10', publishedAt: daysAgo(3) }],
      analytics: { avgViewPercentage: 35 },
      // subscribers30dAgo absent
    },
    0.6,
    NOW,
  )
  assert.equal(inputs.subscribers, 12500)
  assert.equal(inputs.subscribers30dAgo, null)
  assert.equal(inputs.recentVideos[0].views, 900)
  assert.equal(inputs.avgViewPercentage, 35)
  // Et le calcul tourne sans planter
  const r = computeSponsorScore(inputs)
  assert.ok(Number.isFinite(r.globalScore))
})
