/**
 * Tests de l'historique de stats & du calcul de tendance.
 * Lancer : npm run test
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildSnapshot, pushHistory, computeTrend, readHistory, type StatPoint } from './statsHistory'

const NOW = Date.UTC(2026, 5, 15)
const DAY = 24 * 60 * 60 * 1000
const dISO = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString().slice(0, 10)
const pt = (daysAgo: number, aud: number, eng: number | null = null, ret: number | null = null): StatPoint => ({ d: dISO(daysAgo), aud, eng, ret })

test('buildSnapshot YouTube : extrait abonnés, engagement, rétention', () => {
  const s = buildSnapshot({ subscriberCount: '12000', engagementRate: 4.2, analytics: { avgViewPercentage: 41 } }, 'youtube', NOW)
  assert.equal(s.aud, 12000)
  assert.equal(s.eng, 4.2)
  assert.equal(s.ret, 41)
  assert.equal(s.d, dISO(0))
})

test('buildSnapshot Twitch : dérive le ratio spectateurs/followers', () => {
  const s = buildSnapshot({ followerCount: 40000, avgVodViews: 400 }, 'twitch', NOW)
  assert.equal(s.aud, 40000)
  assert.equal(s.eng, 1) // 400 / 40000 = 1 %
  assert.equal(s.ret, null)
})

test('pushHistory : un seul point par jour, trié et capé', () => {
  let h: StatPoint[] = []
  h = pushHistory(h, pt(2, 100))
  h = pushHistory(h, pt(1, 110))
  h = pushHistory(h, pt(0, 120))
  h = pushHistory(h, { ...pt(0, 125), eng: 5 }) // même jour → remplace
  assert.equal(h.length, 3)
  assert.equal(h[h.length - 1].aud, 125) // dernier point du jour gagne
  assert.ok(h[0].d < h[1].d && h[1].d < h[2].d) // trié croissant
})

test('pushHistory : cape aux N derniers jours', () => {
  let h: StatPoint[] = []
  for (let i = 100; i >= 0; i--) h = pushHistory(h, pt(i, i), 30)
  assert.equal(h.length, 30)
})

test('computeTrend : null si historique trop court', () => {
  assert.equal(computeTrend([pt(0, 100)], 30, 7, NOW), null)
  // 2 points mais écart < minDays
  assert.equal(computeTrend([pt(3, 100), pt(0, 110)], 30, 7, NOW), null)
})

test('computeTrend : variation audience + engagement sur ~30 j', () => {
  const h = [pt(60, 9000, 3, 38), pt(30, 10000, 3.5, 40), pt(0, 11000, 4, 42)]
  const t = computeTrend(h, 30, 7, NOW)!
  assert.ok(t != null)
  assert.equal(t.days, 30)
  assert.equal(t.audiencePct, 10) // 10000 → 11000
  assert.equal(t.engagementDelta, 0.5) // 3.5 → 4
  assert.equal(t.retentionDelta, 2) // 40 → 42
})

test('computeTrend : s\'adapte à un historique plus court que la cible', () => {
  // Seulement 12 j d'historique, cible 30 j → utilise le plus ancien (12 j)
  const h = [pt(12, 10000, 4), pt(0, 10500, 4.3)]
  const t = computeTrend(h, 30, 7, NOW)!
  assert.equal(t.days, 12)
  assert.equal(t.audiencePct, 5)
})

test('readHistory : tolérant aux formes inattendues', () => {
  assert.deepEqual(readHistory(null), [])
  assert.deepEqual(readHistory({ history: 'nope' }), [])
  assert.equal(readHistory({ history: [pt(0, 1)] }).length, 1)
})
