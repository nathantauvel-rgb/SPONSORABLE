'use client'

import { ChevronDown, ChevronUp, Lock, Plus, RefreshCw, Trash2, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/button'
import { exampleCreators } from '@/data/mockData'
import { computeReadinessScore, computeEditorialScore } from '@/lib/profileInference'
import { generatePositioningPhrase, generateSponsorSummary } from '@/lib/profileCopyGenerator'
import { BG, SURFACE, CARD, ACCENT, TEXT, MUTED, BORDER, SYNE, DISPLAY } from '@/lib/ds'

type Partnership = { name: string; category: string; result: string; date: string }

const load = <T,>(key: string, fallback: T): T => {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback } catch { return fallback }
}

const EMPTY_PARTNERSHIP: Partnership = { name: '', category: '', result: '', date: '' }

const LANGUAGES_OPTIONS = ['Français', 'Anglais', 'Espagnol', 'Portugais', 'Allemand', 'Italien', 'Arabe']
const CONTENT_STYLE_OPTIONS = ['Humoristique', 'Informatif', 'Hardcore gamer', 'Variety', 'Lifestyle', 'Éducatif', 'Compétitif']

/* ── Banner uploader ───────────────────────────────────────── */
function BannerUploader({ onUrl }: { onUrl: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    setError(''); setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('type', 'banner')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Erreur lors de l'upload"); return }
      onUrl(data.url)
    } catch { setError('Erreur réseau, réessaie') } finally { setUploading(false) }
  }

  return (
    <div>
      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '100px', border: '2px dashed #333', borderRadius: '10px', cursor: uploading ? 'wait' : 'pointer', background: CARD, transition: 'all 150ms', opacity: uploading ? 0.7 : 1 }}>
        {uploading ? (
          <><span style={{ width: '24px', height: '24px', border: `3px solid rgba(29,170,80,0.3)`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /><span style={{ fontSize: '13px', color: MUTED, fontWeight: 500, fontFamily: SYNE }}>Upload en cours…</span></>
        ) : (
          <><span style={{ fontSize: '24px' }}>🖼️</span><span style={{ fontSize: '13px', color: MUTED, fontWeight: 500, fontFamily: SYNE }}>Clique pour uploader une image</span><span style={{ fontSize: '11px', color: MUTED, fontFamily: SYNE }}>JPG, PNG, WebP · Max 5 Mo</span></>
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </label>
      {error && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{error}</p>}
    </div>
  )
}

/* ── Readiness widget ─────────────────────────────────────── */
function ReadinessWidget({ score }: { score: ReturnType<typeof computeReadinessScore> }) {
  const [open, setOpen] = useState(false)
  const todo = score.items.filter(i => !i.done)
  const color = score.pct >= 80 ? ACCENT : score.pct >= 50 ? '#f59e0b' : MUTED

  return (
    <div style={{ background: SURFACE, border: `1.5px solid ${BORDER}`, borderRadius: '14px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        {/* Progress ring */}
        <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
          <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="22" cy="22" r="18" fill="none" stroke={BORDER} strokeWidth="4" />
            <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - score.pct / 100)}`}
              style={{ transition: 'stroke-dashoffset 400ms ease' }}
            />
          </svg>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color, fontFamily: SYNE }}>{score.pct}%</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: TEXT, marginBottom: '2px', fontFamily: SYNE }}>
            Complétude du media kit — {score.score}/{score.total}
          </p>
          <p style={{ fontSize: '12px', color: MUTED, fontFamily: SYNE }}>
            {score.pct >= 80 ? 'Profil bien renseigné ✓' : `${todo.length} point${todo.length > 1 ? 's' : ''} à compléter pour un meilleur positionnement`}
          </p>
        </div>
        {open ? <ChevronUp size={16} color={MUTED} /> : <ChevronDown size={16} color={MUTED} />}
      </button>

      {open && (
        <div style={{ padding: '0 20px 16px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '14px' }}>
            {score.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: item.done ? `rgba(29,170,80,0.08)` : CARD }}>
                <span style={{ flexShrink: 0, width: '18px', height: '18px', borderRadius: '50%', background: item.done ? ACCENT : BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: item.done ? BG : MUTED, fontWeight: 700, marginTop: '1px' }}>
                  {item.done ? '✓' : ''}
                </span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: item.done ? ACCENT : MUTED, fontFamily: SYNE }}>{item.label}</p>
                  {!item.done && <p style={{ fontSize: '11px', color: MUTED, marginTop: '1px', fontFamily: SYNE }}>{item.tip}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MediaKitEditorPage() {
  const [pro, setPro] = useState<boolean | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(() => {
    try { return localStorage.getItem('sponsorable_template') || null } catch { return null }
  })

  const [profile, setProfile] = useState(() => {
    try {
      const s = localStorage.getItem('sponsorable_profile')
      return s ? JSON.parse(s) : { pseudo: '', niche: '', bio: '', country: '', email: '', contentStyle: '', targetBrands: '', positioningPhrase: '', sponsorSummary: '' }
    } catch {
      return { pseudo: '', niche: '', bio: '', country: '', email: '', contentStyle: '', targetBrands: '', positioningPhrase: '', sponsorSummary: '' }
    }
  })
  const [formats, setFormats] = useState<string[]>(() => load('sponsorable_formats', []))
  const [languages, setLanguages] = useState<string[]>(() => load('sponsorable_languages', []))
  const [availableForCollabs, setAvailableForCollabs] = useState<boolean>(() => load('sponsorable_available', true))
  const [showPartnerships, setShowPartnerships] = useState<boolean>(() => load('sponsorable_show_partnerships', true))
  const [partnerships, setPartnerships] = useState<Partnership[]>(() => load('sponsorable_partnerships', []))
  const [addingPartnership, setAddingPartnership] = useState(false)
  const [draft, setDraft] = useState<Partnership>(EMPTY_PARTNERSHIP)
  const [saved, setSaved] = useState(false)
  const [profileFlash, setProfileFlash] = useState(false)
  const profileCardRef = useRef<HTMLDivElement>(null)
  const [bannerUrl, setBannerUrl] = useState<string>(() => load('sponsorable_banner', ''))
  const [calendlyUrl, setCalendlyUrl] = useState<string>(() => load('sponsorable_calendly', ''))
  const [twitterHandle, setTwitterHandle] = useState<string>(() => load('sponsorable_twitter', ''))
  const [instagramHandle, setInstagramHandle] = useState<string>(() => load('sponsorable_instagram', ''))
  const [tiktokHandle, setTiktokHandle] = useState<string>(() => load('sponsorable_tiktok', ''))

  // Stats depuis les plateformes (pour inférence et readiness)
  const [platformsData, setPlatformsData] = useState<{ platformConnected: boolean; hasRecentContent: boolean }>({ platformConnected: false, hasRecentContent: false })

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => { if (d) setPro(!!d.isPro) }).catch(() => {})

    fetch('/api/profile').then(r => r.ok ? r.json() : null).then(data => {
      if (!data?.profile) return
      const p = data.profile

      if (p.theme) { setSelectedTemplateId(p.theme); localStorage.setItem('sponsorable_template', p.theme) }
      if (p.twitterHandle != null) { setTwitterHandle(p.twitterHandle); localStorage.setItem('sponsorable_twitter', JSON.stringify(p.twitterHandle)) }
      if (p.instagramHandle != null) { setInstagramHandle(p.instagramHandle); localStorage.setItem('sponsorable_instagram', JSON.stringify(p.instagramHandle)) }
      if (p.tiktokHandle != null) { setTiktokHandle(p.tiktokHandle); localStorage.setItem('sponsorable_tiktok', JSON.stringify(p.tiktokHandle)) }
      if (p.bannerUrl) { setBannerUrl(p.bannerUrl); localStorage.setItem('sponsorable_banner', JSON.stringify(p.bannerUrl)) }
      if (p.calendlyUrl != null) { setCalendlyUrl(p.calendlyUrl); localStorage.setItem('sponsorable_calendly', JSON.stringify(p.calendlyUrl)) }
      if (Array.isArray(p.formats)) { setFormats(p.formats); localStorage.setItem('sponsorable_formats', JSON.stringify(p.formats)) }
      if (Array.isArray(p.partnerships)) { setPartnerships(p.partnerships); localStorage.setItem('sponsorable_partnerships', JSON.stringify(p.partnerships)) }
      if (typeof p.showPartnerships === 'boolean') { setShowPartnerships(p.showPartnerships); localStorage.setItem('sponsorable_show_partnerships', String(p.showPartnerships)) }
      if (Array.isArray(p.languages)) { setLanguages(p.languages); localStorage.setItem('sponsorable_languages', JSON.stringify(p.languages)) }
      if (typeof p.availableForCollabs === 'boolean') { setAvailableForCollabs(p.availableForCollabs); localStorage.setItem('sponsorable_available', JSON.stringify(p.availableForCollabs)) }

      setProfile({
        pseudo: p.displayName ?? '',
        bio: p.bio ?? '',
        niche: p.niche ?? '',
        country: p.country ?? '',
        email: '',
        contentStyle: p.contentStyle ?? '',
        targetBrands: p.targetBrands ?? '',
        positioningPhrase: p.positioningPhrase ?? '',
        sponsorSummary: p.sponsorSummary ?? '',
      })
    }).catch(() => {})

    // Charger les stats plateformes pour le readiness score
    fetch('/api/platforms/youtube').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.stats) {
        const hasContent = (d.stats?.recentVideos?.length ?? 0) > 0
        setPlatformsData(prev => ({ platformConnected: true, hasRecentContent: prev.hasRecentContent || hasContent }))
      }
    }).catch(() => {})
    fetch('/api/platforms/twitch').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.stats) {
        const hasContent = (d.stats?.topClips?.length ?? 0) > 0 || (d.stats?.recentStreams?.length ?? 0) > 0
        setPlatformsData(prev => ({ platformConnected: true, hasRecentContent: prev.hasRecentContent || hasContent }))
      }
    }).catch(() => {})
  }, [])

  const removeFormat = (f: string) => setFormats(formats.filter(x => x !== f))
  const addPartnership = () => {
    if (!draft.name.trim()) return
    setPartnerships([...partnerships, draft]); setDraft(EMPTY_PARTNERSHIP); setAddingPartnership(false)
  }
  const removePartnership = (i: number) => setPartnerships(partnerships.filter((_, idx) => idx !== i))

  // Génération auto de la phrase de positionnement et du résumé
  const handleGeneratePositioning = () => {
    const inferred = { dominantPlatform: null as 'youtube' | 'twitch' | null, dominantFormat: null as 'video' | 'live' | null, mainGameFromTwitch: null }
    const phrase = generatePositioningPhrase({ displayName: profile.pseudo, bio: profile.bio, niche: profile.niche, formats, country: profile.country, languages, contentStyle: profile.contentStyle, availableForCollabs }, inferred)
    setProfile((p: typeof profile) => ({ ...p, positioningPhrase: phrase }))
  }

  const handleGenerateSummary = () => {
    const inferred = { dominantPlatform: null as 'youtube' | 'twitch' | null, dominantFormat: null as 'video' | 'live' | null, mainGameFromTwitch: null }
    const summary = generateSponsorSummary({ displayName: profile.pseudo, bio: profile.bio, niche: profile.niche, formats, country: profile.country, languages, contentStyle: profile.contentStyle, availableForCollabs }, inferred)
    setProfile((p: typeof profile) => ({ ...p, sponsorSummary: summary }))
  }

  const handleSave = async () => {
    localStorage.setItem('sponsorable_profile', JSON.stringify(profile))
    localStorage.setItem('sponsorable_formats', JSON.stringify(formats))
    localStorage.setItem('sponsorable_languages', JSON.stringify(languages))
    localStorage.setItem('sponsorable_available', JSON.stringify(availableForCollabs))
    localStorage.setItem('sponsorable_show_partnerships', String(showPartnerships))
    localStorage.setItem('sponsorable_partnerships', JSON.stringify(partnerships))
    localStorage.setItem('sponsorable_banner', JSON.stringify(bannerUrl))
    localStorage.setItem('sponsorable_calendly', JSON.stringify(calendlyUrl))
    localStorage.setItem('sponsorable_twitter', JSON.stringify(twitterHandle))
    localStorage.setItem('sponsorable_instagram', JSON.stringify(instagramHandle))
    localStorage.setItem('sponsorable_tiktok', JSON.stringify(tiktokHandle))
    try {
      const slug = (profile.pseudo ?? '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'me'
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          displayName: profile.pseudo,
          bio: profile.bio,
          niche: profile.niche,
          country: profile.country || null,
          languages: languages.length > 0 ? languages : undefined,
          contentStyle: profile.contentStyle || null,
          targetBrands: profile.targetBrands || null,
          availableForCollabs,
          positioningPhrase: profile.positioningPhrase || null,
          sponsorSummary: profile.sponsorSummary || null,
          theme: selectedTemplateId || undefined,
          formats,
          showPartnerships,
          partnerships,
          bannerUrl: bannerUrl || undefined,
          calendlyUrl: calendlyUrl || undefined,
          twitterHandle: twitterHandle || null,
          instagramHandle: instagramHandle || null,
          tiktokHandle: tiktokHandle || null,
        }),
      })
    } catch { /* localStorage already saved */ }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // Score de complétude (dashboard uniquement, jamais sur page publique)
  const editorialScore = computeEditorialScore({ bio: profile.bio, niche: profile.niche, formats, country: profile.country, languages })
  const readiness = computeReadinessScore(
    { bio: profile.bio, niche: profile.niche, formats, country: profile.country, languages, positioningPhrase: profile.positioningPhrase, availableForCollabs },
    platformsData
  )

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes profileFlash { 0% { box-shadow: 0 0 0 0 rgba(29,170,80,0); } 30% { box-shadow: 0 0 0 6px rgba(29,170,80,0.25); } 100% { box-shadow: 0 0 0 0 rgba(29,170,80,0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <Sidebar />

      {/* Barre de navigation fixe */}
      <div className="mediakit-topbar" style={{ position: 'fixed', top: 0, left: '240px', right: 0, zIndex: 40, backdropFilter: 'blur(12px)', background: 'var(--ds-topbar)', borderBottom: `1px solid ${BORDER}`, padding: '12px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, fontFamily: SYNE }}>Mon media kit</p>
          <p style={{ fontSize: '12px', color: MUTED, fontFamily: SYNE }}>Personnalise ce que voient les sponsors.</p>
        </div>
        <Button variant="primary" onClick={handleSave}>Sauvegarder</Button>
      </div>

      <main className="dash-main-mediakit" style={{ marginLeft: '240px', padding: '80px 48px 40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: TEXT, marginBottom: '6px', letterSpacing: '-0.02em', fontFamily: DISPLAY }}>Mon media kit</h1>
          <p style={{ fontSize: '14px', color: MUTED, fontFamily: SYNE }}>Personnalise ce que voient les sponsors.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>

          {/* Score de complétude */}
          <ReadinessWidget score={readiness} />

          {/* Templates */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 28px' }}>
            <button
              onClick={() => pro === true ? setShowTemplates(v => !v) : undefined}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: pro === true ? 'pointer' : 'default', padding: 0 }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: TEXT, textAlign: 'left', fontFamily: SYNE }}>Partir d&apos;un exemple</p>
                  {pro === false && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: ACCENT, background: `rgba(29,170,80,0.12)`, border: `1px solid rgba(29,170,80,0.25)`, borderRadius: '9999px', padding: '2px 8px', fontFamily: SYNE }}><Lock size={9} /> PRO</span>}
                </div>
                <p style={{ fontSize: '13px', color: MUTED, textAlign: 'left', marginTop: '2px', fontFamily: SYNE }}>Pré-remplis ton media kit à partir d&apos;un profil type.</p>
              </div>
              {pro === true ? (showTemplates ? <ChevronUp size={18} color={MUTED} /> : <ChevronDown size={18} color={MUTED} />) : pro === false ? <Lock size={16} color={BORDER} /> : null}
            </button>

            {pro === false && (
              <div style={{ marginTop: '14px', padding: '14px 16px', background: CARD, border: `1px dashed ${BORDER}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '13px', color: MUTED, fontFamily: SYNE }}>Les templates de design sont réservés au plan Pro</p>
                <Link href="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: ACCENT, textDecoration: 'none', background: `rgba(29,170,80,0.08)`, padding: '6px 12px', borderRadius: '8px', fontFamily: SYNE }}><Zap size={11} /> Upgrader</Link>
              </div>
            )}

            {showTemplates && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {exampleCreators.map(tmpl => {
                    const isSelected = selectedTemplateId === tmpl.id
                    const isDark = tmpl.theme.bg !== '#ffffff' && tmpl.theme.bg !== '#eae5d8'
                    const isForest = tmpl.theme.bg === '#eae5d8'
                    const selectionColor = tmpl.theme.accent === '#ffffff' ? tmpl.theme.bg : tmpl.theme.accent
                    return (
                      <div key={tmpl.id}
                        onClick={() => { setFormats(tmpl.formats); setSelectedTemplateId(tmpl.id); localStorage.setItem('sponsorable_formats', JSON.stringify(tmpl.formats)); localStorage.setItem('sponsorable_template', tmpl.id); setTimeout(() => { setProfileFlash(true); setTimeout(() => setProfileFlash(false), 1200) }, 150) }}
                        style={{ borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', position: 'relative', border: isSelected ? `3px solid ${tmpl.theme.accent === '#ffffff' ? '#ffffff' : selectionColor}` : '3px solid transparent', outline: isSelected && tmpl.theme.accent === '#ffffff' ? '3px solid #111111' : 'none', outlineOffset: '0px', boxShadow: isSelected ? (tmpl.theme.accent === '#ffffff' ? '0 6px 32px rgba(0,0,0,0.35)' : `0 6px 28px ${selectionColor}50`) : '0 2px 12px rgba(0,0,0,0.10)', transition: 'all 180ms ease', transform: isSelected ? 'translateY(-2px)' : 'none' }}
                        onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.16)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
                        onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'none' } }}
                      >
                        {/* Prévisualisation avec les thèmes d'origine des exemples créateurs */}
                        <div style={{ background: tmpl.theme.bg, padding: '20px 18px 18px', position: 'relative', minHeight: '160px', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '70%', height: '80%', borderRadius: '60% 40% 60% 40%', background: `radial-gradient(ellipse, ${tmpl.theme.accent}${isDark ? '50' : isForest ? '30' : '25'} 0%, transparent 70%)`, filter: 'blur(28px)' }} />
                            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60%', height: '70%', borderRadius: '40% 60% 40% 60%', background: `radial-gradient(ellipse, ${tmpl.theme.accent}${isDark ? '35' : isForest ? '20' : '18'} 0%, transparent 70%)`, filter: 'blur(32px)' }} />
                          </div>
                          {isSelected && <div style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', borderRadius: '50%', background: selectionColor, color: isDark ? (selectionColor === tmpl.theme.bg ? '#ffffff' : tmpl.theme.bg) : 'white', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: `0 2px 8px ${selectionColor}60` }}>✓</div>}
                          <div style={{ position: 'relative', zIndex: 1 }}>
                            {tmpl.theme.styleLabel && <div style={{ marginBottom: '12px' }}><span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: tmpl.theme.accent, background: `${tmpl.theme.accent}18`, border: `1px solid ${tmpl.theme.accent}35`, borderRadius: '6px', padding: '3px 8px' }}>{tmpl.theme.styleLabel}</span></div>}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                              <div style={{ width: isForest ? '36px' : '38px', height: isForest ? '44px' : '38px', borderRadius: isForest ? '6px' : isDark && tmpl.id === 'mono' ? '4px' : '50%', background: isDark ? `linear-gradient(145deg, ${tmpl.theme.accent}40, ${tmpl.theme.accent}15)` : tmpl.avatarColor, border: isDark ? `1px solid ${tmpl.theme.accent}40` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? tmpl.theme.accent : 'white', fontSize: '13px', fontWeight: 800, flexShrink: 0, boxShadow: isDark ? `0 4px 12px ${tmpl.theme.accent}30` : 'none' }}>{tmpl.initials}</div>
                              <div>
                                <p style={{ fontSize: '14px', fontWeight: 800, color: tmpl.theme.text, letterSpacing: isDark && tmpl.id === 'mono' ? '0.04em' : '-0.01em', lineHeight: 1.1, marginBottom: '3px' }}>{tmpl.pseudo}</p>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{tmpl.niches.slice(0, 2).map(n => <span key={n} style={{ fontSize: '9px', fontWeight: 600, color: tmpl.theme.accent, background: `${tmpl.theme.accent}15`, borderRadius: '4px', padding: '2px 6px' }}>{n}</span>)}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div><p style={{ fontSize: '18px', fontWeight: 900, color: tmpl.theme.accent, letterSpacing: '-0.03em', lineHeight: 1 }}>{tmpl.mainStat.value}</p><p style={{ fontSize: '10px', color: tmpl.theme.subtext, marginTop: '2px' }}>{tmpl.mainStat.label}</p></div>
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '28px' }}>{[40, 65, 45, 80, 55, 90, 70].map((h, i) => <div key={i} style={{ width: '5px', height: `${h * 0.28}px`, borderRadius: '2px 2px 0 0', background: i === 5 ? tmpl.theme.accent : `${tmpl.theme.accent}35` }} />)}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ background: isSelected ? selectionColor : CARD, padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 180ms' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? BG : TEXT, fontFamily: SYNE }}>{tmpl.id === 'youtuber' ? 'Classique' : tmpl.id === 'esport' ? 'Esport' : tmpl.id === 'mono' ? 'Minimaliste' : 'Nature'}</span>
                          <span style={{ fontSize: '11px', color: isSelected ? `rgba(13,13,15,0.75)` : MUTED, fontFamily: SYNE }}>{isSelected ? '✓ Sélectionné' : 'Choisir →'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {selectedTemplateId && (
                  <div style={{ marginTop: '14px', padding: '12px 16px', background: `rgba(29,170,80,0.08)`, border: `1px solid rgba(29,170,80,0.25)`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: ACCENT, fontWeight: 500, fontFamily: SYNE }}>✓ Template appliqué</span>
                    <button onClick={() => setShowTemplates(false)} style={{ fontSize: '13px', fontWeight: 600, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontFamily: SYNE }}>Fermer ×</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profil public */}
          <div ref={profileCardRef} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '28px', animation: profileFlash ? 'profileFlash 1.2s ease forwards' : 'none' }}>
            <h3 style={sectionTitle}>Profil public</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Pseudo</label>
                <input value={profile.pseudo} onChange={e => setProfile({ ...profile, pseudo: e.target.value })} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={labelStyle}>Niche</label>
                <input value={profile.niche} onChange={e => setProfile({ ...profile, niche: e.target.value })} placeholder="FPS · Battle Royale" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Bio</label>
                <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3} placeholder="Décris ton contenu, ta communauté, ton style…" style={{ ...inputStyle, resize: 'vertical', fontFamily: SYNE, lineHeight: 1.6 }} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
          </div>

          {/* Tags contenu */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h3 style={sectionTitle}>Formats de collaboration</h3>
              <span style={{ fontSize: '12px', fontWeight: 600, color: formats.length >= 3 ? ACCENT : MUTED, fontFamily: SYNE }}>{formats.length}/3</span>
            </div>
            <p style={subText}>Choisis 3 formats que tu proposes aux marques.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', marginBottom: '20px' }}>
              {['FPS', 'Minecraft', 'Esport', 'Battle Royale', 'RPG', 'Variety Gaming', 'Just Chatting', 'IRL / Vlog', 'Humour', 'Débats', 'Tech & Setup', 'Tutoriels', 'Musique', 'Fitness', 'Lifestyle', 'Voyage', 'Beauté', 'Finance'].map(tag => {
                const isSelected = formats.includes(tag)
                const isDisabled = !isSelected && formats.length >= 3
                return (
                  <button key={tag} disabled={isDisabled} onClick={() => isSelected ? removeFormat(tag) : (formats.length < 3 && setFormats([...formats, tag]))}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, cursor: isDisabled ? 'not-allowed' : 'pointer', border: isSelected ? `1.5px solid rgba(29,170,80,0.25)` : `1.5px solid ${BORDER}`, background: isSelected ? `rgba(29,170,80,0.10)` : CARD, color: isSelected ? ACCENT : isDisabled ? BORDER : MUTED, opacity: isDisabled ? 0.45 : 1, transition: 'all 120ms ease', fontFamily: SYNE }}>
                    {isSelected && <span style={{ fontSize: '10px' }}>✓</span>}
                    {tag}
                  </button>
                )
              })}
            </div>
            {formats.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: formats.length >= 3 ? `rgba(29,170,80,0.06)` : CARD, borderRadius: '10px', border: `1px solid ${formats.length >= 3 ? 'rgba(29,170,80,0.25)' : BORDER}` }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                  {formats.map(f => (
                    <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: `rgba(29,170,80,0.10)`, color: ACCENT, border: `1px solid rgba(29,170,80,0.25)`, borderRadius: '9999px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, fontFamily: SYNE }}>
                      {f}
                      <button onClick={() => removeFormat(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: ACCENT, opacity: 0.6 }} onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '1')} onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '0.6')}><X size={11} /></button>
                    </span>
                  ))}
                </div>
                {formats.length >= 3 && <span style={{ fontSize: '11px', color: ACCENT, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: SYNE }}>Limite atteinte</span>}
              </div>
            )}
          </div>

          {/* Section Pour les marques */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 style={{ ...sectionTitle, marginBottom: 0 }}>Pour les marques</h3>
              <span style={{ fontSize: '10px', fontWeight: 700, color: ACCENT, background: `rgba(29,170,80,0.12)`, border: `1px solid rgba(29,170,80,0.25)`, borderRadius: '9999px', padding: '2px 8px', fontFamily: SYNE }}>Nouveau</span>
            </div>
            <p style={{ ...subText, marginBottom: '24px' }}>Ces infos aident les marques à te qualifier. Plus tu renseignes, meilleur est ton positionnement.</p>

            {/* Pays + Langue + Style */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Pays / Marché principal</label>
                <input value={profile.country} onChange={e => setProfile({ ...profile, country: e.target.value })} placeholder="France" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={labelStyle}>Style de contenu</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {CONTENT_STYLE_OPTIONS.map(s => (
                    <button key={s} onClick={() => setProfile((p: typeof profile) => ({ ...p, contentStyle: p.contentStyle === s ? '' : s }))}
                      style={{ padding: '5px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: profile.contentStyle === s ? `1.5px solid rgba(29,170,80,0.25)` : `1.5px solid ${BORDER}`, background: profile.contentStyle === s ? `rgba(29,170,80,0.10)` : CARD, color: profile.contentStyle === s ? ACCENT : MUTED, transition: 'all 100ms', fontFamily: SYNE }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Langues */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Langue(s) de contenu</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {LANGUAGES_OPTIONS.map(l => {
                  const isSelected = languages.includes(l)
                  return (
                    <button key={l} onClick={() => setLanguages(isSelected ? languages.filter(x => x !== l) : [...languages, l])}
                      style={{ padding: '5px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: isSelected ? `1.5px solid rgba(29,170,80,0.25)` : `1.5px solid ${BORDER}`, background: isSelected ? `rgba(29,170,80,0.10)` : CARD, color: isSelected ? ACCENT : MUTED, transition: 'all 100ms', fontFamily: SYNE }}>
                      {isSelected && <span style={{ marginRight: '4px', fontSize: '10px' }}>✓</span>}{l}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Types de marques ciblées */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Marques / catégories visées <span style={{ color: BORDER, fontWeight: 400 }}>optionnel</span></label>
              <input value={profile.targetBrands} onChange={e => setProfile({ ...profile, targetBrands: e.target.value })} placeholder="gaming, tech, énergie, lifestyle, SaaS…" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Disponibilité */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: CARD, borderRadius: '10px', border: `1px solid ${BORDER}`, marginBottom: '24px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: TEXT, fontFamily: SYNE }}>Disponible pour des collaborations</p>
                <p style={{ fontSize: '12px', color: MUTED, marginTop: '2px', fontFamily: SYNE }}>Affiché comme signal positif sur ta page publique</p>
              </div>
              <button
                onClick={() => setAvailableForCollabs(v => !v)}
                style={{ width: '44px', height: '24px', borderRadius: '9999px', border: 'none', cursor: 'pointer', background: availableForCollabs ? ACCENT : BORDER, transition: 'background 200ms', position: 'relative', flexShrink: 0 }}
              >
                <span style={{ position: 'absolute', top: '3px', left: availableForCollabs ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: availableForCollabs ? BG : MUTED, transition: 'left 200ms', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
              </button>
            </div>

            {/* Phrase de positionnement */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Phrase de positionnement</label>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: ACCENT, background: `rgba(29,170,80,0.12)`, borderRadius: '6px', padding: '1px 6px', fontFamily: SYNE }}>✦ Suggéré</span>
                </div>
                <button onClick={handleGeneratePositioning} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: ACCENT, background: `rgba(29,170,80,0.08)`, border: `1px solid rgba(29,170,80,0.2)`, borderRadius: '7px', padding: '4px 10px', cursor: 'pointer', fontFamily: SYNE }}>
                  <RefreshCw size={11} /> Générer
                </button>
              </div>
              <input
                value={profile.positioningPhrase}
                onChange={e => setProfile({ ...profile, positioningPhrase: e.target.value })}
                placeholder="Ex : Créateur FPS français sur Twitch, marché France"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
              <p style={{ fontSize: '11px', color: MUTED, marginTop: '5px', fontFamily: SYNE }}>1 phrase courte affichée en accroche sur ta page publique.</p>
            </div>

            {/* Résumé sponsor */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Résumé sponsor</label>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: ACCENT, background: `rgba(29,170,80,0.12)`, borderRadius: '6px', padding: '1px 6px', fontFamily: SYNE }}>✦ Suggéré</span>
                </div>
                <button onClick={handleGenerateSummary} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: ACCENT, background: `rgba(29,170,80,0.08)`, border: `1px solid rgba(29,170,80,0.2)`, borderRadius: '7px', padding: '4px 10px', cursor: 'pointer', fontFamily: SYNE }}>
                  <RefreshCw size={11} /> Générer
                </button>
              </div>
              <textarea
                value={profile.sponsorSummary}
                onChange={e => setProfile({ ...profile, sponsorSummary: e.target.value })}
                rows={3}
                placeholder="2 phrases max. Décris ta valeur pour une marque : ton audience, ta niche, ta disponibilité…"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: SYNE, lineHeight: 1.6 }}
                onFocus={onFocus} onBlur={onBlur}
              />
              <p style={{ fontSize: '11px', color: MUTED, marginTop: '5px', fontFamily: SYNE }}>Affiché dans la section En bref de ta page publique. 2 phrases max.</p>
            </div>
          </div>

          {/* Partenariats précédents */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={sectionTitle}>Partenariats précédents</h3>
                <p style={subText}>{showPartnerships ? 'Visible sur ta page publique.' : 'Masqué sur ta page publique.'}</p>
              </div>
              <button
                onClick={() => { const next = !showPartnerships; setShowPartnerships(next); localStorage.setItem('sponsorable_show_partnerships', String(next)) }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', border: showPartnerships ? `2px solid ${ACCENT}` : `2px solid ${BORDER}`, cursor: 'pointer', transition: 'all 150ms ease', fontWeight: 600, fontSize: '13px', background: showPartnerships ? `rgba(29,170,80,0.08)` : CARD, color: showPartnerships ? ACCENT : MUTED, fontFamily: SYNE }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = showPartnerships ? `rgba(29,170,80,0.14)` : SURFACE }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = showPartnerships ? `rgba(29,170,80,0.08)` : CARD }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: showPartnerships ? ACCENT : BORDER, boxShadow: showPartnerships ? `0 0 0 3px rgba(29,170,80,0.20)` : 'none', transition: 'all 150ms ease' }} />
                {showPartnerships ? 'Visible' : 'Masqué'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: partnerships.length ? '16px' : 0 }}>
              {partnerships.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', background: CARD, borderRadius: '10px', border: `1px solid ${BORDER}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT, fontFamily: SYNE }}>{p.name}</span>
                      <span style={{ fontSize: '12px', color: MUTED }}>·</span>
                      <span style={{ fontSize: '12px', color: MUTED, fontFamily: SYNE }}>{p.category}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: MUTED, fontFamily: SYNE }}>{p.date}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5, fontFamily: SYNE }}>{p.result}</p>
                  </div>
                  <button onClick={() => removePartnership(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: '2px', flexShrink: 0, transition: 'color 150ms ease' }} onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#ef4444')} onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = MUTED)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            {addingPartnership ? (
              <div style={{ padding: '20px', background: `rgba(29,170,80,0.04)`, border: `1.5px solid rgba(29,170,80,0.2)`, borderRadius: '12px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '14px', fontFamily: SYNE }}>Nouveau partenariat</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  {([{ key: 'name', label: 'Marque / Entreprise', placeholder: 'NordVPN' }, { key: 'category', label: 'Catégorie', placeholder: 'Cybersécurité' }, { key: 'date', label: 'Date', placeholder: 'Mars 2025' }] as { key: keyof Partnership; label: string; placeholder: string }[]).map(f => (
                    <div key={f.key}><label style={labelStyle}>{f.label}</label><input value={draft[f.key]} onChange={e => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} style={inputStyle} onFocus={onFocus} onBlur={onBlur} /></div>
                  ))}
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Résultats obtenus</label>
                  <input value={draft.result} onChange={e => setDraft({ ...draft, result: e.target.value })} placeholder="42 000 vues · 3,1% CTR lien description" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={addPartnership} style={{ ...addBtnStyle, background: ACCENT, color: BG, borderColor: ACCENT }}>Ajouter</button>
                  <button onClick={() => { setAddingPartnership(false); setDraft(EMPTY_PARTNERSHIP) }} style={{ ...addBtnStyle }}>Annuler</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingPartnership(true)} style={{ ...addBtnStyle, width: '100%', justifyContent: 'center' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = ACCENT; (e.currentTarget as HTMLElement).style.background = SURFACE }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; (e.currentTarget as HTMLElement).style.background = CARD }}>
                <Plus size={14} /> Ajouter un partenariat
              </button>
            )}
          </div>

          {/* Bannière */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '28px', opacity: pro === false ? 0.7 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={sectionTitle}>Bannière personnalisée</h3>
                  {pro === false && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: ACCENT, background: `rgba(29,170,80,0.12)`, border: `1px solid rgba(29,170,80,0.25)`, borderRadius: '9999px', padding: '2px 8px', fontFamily: SYNE }}><Lock size={9} /> PRO</span>}
                </div>
                <p style={subText}>Image affichée en haut de ta page publique</p>
              </div>
            </div>
            {pro === true ? (
              <div>
                {bannerUrl ? (
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <img src={bannerUrl} alt="Bannière" style={{ width: '100%', aspectRatio: '1546 / 423', objectFit: 'cover', objectPosition: 'center', borderRadius: '10px', border: `1px solid ${BORDER}`, display: 'block' }} />
                    <button onClick={() => setBannerUrl('')} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '6px', color: TEXT, cursor: 'pointer', padding: '4px 8px', fontSize: '12px', fontWeight: 600, fontFamily: SYNE }}>✕ Retirer</button>
                  </div>
                ) : <BannerUploader onUrl={url => setBannerUrl(url)} />}
              </div>
            ) : pro === false ? (
              <div style={{ padding: '14px 16px', background: CARD, border: `1px dashed ${BORDER}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '13px', color: MUTED, fontFamily: SYNE }}>Disponible avec le plan Pro</p>
                <Link href="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: ACCENT, textDecoration: 'none', background: `rgba(29,170,80,0.08)`, padding: '6px 12px', borderRadius: '8px', fontFamily: SYNE }}><Zap size={11} /> Upgrader</Link>
              </div>
            ) : null}
          </div>

          {/* Réseaux sociaux */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '28px' }}>
            <h3 style={sectionTitle}>Réseaux sociaux</h3>
            <p style={{ ...subText, marginBottom: '16px' }}>Tes handles apparaîtront sur ton media kit. YouTube et Twitch sont ajoutés automatiquement si connectés.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[{ label: 'Twitter / X', value: twitterHandle, set: setTwitterHandle }, { label: 'Instagram', value: instagramHandle, set: setInstagramHandle }, { label: 'TikTok', value: tiktokHandle, set: setTiktokHandle }].map(({ label, value, set }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: MUTED, fontWeight: 500, fontFamily: SYNE }}>@</span>
                    <input style={{ ...inputStyle, paddingLeft: '28px' }} value={value} onChange={e => set(e.target.value.replace(/^@/, ''))} onFocus={onFocus} onBlur={onBlur} placeholder="tonpseudo" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lien de réservation */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '28px', opacity: pro === false ? 0.7 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 style={sectionTitle}>Lien de réservation</h3>
              {pro === false && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: ACCENT, background: `rgba(29,170,80,0.12)`, border: `1px solid rgba(29,170,80,0.25)`, borderRadius: '9999px', padding: '2px 8px', fontFamily: SYNE }}><Lock size={9} /> PRO</span>}
            </div>
            <p style={{ ...subText, marginBottom: '16px' }}>Intègre ton lien Calendly pour que les marques bookent un appel directement</p>
            {pro === true ? (
              <div>
                <label style={labelStyle}>Lien Calendly</label>
                <input style={inputStyle} value={calendlyUrl} onChange={e => setCalendlyUrl(e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="https://calendly.com/ton-pseudo" />
                {calendlyUrl && <p style={{ fontSize: '12px', color: ACCENT, marginTop: '8px', fontWeight: 500, fontFamily: SYNE }}>✓ Un bouton &quot;Réserver un appel&quot; apparaîtra sur ta page publique</p>}
              </div>
            ) : pro === false ? (
              <div style={{ padding: '14px 16px', background: CARD, border: `1px dashed ${BORDER}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '13px', color: MUTED, fontFamily: SYNE }}>Disponible avec le plan Pro</p>
                <Link href="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: ACCENT, textDecoration: 'none', background: `rgba(29,170,80,0.08)`, padding: '6px 12px', borderRadius: '8px', fontFamily: SYNE }}><Zap size={11} /> Upgrader</Link>
              </div>
            ) : null}
          </div>

        </div>
      </main>

      {saved && (
        <div style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: SURFACE, color: TEXT, borderRadius: '14px', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: `1px solid ${BORDER}`, animation: 'toastIn 220ms ease forwards', whiteSpace: 'nowrap' }}>
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0, color: BG }}>✓</span>
          <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: SYNE }}>Modifications sauvegardées</span>
        </div>
      )}
    </div>
  )
}

const sectionTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 600, color: TEXT, marginBottom: '4px', fontFamily: SYNE }
const subText: React.CSSProperties = { fontSize: '13px', color: MUTED, marginBottom: '0', fontFamily: SYNE }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: MUTED, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: SYNE }
const inputStyle: React.CSSProperties = { width: '100%', background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: TEXT, outline: 'none', transition: 'all 150ms ease', fontFamily: SYNE }
const addBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: TEXT, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease', fontFamily: SYNE }

const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = ACCENT; e.target.style.background = CARD }
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = BORDER; e.target.style.background = CARD }
