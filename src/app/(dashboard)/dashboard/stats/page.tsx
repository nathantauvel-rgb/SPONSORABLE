'use client'

import { Download, Lock, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'

// Palette dark
const BG      = '#0d0d0f'
const SURFACE = '#111318'
const CARD    = '#1c1f26'
const ACCENT  = '#22c55e'
const TEXT    = '#ffffff'
const MUTED   = '#888888'
const BORDER  = '#222222'
const SYNE    = '"Syne", var(--font-syne), system-ui, sans-serif'
const DISPLAY = '"Cabinet Grotesk", var(--font-display), system-ui, sans-serif'
const NUM     = '"Martian Mono", var(--font-num), ui-monospace, monospace'

const COUNTRY_NAMES: Record<string, string> = {
  FR: 'France', BE: 'Belgique', CH: 'Suisse', CA: 'Canada', LU: 'Luxembourg',
  DE: 'Allemagne', ES: 'Espagne', IT: 'Italie', GB: 'Royaume-Uni', US: 'États-Unis',
  NL: 'Pays-Bas', PT: 'Portugal', MA: 'Maroc', DZ: 'Algérie', TN: 'Tunisie',
}

const ProGate = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,13,15,0.85)', backdropFilter: 'blur(6px)', borderRadius: '16px' }}>
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '40px 48px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.40)', maxWidth: '380px' }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `rgba(34,197,94,0.10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: ACCENT }}>
        <Lock size={22} />
      </div>
      <p style={{ fontSize: '18px', fontWeight: 700, color: TEXT, marginBottom: '8px', fontFamily: SYNE }}>Statistiques Pro</p>
      <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, marginBottom: '24px', fontFamily: SYNE }}>
        Accède aux vues, clics, parcours des marques et liens traçables avec le plan Pro.
      </p>
      <Link
        href="/dashboard/settings"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '12px', background: ACCENT, color: '#000', fontWeight: 700, fontSize: '14px', textDecoration: 'none', fontFamily: SYNE }}
      >
        <Zap size={15} /> Passer au Pro — 19€/mois
      </Link>
      <p style={{ fontSize: '12px', color: MUTED, marginTop: '14px', fontFamily: SYNE }}>Sans engagement · Annulable à tout moment</p>
    </div>
  </div>
)

type AnalyticsData = {
  views: { date: string; count: number }[]
  total: number
  last30: number
  last7: number
  today: number
  topCountries: { country: string; count: number }[]
  topReferers: { source: string; count: number }[]
}

const StatCard = ({ label, value, sub, positive }: { label: string; value: string; sub: string; positive?: boolean }) => (
  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.30)' }}>
    <p style={{ fontSize: '12px', fontWeight: 500, color: MUTED, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: SYNE }}>{label}</p>
    <p style={{ fontSize: '30px', fontWeight: 600, color: TEXT, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '8px', fontFamily: NUM, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
    <p style={{ fontSize: '12px', fontWeight: 500, color: positive === false ? '#ef4444' : ACCENT, fontFamily: SYNE }}>{sub}</p>
  </div>
)

export default function StatsPage() {
  const [pro, setPro] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(data => { if (typeof data.isPro === 'boolean') setPro(data.isPro) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setAnalytics(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const views = analytics?.views ?? []
  const maxViews = views.length ? Math.max(...views.map(v => v.count), 1) : 1
  const totalViews = analytics?.total ?? 0
  const last30 = analytics?.last30 ?? 0
  const last7 = analytics?.last7 ?? 0
  const today = analytics?.today ?? 0
  const topCountries = analytics?.topCountries ?? []
  const topReferers = analytics?.topReferers ?? []

  // Calcul du pic
  const peak = views.reduce((p, v) => v.count > p.count ? v : p, { date: '', count: 0 })
  const avg = views.length ? (last30 / 30).toFixed(1) : '0'

  // Nombre de messages reçus
  const [msgCount, setMsgCount] = useState(0)
  useEffect(() => {
    fetch('/api/messages')
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(data => setMsgCount((data.messages ?? []).length))
      .catch(() => {})
  }, [])

  const totalCountryViews = topCountries.reduce((sum, c) => sum + c.count, 0) || 1

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', padding: '40px 48px' }}>

        {!pro && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '14px', padding: '16px 24px', marginBottom: '28px', color: TEXT }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `rgba(34,197,94,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT }}>
                <Lock size={15} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, fontFamily: SYNE }}>Les statistiques sont réservées au plan Pro</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '1px', fontFamily: SYNE }}>Aperçu en dessous — passe au Pro pour déverrouiller</p>
              </div>
            </div>
            <Link href="/dashboard/settings" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '10px', background: ACCENT, color: '#000', fontWeight: 700, fontSize: '13px', textDecoration: 'none', flexShrink: 0, fontFamily: SYNE }}>
              <Zap size={13} /> Upgrader
            </Link>
          </div>
        )}

        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: TEXT, marginBottom: '6px', letterSpacing: '-0.02em', fontFamily: DISPLAY }}>Statistiques</h1>
            <p style={{ fontSize: '14px', color: MUTED, fontFamily: SYNE }}>Analytics de ton media kit · 30 derniers jours</p>
          </div>
          {pro ? (
            <button
              onClick={() => window.print()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.30)', transition: 'all 150ms', fontFamily: SYNE }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = SURFACE }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = CARD }}
            >
              <Download size={15} /> Exporter PDF
            </button>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: `1px dashed ${BORDER}`, background: SURFACE, color: MUTED, fontSize: '13px', fontWeight: 500, cursor: 'default', fontFamily: SYNE }}>
              <Lock size={13} /> Export PDF · Pro
            </div>
          )}
        </div>

        {loading ? (
          <p style={{ color: MUTED, fontSize: '14px', fontFamily: SYNE }}>Chargement des statistiques…</p>
        ) : (
          <>
            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px', filter: pro ? 'none' : 'blur(3px)', pointerEvents: pro ? 'auto' : 'none', userSelect: pro ? 'auto' : 'none' }}>
              <StatCard label="Total vues" value={totalViews.toString()} sub={`${last30} ce mois · ${today} aujourd'hui`} positive />
              <StatCard label="7 derniers jours" value={last7.toString()} sub={last7 > 0 ? `↑ ${last7} vues` : 'Aucune vue récente'} positive={last7 > 0} />
              <StatCard label="Messages reçus" value={msgCount.toString()} sub={msgCount > 0 ? `${msgCount} proposition${msgCount > 1 ? 's' : ''} reçue${msgCount > 1 ? 's' : ''}` : 'Partage ton media kit'} positive={msgCount > 0} />
              <StatCard label="Aujourd'hui" value={today.toString()} sub={today > 0 ? `${today} vue${today > 1 ? 's' : ''} aujourd'hui` : 'Aucune vue pour le moment'} positive={today > 0} />
            </div>

            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start', filter: pro ? 'none' : 'blur(3px)', pointerEvents: pro ? 'auto' : 'none', userSelect: pro ? 'auto' : 'none' }}>

              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.30)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: TEXT, fontFamily: SYNE }}>Vues du media kit</p>
                    <p style={{ fontSize: '13px', color: MUTED, marginTop: '2px', fontFamily: SYNE }}>30 derniers jours</p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: ACCENT, background: `rgba(34,197,94,0.10)`, border: `1px solid rgba(34,197,94,0.25)`, borderRadius: '9999px', padding: '4px 12px', fontFamily: SYNE }}>
                    {last30} ce mois
                  </span>
                </div>

                {last30 === 0 ? (
                  <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: '14px', flexDirection: 'column', gap: '8px', fontFamily: SYNE }}>
                    <span style={{ fontSize: '32px' }}>📊</span>
                    <p>Les vues apparaîtront ici dès que quelqu'un visitera ton media kit</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '140px', marginBottom: '10px' }}>
                      {views.map((v, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                          <div
                            title={`${v.count} vue${v.count !== 1 ? 's' : ''} le ${v.date}`}
                            style={{
                              width: '100%',
                              height: `${(v.count / maxViews) * 100}%`,
                              background: v.count === maxViews ? ACCENT : 'rgba(34,197,94,0.20)',
                              borderRadius: '3px 3px 0 0',
                              transition: 'background 150ms ease',
                              cursor: 'default',
                              minHeight: v.count > 0 ? '4px' : '0',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = ACCENT }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = v.count === maxViews ? ACCENT : 'rgba(34,197,94,0.20)' }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {views.map((v, i) => (
                        <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '9px', color: MUTED, fontWeight: 500, fontFamily: SYNE }}>
                          {i % 5 === 0 ? v.date.slice(5) : ''}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: '24px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: MUTED, marginBottom: '2px', fontFamily: SYNE }}>Pic de vues</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, fontFamily: SYNE }}>{peak.count > 0 ? `${peak.count} vues · ${peak.date}` : '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: MUTED, marginBottom: '2px', fontFamily: SYNE }}>Moyenne / jour</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, fontFamily: SYNE }}>{avg} vues</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: MUTED, marginBottom: '2px', fontFamily: SYNE }}>Tendance</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: last7 > 0 ? ACCENT : MUTED, fontFamily: SYNE }}>
                      {last7 > 0 ? '↑ Actif' : '— Pas encore de données'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.30)' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: TEXT, marginBottom: '18px', fontFamily: SYNE }}>Top pays</p>
                  {topCountries.length === 0 ? (
                    <p style={{ fontSize: '13px', color: MUTED, textAlign: 'center', padding: '16px 0', fontFamily: SYNE }}>Pas encore de données</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {topCountries.map(c => {
                        const pct = Math.round((c.count / totalCountryViews) * 100)
                        return (
                          <div key={c.country}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '16px' }}>{getFlagEmoji(c.country)}</span>
                                <span style={{ fontSize: '13px', fontWeight: 500, color: TEXT, fontFamily: SYNE }}>{COUNTRY_NAMES[c.country] ?? c.country}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', color: MUTED, fontFamily: SYNE }}>{c.count} vues</span>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: ACCENT, width: '34px', textAlign: 'right', fontFamily: SYNE }}>{pct}%</span>
                              </div>
                            </div>
                            <div style={{ height: '4px', background: BORDER, borderRadius: '9999px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, rgba(34,197,94,0.6), ${ACCENT})`, borderRadius: '9999px' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.30)' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: TEXT, marginBottom: '18px', fontFamily: SYNE }}>Sources de trafic</p>
                  {topReferers.length === 0 ? (
                    <p style={{ fontSize: '13px', color: MUTED, textAlign: 'center', padding: '16px 0', fontFamily: SYNE }}>Pas encore de données</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {topReferers.map(r => {
                        const totalRef = topReferers.reduce((s, x) => s + x.count, 0) || 1
                        const pct = Math.round((r.count / totalRef) * 100)
                        return (
                          <div key={r.source} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13px', color: MUTED, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: SYNE }}>{r.source}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '12px', color: MUTED, fontFamily: SYNE }}>{r.count}</span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: ACCENT, fontFamily: SYNE }}>{pct}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!pro && (
              <div style={{ position: 'relative', marginTop: '24px' }}>
                <div style={{ height: '80px', position: 'relative' }}>
                  <ProGate />
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍'
  const codePoints = [...countryCode.toUpperCase()].map(c => 0x1F1E0 + c.charCodeAt(0) - 65)
  return String.fromCodePoint(...codePoints)
}
