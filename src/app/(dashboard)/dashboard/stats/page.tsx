'use client'

import { Download, Lock, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Flag from '@/components/ui/Flag'
import Sidebar from '@/components/layout/Sidebar'

const ProGate = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(248,250,252,0.85)', backdropFilter: 'blur(6px)', borderRadius: '16px' }}>
    <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '20px', padding: '40px 48px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.10)', maxWidth: '380px' }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#16a34a' }}>
        <Lock size={22} />
      </div>
      <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Statistiques Pro</p>
      <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
        Accède aux vues, clics, parcours des marques et liens traçables avec le plan Pro.
      </p>
      <Link
        href="/dashboard/settings"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '12px', background: '#16a34a', color: 'white', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}
      >
        <Zap size={15} /> Passer au Pro — 19€/mois
      </Link>
      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '14px' }}>Sans engagement · Annulable à tout moment</p>
    </div>
  </div>
)

const dailyViews = [8, 14, 6, 22, 18, 31, 12, 9, 27, 34, 19, 42, 28, 37]
const days = ['2/5','3/5','4/5','5/5','6/5','7/5','8/5','9/5','10/5','11/5','12/5','13/5','14/5','15/5']
const maxViews = Math.max(...dailyViews)

const topCountries = [
  { flag: 'fr', name: 'France', pct: 68, views: 237 },
  { flag: 'be', name: 'Belgique', pct: 14, views: 49 },
  { flag: 'ch', name: 'Suisse', pct: 9, views: 31 },
  { flag: 'ca', name: 'Canada', pct: 6, views: 21 },
  { flag: 'world', name: 'Autres', pct: 3, views: 10 },
]

const StatCard = ({ label, value, sub, positive }: { label: string; value: string; sub: string; positive?: boolean }) => (
  <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
    <p style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>{label}</p>
    <p style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '8px' }}>{value}</p>
    <p style={{ fontSize: '12px', fontWeight: 500, color: positive === false ? '#ef4444' : '#16a34a' }}>{sub}</p>
  </div>
)

export default function StatsPage() {
  const [pro, setPro] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(data => { if (typeof data.isPro === 'boolean') setPro(data.isPro) })
      .catch(() => {})
  }, [])

  const exportPDF = () => {
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const win = window.open('', '_blank')
    if (!win) return
    // Capture the stats section HTML, inject date, print
    const content = document.getElementById('stats-printable')?.innerHTML ?? ''
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>Statistiques — Sponsorable</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #0f172a; padding: 40px 48px; }
  h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 6px; }
  p { font-size: 13px; color: #64748b; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #0f172a; }
  .logo { font-size: 13px; font-weight: 700; color: #16a34a; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; }
  .footer span { font-size: 11px; color: #cbd5e1; }
  @media print { body { padding: 28px 36px; } }
</style></head><body>
<div class="header">
  <div><h1>Statistiques</h1><p>Analytics de ton media kit · 30 derniers jours</p></div>
  <div class="logo">Sponsorable</div>
</div>
${content}
<div class="footer">
  <span>Exporté le ${date}</span>
  <span>sponsorable.gg</span>
</div>
</body></html>`

    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document
    if (!doc) { document.body.removeChild(iframe); return }
    doc.open(); doc.write(html); doc.close()
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => { document.body.removeChild(iframe) }, 2000)
    }, 300)
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', padding: '40px 48px' }}>

        {!pro && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '14px', padding: '16px 24px', marginBottom: '28px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(22,163,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
                <Lock size={15} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>Les statistiques sont réservées au plan Pro</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>Aperçu en dessous — passe au Pro pour déverrouiller</p>
              </div>
            </div>
            <Link href="/dashboard/settings" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '10px', background: '#16a34a', color: 'white', fontWeight: 700, fontSize: '13px', textDecoration: 'none', flexShrink: 0 }}>
              <Zap size={13} /> Upgrader
            </Link>
          </div>
        )}

        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Statistiques</h1>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Analytics de ton media kit · 30 derniers jours</p>
          </div>
          {pro ? (
            <button
              onClick={exportPDF}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: '#0f172a', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white' }}
            >
              <Download size={15} /> Exporter PDF
            </button>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1px dashed #e2e8f0', background: '#f8fafc', color: '#94a3b8', fontSize: '13px', fontWeight: 500, cursor: 'default' }}>
              <Lock size={13} /> Export PDF · Pro
            </div>
          )}
        </div>

        <div id="stats-printable">
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px', filter: pro ? 'none' : 'blur(3px)', pointerEvents: pro ? 'auto' : 'none', userSelect: pro ? 'auto' : 'none' }}>
          <StatCard label="Vues du media kit" value="348" sub="↑ +23% vs mois dernier" positive />
          <StatCard label="Clics « Me contacter »" value="24" sub="6,9% des visiteurs ont cliqué" positive />
          <StatCard label="Messages reçus" value="8" sub="↑ +3 ce mois" positive />
          <StatCard label="Temps moyen" value="2m34s" sub="↑ +18s vs mois dernier" positive />
        </div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start', filter: pro ? 'none' : 'blur(3px)', pointerEvents: pro ? 'auto' : 'none', userSelect: pro ? 'auto' : 'none' }}>

          <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Vues du media kit</p>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>14 derniers jours</p>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '9999px', padding: '4px 12px' }}>
                348 total
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px', marginBottom: '10px' }}>
              {dailyViews.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <div
                    title={`${v} vues`}
                    style={{
                      width: '100%',
                      height: `${(v / maxViews) * 100}%`,
                      background: v === maxViews ? '#16a34a' : 'rgba(22,163,74,0.25)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'background 150ms ease',
                      cursor: 'default',
                      minHeight: '4px',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#16a34a' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = v === maxViews ? '#16a34a' : 'rgba(22,163,74,0.25)' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {days.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: '#cbd5e1', fontWeight: 500 }}>
                  {i % 2 === 0 ? d : ''}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: '24px' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Pic de vues</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>42 vues · 13 mai</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Moyenne / jour</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>24,9 vues</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Tendance</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>↑ En hausse</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '18px' }}>Top pays</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topCountries.map(c => (
                  <div key={c.name}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Flag code={c.flag} size={20} />
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{c.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{c.views} vues</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', width: '34px', textAlign: 'right' }}>{c.pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.pct}%`, background: 'linear-gradient(90deg, #4ade80, #16a34a)', borderRadius: '9999px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '18px' }}>Appareil</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { label: 'Mobile', pct: 61, icon: '📱' },
                  { label: 'Desktop', pct: 33, icon: '🖥️' },
                  { label: 'Tablette', pct: 6, icon: '📋' },
                ].map(d => (
                  <div key={d.label} style={{ flex: 1, textAlign: 'center', padding: '14px 8px', background: '#f8fafc', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{d.icon}</div>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{d.pct}%</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{d.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', position: 'relative', filter: pro ? 'none' : 'blur(3px)', pointerEvents: pro ? 'auto' : 'none', userSelect: pro ? 'auto' : 'none' }}>
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Parcours des marques sur ta page</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>De la première vue jusqu'au message reçu</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            {[
              { label: 'Ont vu ta page', value: 348, color: '#16a34a', pct: 100 },
              { label: 'Ont bien lu', value: 201, color: '#4ade80', pct: 58 },
              { label: 'Ont cliqué contact', value: 24, color: '#86efac', pct: 6.9 },
              { label: 'T\'ont écrit', value: 8, color: '#bbf7d0', pct: 2.3 },
            ].map((step, i, arr) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ height: '48px', background: step.color, borderRadius: i === 0 ? '10px 0 0 10px' : i === arr.length - 1 ? '0 10px 10px 0' : '0', display: 'flex', alignItems: 'center', paddingLeft: '16px', gap: '10px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: i < 2 ? 'white' : '#15803d' }}>{step.value}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: i < 2 ? 'rgba(255,255,255,0.8)' : '#15803d' }}>{step.label}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', paddingLeft: '4px' }}>{step.pct}%</p>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: '0', height: '0', borderTop: '24px solid transparent', borderBottom: '24px solid transparent', borderLeft: `12px solid ${step.color}`, flexShrink: 0, marginBottom: '18px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
        </div>

        </div>{/* end stats-printable */}

        {!pro && (
          <div style={{ position: 'relative', marginTop: '-320px' }}>
            <ProGate />
          </div>
        )}

      </main>
    </div>
  )
}
