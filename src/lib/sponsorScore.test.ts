/**
 * Tests du moteur de score UNIVERSEL.
 * Lancer : npm run test   (test runner natif de Node via tsx)
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  computeUniversalScore,
  buildScoreInputs,
  type UniversalScoreInputs,
  type ProfileInputs,
  type PlatformInput,
} from './sponsorScore'

// ─── Fabriques de fixtures ──────────────────────────────────────────────────

function fullProfile(over: Partial<ProfileInputs> = {}): ProfileInputs {
  return {
    completeness: 1,
    availableForCollabs: true,
    hasCalendly: true,
    hasPartnerships: true,
    hasTargetBrands: true,
    ...over,
  }
}

const strongYouTube: PlatformInput = {
  kind: 'youtube',
  stats: { subscriberCount: 90000, engagementRate: 6, recentVideosCount: 6, avgViewsPerVideo: 12000 },
}
const strongTwitch: PlatformInput = {
  kind: 'twitch',
  stats: { followerCount: 40000, avgVodViews: 900, recentStreamsCount: 6, clipsCount: 5 },
}

function inputs(over: Partial<UniversalScoreInputs> = {}): UniversalScoreInputs {
  return { profile: fullProfile(), platforms: [strongYouTube], ...over }
}

// ─── Universalité : mono-plateforme jamais pénalisé ─────────────────────────

test('Twitch-only : score correct, dimensions plateforme évaluées via Twitch', () => {
  const r = computeUniversalScore(inputs({ platforms: [strongTwitch] }))
  assert.ok(r.globalScore >= 60, `attendu ≥60, reçu ${r.globalScore}`)
  for (const k of ['activite', 'audience', 'engagement'] as const) {
    const d = r.dimensions.find(d => d.key === k)!
    assert.notEqual(d.score, null, `${k} devrait être évaluée`)
    assert.deepEqual(d.sources, ['twitch'])
  }
})

test('YouTube-only et Twitch-only forts obtiennent tous deux un bon score', () => {
  const yt = computeUniversalScore(inputs({ platforms: [strongYouTube] }))
  const tw = computeUniversalScore(inputs({ platforms: [strongTwitch] }))
  assert.ok(yt.globalScore >= 60 && tw.globalScore >= 60)
})

test('absence de plateforme : dimensions plateforme non évaluées, jamais zéro', () => {
  const r = computeUniversalScore(inputs({ platforms: [] }))
  for (const k of ['activite', 'audience', 'engagement'] as const) {
    const d = r.dimensions.find(d => d.key === k)!
    assert.equal(d.status, 'unavailable')
    assert.equal(d.score, null)
    assert.equal(d.weight, 0)
  }
  // profil + conversion restent évaluées et portent 100 % du poids
  const evaluated = r.dimensions.filter(d => d.score != null)
  const wsum = evaluated.reduce((s, d) => s + d.weight, 0)
  assert.ok(Math.abs(wsum - 1) < 0.02, `poids redistribué = ${wsum}`)
})

test('poids redistribué : la somme des poids évalués vaut toujours 1', () => {
  const r = computeUniversalScore(inputs({ platforms: [strongTwitch] }))
  const wsum = r.dimensions.filter(d => d.score != null).reduce((s, d) => s + d.weight, 0)
  assert.ok(Math.abs(wsum - 1) < 0.02, `somme des poids = ${wsum}`)
})

// ─── profil / conversion : toujours évaluées (jamais « non évaluées ») ──────

test('profil et conversion toujours évaluées, même sans plateforme', () => {
  const r = computeUniversalScore(inputs({ platforms: [], profile: fullProfile({ completeness: 0, availableForCollabs: false, hasCalendly: false, hasPartnerships: false, hasTargetBrands: false }) }))
  const profil = r.dimensions.find(d => d.key === 'profil')!
  const conv = r.dimensions.find(d => d.key === 'conversion')!
  assert.notEqual(profil.status, 'unavailable')
  assert.notEqual(conv.status, 'unavailable')
  // Vides → faibles, pas « non évaluées »
  assert.equal(profil.score, 0)
  assert.equal(conv.score, 0)
})

// ─── Audience cumulée ───────────────────────────────────────────────────────

test('audience cumulée : 2 plateformes additionnent leurs tailles', () => {
  const solo = computeUniversalScore(inputs({ platforms: [{ kind: 'youtube', stats: { subscriberCount: 10000, engagementRate: 5, recentVideosCount: 3 } }] }))
  const duo = computeUniversalScore(inputs({ platforms: [
    { kind: 'youtube', stats: { subscriberCount: 10000, engagementRate: 5, recentVideosCount: 3 } },
    { kind: 'twitch', stats: { followerCount: 90000, avgVodViews: 200, recentStreamsCount: 3 } },
  ] }))
  const aSolo = solo.dimensions.find(d => d.key === 'audience')!.score!
  const aDuo = duo.dimensions.find(d => d.key === 'audience')!.score!
  assert.ok(aDuo > aSolo, `audience cumulée devrait être plus haute (${aDuo} vs ${aSolo})`)
})

// ─── Indice de confiance ────────────────────────────────────────────────────

test('confiance : 0 plateforme = indicatif, 1 = moyen, 2 = élevé', () => {
  assert.equal(computeUniversalScore(inputs({ platforms: [] })).confidence.level, 'faible')
  assert.equal(computeUniversalScore(inputs({ platforms: [strongYouTube] })).confidence.level, 'moyen')
  assert.equal(computeUniversalScore(inputs({ platforms: [strongYouTube, strongTwitch] })).confidence.level, 'eleve')
})

test('sources prises en compte : plateformes seules, profil seulement si unique source', () => {
  const r = computeUniversalScore(inputs({ platforms: [strongTwitch] }))
  assert.deepEqual(r.sources, ['Twitch'])
  const r2 = computeUniversalScore(inputs({ platforms: [strongYouTube, strongTwitch] }))
  assert.deepEqual(r2.sources, ['YouTube', 'Twitch'])
  // Sans plateforme : le profil reste l'unique source affichée
  const r3 = computeUniversalScore(inputs({ platforms: [] }))
  assert.deepEqual(r3.sources, ['profil'])
})

// ─── Grades ─────────────────────────────────────────────────────────────────

test('grade dérivé du score : faible → 1, fort → 3', () => {
  const low = computeUniversalScore(inputs({ platforms: [], profile: fullProfile({ completeness: 0, availableForCollabs: false, hasCalendly: false, hasPartnerships: false, hasTargetBrands: false }) }))
  assert.equal(low.grade.level, 1)
  const high = computeUniversalScore(inputs({ platforms: [strongYouTube, strongTwitch] }))
  assert.ok(high.grade.level >= 2)
  assert.equal(high.grade.total, 3)
})

// ─── Cartes plateforme ──────────────────────────────────────────────────────

test('readout plateforme : métrique reine + cible + progression', () => {
  const r = computeUniversalScore(inputs({ platforms: [strongYouTube] }))
  const yt = r.platforms.find(p => p.kind === 'youtube')!
  assert.equal(yt.metricLabel, 'Taux d\'engagement')
  assert.equal(yt.metricValue, 6)
  assert.equal(yt.metricTarget, 6)
  assert.ok(yt.metricProgress > 0 && yt.metricProgress <= 1)
  assert.equal(yt.audienceCount, 90000)
})

test('engagement = meilleure plateforme (un créateur fort sur une source n\'est pas tiré vers le bas)', () => {
  const r = computeUniversalScore(inputs({ platforms: [
    { kind: 'youtube', stats: { subscriberCount: 50000, engagementRate: 8, recentVideosCount: 4 } }, // fort
    { kind: 'twitch', stats: { followerCount: 5000, avgVodViews: 10, recentStreamsCount: 1 } },       // faible
  ] }))
  const eng = r.dimensions.find(d => d.key === 'engagement')!
  assert.equal(eng.status, 'strong')
})

// ─── Adaptateur API ─────────────────────────────────────────────────────────

test('buildScoreInputs : mappe les formes API (string → number, longueurs de tableaux)', () => {
  const inp = buildScoreInputs(
    [
      { type: 'youtube', stats: { subscriberCount: '12500', engagementRate: 4.2, recentVideos: [{}, {}, {}] } },
      { type: 'twitch', stats: { followerCount: '40500', avgVodViews: '320', recentStreams: [{}, {}], topClips: [{}] } },
    ],
    { bio: 'Une bio bien remplie de plus de vingt caractères', niche: 'FPS', formats: ['intégration'], positioningPhrase: 'Le meilleur', availableForCollabs: true, calendlyUrl: 'https://cal.com/x' },
  )
  assert.equal(inp.platforms.length, 2)
  const yt = inp.platforms.find(p => p.kind === 'youtube')!
  assert.equal(yt.stats.subscriberCount, 12500)
  assert.equal(yt.stats.recentVideosCount, 3)
  // 4 champs sur 5 remplis (pas de pays/langue) → 0.8
  assert.equal(inp.profile.completeness, 0.8)
  assert.equal(inp.profile.hasCalendly, true)
  // Et le calcul tourne sans planter
  const r = computeUniversalScore(inp)
  assert.ok(Number.isFinite(r.globalScore))
  assert.equal(r.confidence.level, 'eleve')
})
