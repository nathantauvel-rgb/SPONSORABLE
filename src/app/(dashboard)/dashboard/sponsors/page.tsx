'use client'

import { Lock, Zap } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import {
  buildScoreInputs,
  computeUniversalScore,
  SPONSOR_GRADES,
  type ApiPlatform,
  type ApiProfile,
  type UniversalSponsorScore,
  type DimensionResult,
  type PlatformReadout,
  type PlatformKind,
} from '@/lib/sponsorScore'

// ─── Design system ─────────────────────────────────────────────────────────────
const BG = '#0d0d0f'
const SURFACE = '#111318'
const CARD = '#1c1f26'
const ACCENT = '#22c55e'
const TEXT = '#ffffff'
const MUTED = '#888888'
const BORDER = '#222222'
const AMBER = '#d97706'
const SYNE = 'var(--font-syne), system-ui, sans-serif'
const DISPLAY = 'var(--font-display), system-ui, sans-serif'
const NUM = '"Martian Mono", var(--font-num), ui-monospace, monospace'

// Couleurs de marque (uniquement pour les accents des cartes plateforme)
const BRAND: Record<PlatformKind, { name: string; color: string; tint: string; icon: string }> = {
  youtube: { name: 'YouTube', color: '#ff4444', tint: 'rgba(255,68,68,0.14)', icon: '▶' },
  twitch: { name: 'Twitch', color: '#a970ff', tint: 'rgba(145,70,255,0.16)', icon: '◈' },
}

// ─── Formatage ───────────────────────────────────────────────────────────────
const fmtNum = (n: number) => n >= 1_000_000
  ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  : String(n)

const fmtPct = (n: number) => `${n.toFixed(n >= 10 ? 0 : 1).replace('.', ',')} %`

// ─── Jauge circulaire ───────────────────────────────────────────────────────

const ScoreDial = ({ score, color, animate }: { score: number; color: string; animate: boolean }) => {
  const R = 54
  const C = 2 * Math.PI * R
  const theta = (score / 100) * 2 * Math.PI
  const headX = 66 + R * Math.sin(theta)
  const headY = 66 - R * Math.cos(theta)
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label={`Score ${score} sur 100`}>
      <defs>
        <filter id="dial-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="dial-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle cx="66" cy="66" r={R} fill="none" stroke={CARD} strokeWidth="11" />
      <circle cx="66" cy="66" r={R} fill="none" stroke="url(#dial-grad)" strokeWidth="11" strokeLinecap="round"
        strokeDasharray={animate ? `${(score / 100) * C} ${C}` : `0 ${C}`} transform="rotate(-90 66 66)"
        className="sponso-arc" filter="url(#dial-glow)" />
      {animate && score > 0 && (
        <g className="sponso-head" style={{ transformOrigin: `${headX}px ${headY}px` }}>
          <circle cx={headX} cy={headY} r="6" fill={color} opacity="0.3" filter="url(#dial-glow)" />
          <circle cx={headX} cy={headY} r="3.5" fill="#fff" />
          <circle cx={headX} cy={headY} r="2" fill={color} />
        </g>
      )}
      <text x="66" y="72" textAnchor="middle" fill={TEXT} style={{ fontFamily: NUM, fontSize: '36px', fontWeight: 600, letterSpacing: '-0.04em' }}>{score}</text>
      <text x="66" y="90" textAnchor="middle" fill={MUTED} style={{ fontFamily: NUM, fontSize: '11px' }}>/100</text>
    </svg>
  )
}

// ─── Pro gate ──────────────────────────────────────────────────────────────────

const ProGate = ({ message }: { message: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', background: 'rgba(13,13,15,0.88)', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 18px', marginTop: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Lock size={13} color={MUTED} />
      <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5, fontFamily: SYNE }}>{message}</p>
    </div>
    <Link href="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, fontWeight: 600, fontSize: '12px', textDecoration: 'none', flexShrink: 0, fontFamily: SYNE }}>
      <Zap size={12} /> Passer Pro
    </Link>
  </div>
)

// ─── Carte plateforme ───────────────────────────────────────────────────────

const PlatformCard = ({ p, animate }: { p: PlatformReadout; animate: boolean }) => {
  const brand = BRAND[p.kind]
  const hasMetric = p.metricValue != null
  const barColor = p.metricProgress >= 0.66 ? ACCENT : AMBER
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderTop: `2px solid ${brand.color}`, borderRadius: '0 0 12px 12px', padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span aria-hidden style={{ width: '24px', height: '24px', borderRadius: '6px', background: brand.tint, color: brand.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>{brand.icon}</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: TEXT, fontFamily: SYNE }}>{brand.name}</span>
        {p.audienceCount != null && (
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: MUTED, fontFamily: NUM }}>{fmtNum(p.audienceCount)} {p.kind === 'youtube' ? 'abonnés' : 'followers'}</span>
        )}
      </div>

      {hasMetric ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#999', fontFamily: SYNE }}>{p.metricLabel}</span>
            <span style={{ fontSize: '11px', color: MUTED, fontFamily: SYNE }}>cible <span style={{ color: ACCENT, fontFamily: NUM }}>{fmtPct(p.metricTarget)}</span></span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: TEXT, fontFamily: NUM, letterSpacing: '-0.02em', marginBottom: '10px' }}>{fmtPct(p.metricValue as number)}</div>
          <div style={{ position: 'relative', height: '7px', background: BG, borderRadius: '9999px' }}>
            <div className="sponso-bar" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: animate ? `${Math.round(p.metricProgress * 100)}%` : '0%', background: barColor, borderRadius: '9999px' }} />
            <div aria-hidden style={{ position: 'absolute', left: '100%', top: '-4px', width: '1.5px', height: '15px', background: 'rgba(255,255,255,0.5)', transform: 'translateX(-1px)' }} />
          </div>
        </>
      ) : (
        <p style={{ fontSize: '13px', color: MUTED, fontFamily: SYNE, lineHeight: 1.5 }}>Pas encore assez de données pour mesurer ta métrique reine.</p>
      )}

      <p style={{ fontSize: '11px', color: MUTED, marginTop: '10px', lineHeight: 1.5, fontFamily: SYNE }}>{p.tip}</p>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SponsorsPage() {
  const [pro, setPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<UniversalSponsorScore | null>(null)
  const [platformCount, setPlatformCount] = useState(0)
  const [animate, setAnimate] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [meData, profData] = await Promise.all([
        fetch('/api/me', { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
        fetch('/api/profile', { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
      ])
      setPro(meData?.isPro ?? false)
      const apiPlatforms: ApiPlatform[] = (meData?.platforms ?? []).map((p: ApiPlatform) => ({ type: p.type, stats: p.stats }))
      setPlatformCount(apiPlatforms.length)
      const profile: ApiProfile = profData?.profile ?? {}
      const inputs = buildScoreInputs(apiPlatforms, profile)
      setResult(computeUniversalScore(inputs))
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
    } catch { /* on garde l'état précédent en cas d'échec réseau */ }
  }, [])

  useEffect(() => {
    loadData().finally(() => setLoading(false))
    const onFocus = () => loadData()
    const onVisible = () => { if (document.visibilityState === 'visible') loadData() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loadData])

  const hasPlatforms = platformCount > 0
  const gradeColor = result ? (result.grade.level >= 3 ? '#16a34a' : result.grade.level === 2 ? ACCENT : AMBER) : ACCENT
  const confColor = result ? (result.confidence.level === 'eleve' ? ACCENT : result.confidence.level === 'moyen' ? '#0284c7' : MUTED) : MUTED
  const confDots = result ? (result.confidence.level === 'eleve' ? 3 : result.confidence.level === 'moyen' ? 2 : 1) : 0

  const block: React.CSSProperties = { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '28px', marginBottom: '48px' }

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: SYNE }}>
      <Sidebar />
      <main className="dash-main" style={{ marginLeft: '240px', padding: '40px 48px', maxWidth: '1100px' }}>

        {/* Bandeau Pro */}
        {!loading && !pro && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '12px 18px', marginBottom: '24px', color: TEXT }}>
            <p style={{ fontSize: '13px', color: MUTED, fontFamily: SYNE }}>
              <span style={{ color: TEXT, fontWeight: 600 }}>Score et grade gratuits.</span> Le détail par plateforme et les dimensions sont réservés au Pro.
            </p>
            <Link href="/dashboard/settings" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: ACCENT, color: '#000', fontWeight: 700, fontSize: '13px', textDecoration: 'none', flexShrink: 0, fontFamily: SYNE }}>
              <Zap size={13} /> Passer Pro
            </Link>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: TEXT, marginBottom: '8px', letterSpacing: '-0.02em', fontFamily: DISPLAY }}>Sponsorabilité</h1>
          <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, fontFamily: SYNE, display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
            <Lock size={11} style={{ flexShrink: 0 }} />
            Privé — invisible pour les marques.
          </p>
        </div>

        {loading ? (
          <div style={{ ...block, padding: '60px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: MUTED, fontFamily: SYNE }}>Calcul en cours…</p>
          </div>
        ) : !result ? (
          <div style={{ ...block, padding: '60px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: MUTED, fontFamily: SYNE }}>Impossible de charger ton diagnostic. Réessaie dans un instant.</p>
          </div>
        ) : (
          <>
            {/* ══ COCKPIT : identité unifiée ════════════════════════════════ */}
            <div style={{ ...block, padding: '30px 32px' }}>
              <div className="sponso-cockpit">
                <ScoreDial score={result.globalScore} color={gradeColor} animate={animate} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
                  {/* Grade */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: gradeColor, background: `${gradeColor}1c`, border: `1px solid ${gradeColor}40`, borderRadius: '5px', padding: '4px 11px', fontFamily: SYNE }}>
                      Grade {result.grade.level} · {result.grade.name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#666', fontFamily: NUM }}>{result.grade.level} / {result.grade.total}</span>
                  </div>

                  <p style={{ fontSize: 'clamp(18px, 2.3vw, 23px)', fontWeight: 700, color: TEXT, lineHeight: 1.35, letterSpacing: '-0.01em', fontFamily: DISPLAY, maxWidth: '540px' }}>
                    {result.grade.verdict}
                  </p>

                  {/* Diagnostic (confiance) + sources */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#999', fontFamily: SYNE }}>Diagnostic</span>
                      <span aria-hidden style={{ display: 'flex', gap: '3px' }}>
                        {[1, 2, 3].map(i => (
                          <span key={i} style={{ width: '18px', height: '5px', borderRadius: '9999px', background: i <= confDots ? confColor : '#2a2e36' }} />
                        ))}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: TEXT, fontFamily: SYNE }}>{result.confidence.label}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: MUTED, fontFamily: SYNE }}>
                      Sources prises en compte : {result.sources.map((s, i) => (
                        <span key={s}>{i > 0 && ' + '}<span style={{ color: s === 'profil' ? '#ccc' : s === 'Twitch' ? '#a970ff' : '#ff6b6b' }}>{s}</span></span>
                      ))}
                    </p>
                  </div>

                  {/* Conseil */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '12px 14px' }}>
                    <Zap size={14} color={ACCENT} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ fontSize: '13px', color: '#cbd5cb', lineHeight: 1.5, fontFamily: SYNE }}>
                      <span style={{ color: ACCENT, fontWeight: 600 }}>Conseil : </span>{result.advice}
                    </p>
                  </div>
                </div>
              </div>

              {/* Échelle de grades */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '24px' }}>
                {SPONSOR_GRADES.map(g => {
                  const isCurrent = g.level === result.grade.level
                  const isPast = g.level < result.grade.level
                  return (
                    <div key={g.level} style={{ textAlign: 'center', padding: '10px 6px', borderRadius: '8px', background: isCurrent ? 'rgba(34,197,94,0.07)' : isPast ? 'rgba(255,255,255,0.02)' : 'transparent', border: isCurrent ? '1.5px solid rgba(34,197,94,0.5)' : `1px solid ${BORDER}`, opacity: !isCurrent && !isPast ? 0.6 : 1 }}>
                      <div style={{ fontSize: '11px', fontFamily: NUM, color: isCurrent ? ACCENT : isPast ? '#888' : '#666', marginBottom: '3px' }}>
                        {isPast ? '✓' : isCurrent ? '◆' : `0${g.level}`}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: isCurrent ? TEXT : isPast ? '#aaa' : '#888', fontFamily: SYNE }}>{g.name}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ══ CARTES PAR PLATEFORME ═════════════════════════════════════ */}
            {hasPlatforms ? (
              pro ? (
                <div style={block}>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, fontFamily: DISPLAY, letterSpacing: '-0.01em', marginBottom: '4px' }}>Tes plateformes</p>
                  <p style={{ fontSize: '12px', color: MUTED, marginBottom: '18px', fontFamily: SYNE }}>Chaque plateforme connectée, avec sa métrique reine et sa cible.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
                    {result.platforms.map(p => <PlatformCard key={p.kind} p={p} animate={animate} />)}
                  </div>
                </div>
              ) : (
                <div style={block}>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, fontFamily: DISPLAY, letterSpacing: '-0.01em', marginBottom: '8px' }}>Tes plateformes</p>
                  <p style={{ fontSize: '12px', color: MUTED, marginBottom: '16px', fontFamily: SYNE }}>Métrique reine et cible à atteindre, par plateforme.</p>
                  <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[1, 2].map(i => <div key={i} style={{ height: '120px', background: CARD, borderRadius: '10px' }} />)}
                    </div>
                  </div>
                  <ProGate message="Le détail par plateforme (engagement, cibles) est réservé au plan Pro." />
                </div>
              )
            ) : (
              <div style={{ ...block, textAlign: 'center', padding: '40px' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: TEXT, marginBottom: '8px', fontFamily: SYNE }}>Connecte une plateforme pour affiner ton diagnostic</p>
                <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, maxWidth: '440px', margin: '0 auto 20px', fontFamily: SYNE }}>
                  Ton score se calcule déjà sur ton profil. Ajoute YouTube ou Twitch pour mesurer ton audience et ton engagement, et passer le diagnostic en « fiable ».
                </p>
                <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', background: ACCENT, color: '#000', fontWeight: 600, fontSize: '14px', textDecoration: 'none', fontFamily: SYNE }}>
                  Connecter une plateforme
                </Link>
              </div>
            )}

            {/* ══ DÉTAIL DES DIMENSIONS (replié) ════════════════════════════ */}
            {pro ? (
              <div style={block}>
                <button
                  onClick={() => setShowDetail(v => !v)}
                  aria-expanded={showDetail}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                >
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, fontFamily: DISPLAY, letterSpacing: '-0.01em' }}>Le détail de ton score</p>
                    <p style={{ fontSize: '12px', color: MUTED, marginTop: '6px', fontFamily: SYNE }}>Les 5 dimensions et leurs sources.</p>
                  </div>
                  <span aria-hidden style={{ fontFamily: NUM, fontSize: '18px', color: showDetail ? ACCENT : MUTED, transition: 'transform 240ms ease', transform: showDetail ? 'rotate(45deg)' : 'none', lineHeight: 1, flexShrink: 0 }}>+</span>
                </button>
                {showDetail && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    {result.dimensions.map(d => <DimensionRow key={d.key} d={d} animate={animate} />)}
                  </div>
                )}
              </div>
            ) : (
              <div style={block}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, fontFamily: DISPLAY, letterSpacing: '-0.01em', marginBottom: '8px' }}>Le détail de ton score</p>
                <p style={{ fontSize: '12px', color: MUTED, marginBottom: '16px', fontFamily: SYNE }}>Les 5 dimensions universelles qui composent ton score.</p>
                <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: '40px', background: CARD, borderRadius: '8px' }} />)}
                  </div>
                </div>
                <ProGate message="Le détail des 5 dimensions est réservé au plan Pro." />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ─── Ligne de dimension (détail repliable) ──────────────────────────────────

const SOURCE_NAME: Record<string, string> = { profil: 'profil', youtube: 'YouTube', twitch: 'Twitch' }

const DimensionRow = ({ d, animate }: { d: DimensionResult; animate: boolean }) => {
  const unavailable = d.status === 'unavailable'
  const barColor = d.status === 'strong' ? ACCENT : d.status === 'improve' ? '#0284c7' : AMBER
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', opacity: unavailable ? 0.5 : 1 }}>
      <span style={{ width: '150px', fontSize: '13px', fontWeight: 500, color: unavailable ? '#aaa' : TEXT, flexShrink: 0, fontFamily: SYNE }}>{d.label}</span>
      <div style={{ flex: 1, height: '6px', background: BG, borderRadius: '9999px', position: 'relative', border: unavailable ? `1px dashed #333` : 'none' }}>
        {!unavailable && (
          <div className="sponso-bar" style={{ position: 'absolute', inset: 0, width: animate ? `${d.score}%` : '0%', background: barColor, borderRadius: '9999px' }} />
        )}
      </div>
      <span style={{ width: '70px', textAlign: 'right', fontSize: '10px', color: unavailable ? '#666' : MUTED, fontFamily: NUM, flexShrink: 0 }}>
        {unavailable ? 'non évalué' : d.sources.map(s => SOURCE_NAME[s] ?? s).join(' + ')}
      </span>
    </div>
  )
}
