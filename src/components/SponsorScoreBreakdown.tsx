'use client'

/**
 * Affichage du breakdown du score de sponsorabilité.
 * Composant de présentation pur : il ne calcule rien, il consomme un `SponsorScore`
 * produit par `computeSponsorScore` (src/lib/sponsorScore.ts).
 */
import type { CriterionKey, CriterionStatus, SponsorScore } from '@/lib/sponsorScore'

const SURFACE = '#111318'
const CARD = '#1c1f26'
const ACCENT = '#22c55e'
const TEXT = '#ffffff'
const MUTED = '#888888'
const BORDER = '#222222'
const AMBER = '#d97706'
const RED = '#ef4444'
const SYNE = 'var(--font-syne), system-ui, sans-serif'
const DISPLAY = 'var(--font-display), system-ui, sans-serif'
const NUM = '"Martian Mono", var(--font-num), ui-monospace, monospace'

const LABELS: Record<CriterionKey, string> = {
  engagement: 'Taux d\'engagement',
  viewsToSubs: 'Portée (vues / abonnés)',
  regularity: 'Régularité d\'upload',
  growth: 'Croissance 30 j',
  retention: 'Rétention',
}

const STATUS_META: Record<CriterionStatus, { icon: string; color: string; label: string }> = {
  strong: { icon: '✅', color: ACCENT, label: 'Point fort' },
  improve: { icon: '⚠️', color: AMBER, label: 'À améliorer' },
  weak: { icon: '❌', color: RED, label: 'Point faible' },
  unavailable: { icon: '—', color: MUTED, label: 'Indisponible' },
}

export default function SponsorScoreBreakdown({ result, animate = true }: { result: SponsorScore; animate?: boolean }) {
  const { globalScore, breakdown, insights } = result

  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '26px 28px', fontFamily: SYNE }}>
      {/* En-tête : score global + insights */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '52px', fontWeight: 600, color: TEXT, lineHeight: 1, letterSpacing: '-0.04em', fontFamily: NUM, fontVariantNumeric: 'tabular-nums' }}>{globalScore}</span>
          <span style={{ fontSize: '14px', color: MUTED, fontFamily: NUM }}>/100</span>
        </div>
        <p style={{ flex: 1, minWidth: '220px', fontSize: '15px', color: TEXT, lineHeight: 1.55, fontFamily: DISPLAY, fontWeight: 600, letterSpacing: '-0.01em' }}>
          {insights}
        </p>
      </div>

      {/* Liste des critères */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {breakdown.map(c => {
          const meta = STATUS_META[c.status]
          const unavailable = c.status === 'unavailable'
          const pct = c.score ?? 0
          return (
            <div
              key={c.criteria}
              style={{
                background: CARD,
                border: `1px solid ${c.status === 'strong' ? 'rgba(34,197,94,0.3)' : BORDER}`,
                borderRadius: '10px',
                padding: '14px 18px',
                opacity: unavailable ? 0.55 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: unavailable ? 0 : '10px' }}>
                <span aria-hidden style={{ fontSize: '13px', flexShrink: 0 }}>{meta.icon}</span>
                <span style={{ flex: 1, fontSize: '14px', fontWeight: 700, color: TEXT }}>{LABELS[c.criteria]}</span>

                {/* Poids effectif (transparence sur la pondération réelle) */}
                {!unavailable && c.weight > 0 && (
                  <span style={{ fontFamily: NUM, fontSize: '10px', color: MUTED, flexShrink: 0 }}>
                    {Math.round(c.weight * 100)} %
                  </span>
                )}

                {/* Sous-score */}
                <span style={{ fontFamily: NUM, fontSize: '13px', fontWeight: 700, color: meta.color, flexShrink: 0, minWidth: '54px', textAlign: 'right' }}>
                  {unavailable ? meta.label : `${c.score}/100`}
                </span>
              </div>

              {/* Barre de progression du sous-score */}
              {!unavailable && (
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: animate ? `${pct}%` : '0%',
                      background: meta.color,
                      borderRadius: '9999px',
                      transition: 'width 900ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  />
                </div>
              )}

              {/* Explication d'une phrase */}
              <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5, paddingLeft: '25px' }}>{c.message}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
