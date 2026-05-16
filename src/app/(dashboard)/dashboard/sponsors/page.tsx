'use client'

import { ExternalLink, Lock, Wifi, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

const ALL_BRANDS = [
  { name: 'GFuel', category: 'Energy drink', minSubs: 1000, url: 'https://gfuel.com', desc: 'Sponsorise massivement les créateurs gaming de toute taille' },
  { name: 'Opera GX', category: 'Navigateur gaming', minSubs: 1000, url: 'https://www.opera.com/gx', desc: 'Programme créateur très actif, idéal pour les petites chaînes' },
  { name: 'Discord', category: 'Communauté', minSubs: 1000, url: 'https://discord.com/partners', desc: 'Programme partenaire ouvert aux créateurs gaming' },
  { name: 'Epidemic Sound', category: 'Musique', minSubs: 1000, url: 'https://www.epidemicsound.com', desc: 'Musique libre de droits, affiliation très accessible' },
  { name: 'Surfshark', category: 'VPN', minSubs: 5000, url: 'https://surfshark.com', desc: 'VPN généreux en commission, populaire sur Twitch' },
  { name: 'SteelSeries', category: 'Périphériques', minSubs: 5000, url: 'https://steelseries.com', desc: 'Équipements pro, programme créateur ouvert' },
  { name: 'HyperX', category: 'Périphériques', minSubs: 5000, url: 'https://www.hyperx.com', desc: 'Casques et périphériques, très présents dans le gaming FR' },
  { name: 'Elgato', category: 'Streaming', minSubs: 5000, url: 'https://www.elgato.com', desc: 'Équipements streaming, programme créateur actif' },
  { name: 'DXRacer', category: 'Chaise gaming', minSubs: 5000, url: 'https://www.dxracer.com', desc: 'Pionnier de la chaise gaming, ouvert aux mid-size creators' },
  { name: 'NordVPN', category: 'VPN', minSubs: 10000, url: 'https://nordvpn.com', desc: 'Un des VPN les plus présents chez les YouTubeurs gaming' },
  { name: 'Razer', category: 'Périphériques', minSubs: 10000, url: 'https://www.razer.com', desc: 'Leader mondial, programme ambassadeur sélectif' },
  { name: 'Astro Gaming', category: 'Audio', minSubs: 10000, url: 'https://www.astrogaming.com', desc: 'Casques gaming haut de gamme pour esportifs' },
  { name: 'Corsair', category: 'Setup', minSubs: 10000, url: 'https://www.corsair.com', desc: 'Composants et périphériques, ambassadeurs très visibles' },
  { name: 'Secretlab', category: 'Chaise gaming', minSubs: 15000, url: 'https://secretlab.co', desc: 'Chaises premium, partenariats esport et créateurs' },
  { name: 'MSI', category: 'Hardware', minSubs: 20000, url: 'https://www.msi.com', desc: 'PC gaming et composants, programme ambassadeur' },
  { name: 'Logitech G', category: 'Périphériques', minSubs: 30000, url: 'https://www.logitechg.com', desc: 'Marque incontournable du gaming compétitif' },
  { name: 'Alienware', category: 'Hardware', minSubs: 30000, url: 'https://www.dell.com/en-us/gaming/alienware', desc: 'PC gaming haut de gamme Dell, ambassadeurs premium' },
  { name: 'ASUS ROG', category: 'Hardware', minSubs: 50000, url: 'https://rog.asus.com', desc: 'Marque gaming premium, partenariats sélectifs' },
]

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'Energy drink':     { bg: '#f0fdf4', text: '#15803d' },
  'Navigateur gaming':{ bg: '#fdf4ff', text: '#7c3aed' },
  'Communauté':       { bg: '#eff6ff', text: '#1d4ed8' },
  'Musique':          { bg: '#fff7ed', text: '#c2410c' },
  'VPN':              { bg: '#f0f9ff', text: '#0369a1' },
  'Périphériques':    { bg: '#fef2f2', text: '#b91c1c' },
  'Streaming':        { bg: '#fdf4ff', text: '#6d28d9' },
  'Chaise gaming':    { bg: '#fefce8', text: '#854d0e' },
  'Setup':            { bg: '#f0fdf4', text: '#166534' },
  'Audio':            { bg: '#f0f9ff', text: '#075985' },
  'Hardware':         { bg: '#fef2f2', text: '#991b1b' },
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Premium', color: '#7c3aed' }
  if (score >= 65) return { label: 'Attractif', color: '#16a34a' }
  if (score >= 45) return { label: 'En développement', color: '#d97706' }
  return { label: 'Débutant', color: '#64748b' }
}

function calcScore(subs: number, connectedCount: number) {
  const engagementScore = Math.min(35, 24 + connectedCount * 2)
  const audienceScore =
    subs >= 100000 ? 20 : subs >= 50000 ? 17 : subs >= 10000 ? 13 : subs >= 5000 ? 9 : subs >= 1000 ? 6 : 3
  const demoScore = 15
  const platformScore = Math.min(10, connectedCount * 3)
  const growthScore = 8
  const total = Math.min(100, engagementScore + audienceScore + demoScore + platformScore + growthScore)
  return {
    total,
    items: [
      { label: "Taux d'engagement", score: engagementScore, max: 35 },
      { label: "Taille de l'audience", score: audienceScore, max: 20 },
      { label: 'Profil démographique', score: demoScore, max: 20 },
      { label: 'Présence multi-plateforme', score: platformScore, max: 10 },
      { label: 'Croissance', score: growthScore, max: 10 },
    ],
  }
}

function getBrandCompatibility(minSubs: number, subs: number): number {
  if (subs < minSubs) return 0
  let score = 60
  if (subs >= minSubs * 5) score += 20
  else if (subs >= minSubs * 2) score += 10
  score += 15
  return Math.min(99, score)
}

const ProGate = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(248,250,252,0.85)', backdropFilter: 'blur(6px)', borderRadius: '16px' }}>
    <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '20px', padding: '40px 48px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.10)', maxWidth: '380px' }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#16a34a' }}>
        <Lock size={22} />
      </div>
      <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Sponsors · Fonctionnalité Pro</p>
      <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
        Accède à ton score de sponsorisabilité et aux recommandations de marques gaming avec le plan Pro.
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

export default function SponsorsPage() {
  const [pro, setPro] = useState(false)
  const [connected, setConnected] = useState<string[]>([])
  const [scoreData, setScoreData] = useState<ReturnType<typeof calcScore> | null>(null)
  const [brands, setBrands] = useState<Array<(typeof ALL_BRANDS)[0] & { compatibility: number }>>([])

  useEffect(() => {
    try {
      setPro(localStorage.getItem('sponsorable_plan') === 'pro')

      const saved = localStorage.getItem('sponsorable_connected_platforms')
      const connectedList: string[] = saved ? JSON.parse(saved) : []
      setConnected(connectedList)

      const ytRaw = localStorage.getItem('sponsorable_yt_data')
      const subs = ytRaw ? parseInt(JSON.parse(ytRaw).subscriberCount || '0') || 10000 : 10000

      setScoreData(calcScore(subs, connectedList.length))

      setBrands(
        ALL_BRANDS.map(b => ({ ...b, compatibility: getBrandCompatibility(b.minSubs, subs) }))
          .filter(b => b.compatibility > 0)
          .sort((a, b) => b.compatibility - a.compatibility)
          .slice(0, 6)
      )
    } catch {}
  }, [])

  const hasConnectedPlatforms = connected.length > 0
  const scoreLabel = scoreData ? getScoreLabel(scoreData.total) : { label: '', color: '#64748b' }
  const circumference = 2 * Math.PI * 58

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
                <p style={{ fontSize: '14px', fontWeight: 600 }}>Les sponsors sont réservés au plan Pro</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>Aperçu en dessous — passe au Pro pour déverrouiller</p>
              </div>
            </div>
            <Link href="/dashboard/settings" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '10px', background: '#16a34a', color: 'white', fontWeight: 700, fontSize: '13px', textDecoration: 'none', flexShrink: 0 }}>
              <Zap size={13} /> Upgrader
            </Link>
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Sponsors</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Ton score de sponsorisabilité et les marques gaming compatibles avec ton profil</p>
        </div>

        {!hasConnectedPlatforms ? (
          <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Wifi size={24} color="#94a3b8" />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Connecte au moins une plateforme</p>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.6 }}>
              Pour calculer ton score et recommander des marques,<br />on a besoin de tes statistiques YouTube ou Twitch.
            </p>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '10px', background: '#0f172a', color: 'white', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
              Connecter mes plateformes
            </Link>
          </div>
        ) : (
          <>
            {/* Score */}
            <div style={{ position: 'relative', marginBottom: '24px', filter: pro ? 'none' : 'blur(3px)', pointerEvents: pro ? 'auto' : 'none', userSelect: pro ? 'auto' : 'none' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems: 'start' }}>

                <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '20px' }}>Score de sponsorisabilité</p>
                  <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 20px' }}>
                    <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="70" cy="70" r="58" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                      <circle
                        cx="70" cy="70" r="58"
                        fill="none"
                        stroke={scoreLabel.color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - (scoreData?.total ?? 0) / 100)}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>{scoreData?.total ?? 0}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>/100</span>
                    </div>
                  </div>
                  <span style={{ display: 'inline-block', padding: '5px 16px', borderRadius: '9999px', fontSize: '13px', fontWeight: 700, color: scoreLabel.color, background: `${scoreLabel.color}18`, border: `1px solid ${scoreLabel.color}30` }}>
                    {scoreLabel.label}
                  </span>
                </div>

                <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Détail du score</p>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>Basé sur tes plateformes connectées</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {scoreData?.items.map(item => (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>{item.label}</span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                            {item.score}<span style={{ fontWeight: 400, color: '#94a3b8' }}>/{item.max}</span>
                          </span>
                        </div>
                        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(item.score / item.max) * 100}%`, background: 'linear-gradient(90deg, #4ade80, #16a34a)', borderRadius: '9999px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Brand recommendations */}
            <div style={{ position: 'relative', filter: pro ? 'none' : 'blur(3px)', pointerEvents: pro ? 'auto' : 'none', userSelect: pro ? 'auto' : 'none' }}>
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '3px' }}>Marques recommandées</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>Sélectionnées selon ton profil gaming et ta taille d&apos;audience</p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '9999px', padding: '4px 12px' }}>
                    {brands.length} marques
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {brands.map(brand => {
                    const cat = CATEGORY_COLORS[brand.category] ?? { bg: '#f8fafc', text: '#475569' }
                    return (
                      <div
                        key={brand.name}
                        style={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '18px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'all 150ms' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(22,163,74,0.25)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.07)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <div>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{brand.name}</p>
                            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, color: cat.text, background: cat.bg }}>
                              {brand.category}
                            </span>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Compatibilité</div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: brand.compatibility >= 80 ? '#16a34a' : '#d97706' }}>
                              {brand.compatibility}%
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{brand.desc}</p>

                        <a
                          href={brand.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
                        >
                          Voir le programme <ExternalLink size={11} />
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {!pro && (
              <div style={{ position: 'relative', marginTop: '-520px' }}>
                <ProGate />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
