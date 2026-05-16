'use client'

import { ChevronDown, ChevronUp, Lock, Plus, Trash2, X, Zap } from 'lucide-react'
import { useRef, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import { creator, exampleCreators, pastPartners } from '@/data/mockData'

type Partnership = {
  name: string
  category: string
  result: string
  date: string
}

const DEFAULT_FORMATS = ['FPS', 'Variety Gaming', 'Esport']

const load = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

const EMPTY_PARTNERSHIP: Partnership = { name: '', category: '', result: '', date: '' }

const isPro = () => { try { return localStorage.getItem('sponsorable_plan') === 'pro' } catch { return false } }

export default function MediaKitEditorPage() {
  const pro = isPro()
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(pro ? (localStorage.getItem('sponsorable_template') || null) : null)
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('sponsorable_profile')
      return saved ? JSON.parse(saved) : {
        pseudo: creator.pseudo, niche: creator.niche, bio: creator.bio,
        country: creator.country, email: creator.email,
      }
    } catch {
      return { pseudo: creator.pseudo, niche: creator.niche, bio: creator.bio,
        country: creator.country, email: creator.email }
    }
  })
  const [formats, setFormats] = useState<string[]>(() => load('sponsorable_formats', DEFAULT_FORMATS))
  const [showPartnerships, setShowPartnerships] = useState<boolean>(() => load('sponsorable_show_partnerships', true))
  const [partnerships, setPartnerships] = useState<Partnership[]>(() => load('sponsorable_partnerships', pastPartners))
  const [addingPartnership, setAddingPartnership] = useState(false)
  const [draft, setDraft] = useState<Partnership>(EMPTY_PARTNERSHIP)
  const [saved, setSaved] = useState(false)
  const [profileFlash, setProfileFlash] = useState(false)
  const profileCardRef = useRef<HTMLDivElement>(null)
  const [bannerUrl, setBannerUrl] = useState<string>(() => load('sponsorable_banner', ''))
  const [calendlyUrl, setCalendlyUrl] = useState<string>(() => load('sponsorable_calendly', ''))

  const removeFormat = (f: string) => setFormats(formats.filter(x => x !== f))

  const addPartnership = () => {
    if (!draft.name.trim()) return
    setPartnerships([...partnerships, draft])
    setDraft(EMPTY_PARTNERSHIP)
    setAddingPartnership(false)
  }

  const removePartnership = (i: number) =>
    setPartnerships(partnerships.filter((_, idx) => idx !== i))

  const handleSave = () => {
    localStorage.setItem('sponsorable_profile', JSON.stringify(profile))
    localStorage.setItem('sponsorable_formats', JSON.stringify(formats))
    localStorage.setItem('sponsorable_show_partnerships', String(showPartnerships))
    localStorage.setItem('sponsorable_partnerships', JSON.stringify(partnerships))
    localStorage.setItem('sponsorable_banner', JSON.stringify(bannerUrl))
    localStorage.setItem('sponsorable_calendly', JSON.stringify(calendlyUrl))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes profileFlash { 0% { box-shadow: 0 0 0 0 rgba(22,163,74,0); } 30% { box-shadow: 0 0 0 6px rgba(22,163,74,0.25); } 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); } }
      `}</style>
      <Sidebar />

      <main style={{ marginLeft: '240px', padding: '40px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Mon media kit</h1>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Personnalise ce que voient les sponsors.</p>
          </div>
          <Button variant="primary" onClick={handleSave}>
            Sauvegarder
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>

          {/* Templates */}
          <div className="card-standard" style={{ padding: '20px 28px' }}>
            <button
              onClick={() => pro ? setShowTemplates(v => !v) : undefined}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: pro ? 'pointer' : 'default', padding: 0 }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Partir d'un exemple</p>
                  {!pro && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '9999px', padding: '2px 8px', letterSpacing: '0.04em' }}>
                      <Lock size={9} /> PRO
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'left', marginTop: '2px' }}>Pré-remplis ton media kit à partir d'un profil type.</p>
              </div>
              {pro
                ? (showTemplates ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />)
                : <Lock size={16} color="#cbd5e1" />
              }
            </button>

            {!pro && (
              <div style={{ marginTop: '14px', padding: '14px 16px', background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Les templates de design sont réservés au plan Pro</p>
                <Link href="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: '#16a34a', textDecoration: 'none', background: 'rgba(22,163,74,0.08)', padding: '6px 12px', borderRadius: '8px' }}>
                  <Zap size={11} /> Upgrader
                </Link>
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
                      <div
                        key={tmpl.id}
                        onClick={() => {
                          const newProfile = { pseudo: tmpl.pseudo, niche: tmpl.niches.join(' · '), bio: tmpl.bio, country: 'France', email: tmpl.email }
                          setProfile(newProfile)
                          setFormats(tmpl.formats)
                          setSelectedTemplateId(tmpl.id)
                          localStorage.setItem('sponsorable_profile', JSON.stringify(newProfile))
                          localStorage.setItem('sponsorable_formats', JSON.stringify(tmpl.formats))
                          localStorage.setItem('sponsorable_template', tmpl.id)
                          setTimeout(() => { setProfileFlash(true); setTimeout(() => setProfileFlash(false), 1200) }, 150)
                        }}
                        style={{
                          borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', position: 'relative',
                          border: isSelected ? `3px solid ${tmpl.theme.accent === '#ffffff' ? '#ffffff' : selectionColor}` : '3px solid transparent',
                          outline: isSelected && tmpl.theme.accent === '#ffffff' ? '3px solid #111111' : 'none',
                          outlineOffset: '0px',
                          boxShadow: isSelected
                            ? tmpl.theme.accent === '#ffffff' ? '0 6px 32px rgba(0,0,0,0.35)' : `0 6px 28px ${selectionColor}50`
                            : '0 2px 12px rgba(0,0,0,0.10)',
                          transition: 'all 180ms ease',
                          transform: isSelected ? 'translateY(-2px)' : 'none',
                        }}
                        onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.16)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
                        onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'none' } }}
                      >
                        <div style={{ background: tmpl.theme.bg, padding: '20px 18px 18px', position: 'relative', minHeight: '160px', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '70%', height: '80%', borderRadius: '60% 40% 60% 40%', background: `radial-gradient(ellipse, ${tmpl.theme.accent}${isDark ? '50' : isForest ? '30' : '25'} 0%, transparent 70%)`, filter: 'blur(28px)' }} />
                            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60%', height: '70%', borderRadius: '40% 60% 40% 60%', background: `radial-gradient(ellipse, ${tmpl.theme.accent}${isDark ? '35' : isForest ? '20' : '18'} 0%, transparent 70%)`, filter: 'blur(32px)' }} />
                          </div>
                          {isSelected && (
                            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', borderRadius: '50%', background: selectionColor, color: isDark ? (selectionColor === tmpl.theme.bg ? '#ffffff' : tmpl.theme.bg) : 'white', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: `0 2px 8px ${selectionColor}60` }}>✓</div>
                          )}
                          <div style={{ position: 'relative', zIndex: 1 }}>
                            {tmpl.theme.styleLabel && (
                              <div style={{ marginBottom: '12px' }}>
                                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: tmpl.theme.accent, background: `${tmpl.theme.accent}18`, border: `1px solid ${tmpl.theme.accent}35`, borderRadius: '6px', padding: '3px 8px' }}>
                                  {tmpl.theme.styleLabel}
                                </span>
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                              <div style={{
                                width: isForest ? '36px' : '38px',
                                height: isForest ? '44px' : '38px',
                                borderRadius: isForest ? '6px' : isDark && tmpl.id === 'mono' ? '4px' : '50%',
                                background: isDark ? `linear-gradient(145deg, ${tmpl.theme.accent}40, ${tmpl.theme.accent}15)` : tmpl.avatarColor,
                                border: isDark ? `1px solid ${tmpl.theme.accent}40` : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isDark ? tmpl.theme.accent : 'white',
                                fontSize: '13px', fontWeight: 800, flexShrink: 0,
                                boxShadow: isDark ? `0 4px 12px ${tmpl.theme.accent}30` : 'none',
                              }}>
                                {tmpl.initials}
                              </div>
                              <div>
                                <p style={{ fontSize: '14px', fontWeight: 800, color: tmpl.theme.text, letterSpacing: isDark && tmpl.id === 'mono' ? '0.04em' : '-0.01em', lineHeight: 1.1, marginBottom: '3px' }}>{tmpl.pseudo}</p>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {tmpl.niches.slice(0, 2).map(n => (
                                    <span key={n} style={{ fontSize: '9px', fontWeight: 600, color: tmpl.theme.accent, background: `${tmpl.theme.accent}15`, borderRadius: '4px', padding: '2px 6px' }}>{n}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <p style={{ fontSize: '18px', fontWeight: 900, color: tmpl.theme.accent, letterSpacing: '-0.03em', lineHeight: 1 }}>{tmpl.mainStat.value}</p>
                                <p style={{ fontSize: '10px', color: tmpl.theme.subtext, marginTop: '2px' }}>{tmpl.mainStat.label}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '28px' }}>
                                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                  <div key={i} style={{ width: '5px', height: `${h * 0.28}px`, borderRadius: '2px 2px 0 0', background: i === 5 ? tmpl.theme.accent : `${tmpl.theme.accent}35` }} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div style={{ background: isSelected ? selectionColor : '#f8fafc', padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 180ms' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? 'white' : '#0f172a' }}>
                            {tmpl.id === 'youtuber' ? 'Classique' : tmpl.id === 'esport' ? 'Esport' : tmpl.id === 'mono' ? 'Minimaliste' : 'Nature'}
                          </span>
                          <span style={{ fontSize: '11px', color: isSelected ? 'rgba(255,255,255,0.75)' : '#94a3b8' }}>
                            {isSelected ? '✓ Sélectionné' : 'Choisir →'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {selectedTemplateId && (
                  <div style={{ marginTop: '14px', padding: '12px 16px', background: 'rgba(134,239,172,0.12)', border: '1px solid rgba(134,239,172,0.4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 500 }}>✓ Template appliqué — les champs ci-dessous sont mis à jour</span>
                    <button onClick={() => setShowTemplates(false)} style={{ fontSize: '13px', fontWeight: 600, color: '#15803d', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>Fermer ×</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profil */}
          <div ref={profileCardRef} className="card-standard" style={{ padding: '28px', animation: profileFlash ? 'profileFlash 1.2s ease forwards' : 'none' }}>
            <h3 style={sectionTitle}>Profil public</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {([
                { label: 'Pseudo', key: 'pseudo' },
                { label: 'Niche', key: 'niche' },
                { label: 'Pays', key: 'country' },
                { label: 'Email de contact', key: 'email' },
              ] as { label: string; key: keyof typeof profile }[]).map(field => (
                <div key={field.label}>
                  <label style={labelStyle}>{field.label}</label>
                  <input
                    value={profile[field.key]}
                    onChange={e => setProfile({ ...profile, [field.key]: e.target.value })}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={e => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>
          </div>

          {/* Tags contenu */}
          <div className="card-standard" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h3 style={sectionTitle}>Tags contenu</h3>
              <span style={{ fontSize: '12px', fontWeight: 600, color: formats.length >= 3 ? '#16a34a' : '#94a3b8' }}>
                {formats.length}/3
              </span>
            </div>
            <p style={subText}>Choisis 3 tags qui décrivent ton contenu.</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', marginBottom: '20px' }}>
              {[
                'FPS', 'Minecraft', 'Esport', 'Battle Royale', 'RPG', 'Variety Gaming',
                'Just Chatting', 'IRL / Vlog', 'Humour', 'Débats',
                'Tech & Setup', 'Tutoriels', 'Musique', 'Fitness',
                'Lifestyle', 'Voyage', 'Beauté', 'Finance',
              ].map(tag => {
                const isSelected = formats.includes(tag)
                const isDisabled = !isSelected && formats.length >= 3
                return (
                  <button
                    key={tag}
                    disabled={isDisabled}
                    onClick={() => isSelected ? removeFormat(tag) : (formats.length < 3 && setFormats([...formats, tag]))}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '6px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: 500,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      border: isSelected ? '1.5px solid #16a34a' : '1.5px solid rgba(0,0,0,0.12)',
                      background: isSelected ? 'rgba(22,163,74,0.10)' : '#f8fafc',
                      color: isSelected ? '#15803d' : isDisabled ? '#cbd5e1' : '#475569',
                      opacity: isDisabled ? 0.45 : 1,
                      transition: 'all 120ms ease',
                    }}
                  >
                    {isSelected && <span style={{ fontSize: '10px' }}>✓</span>}
                    {tag}
                  </button>
                )
              })}
            </div>

            {formats.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: formats.length >= 3 ? 'rgba(22,163,74,0.06)' : '#f8fafc', borderRadius: '10px', border: `1px solid ${formats.length >= 3 ? 'rgba(22,163,74,0.25)' : 'rgba(0,0,0,0.06)'}` }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                  {formats.map(f => (
                    <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(22,163,74,0.12)', color: '#15803d', border: '1px solid rgba(22,163,74,0.30)', borderRadius: '9999px', padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}>
                      {f}
                      <button onClick={() => removeFormat(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#16a34a', opacity: 0.6 }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '0.6')}
                      ><X size={11} /></button>
                    </span>
                  ))}
                </div>
                {formats.length >= 3 && <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, whiteSpace: 'nowrap' }}>Limite atteinte</span>}
              </div>
            )}
          </div>

          {/* Partenariats précédents */}
          <div className="card-standard" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={sectionTitle}>Partenariats précédents</h3>
                <p style={subText}>{showPartnerships ? 'Visible sur ta page publique.' : 'Masqué sur ta page publique.'}</p>
              </div>
              <button
                onClick={() => {
                  const next = !showPartnerships
                  setShowPartnerships(next)
                  localStorage.setItem('sponsorable_show_partnerships', String(next))
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '8px 14px', borderRadius: '10px',
                  border: showPartnerships ? '2px solid #16a34a' : '2px solid #cbd5e1',
                  cursor: 'pointer', transition: 'all 150ms ease', fontWeight: 600, fontSize: '13px',
                  background: showPartnerships ? 'rgba(22,163,74,0.08)' : 'white',
                  color: showPartnerships ? '#16a34a' : '#94a3b8',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = showPartnerships ? 'rgba(22,163,74,0.14)' : '#f8fafc' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = showPartnerships ? 'rgba(22,163,74,0.08)' : 'white' }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: showPartnerships ? '#16a34a' : '#cbd5e1', boxShadow: showPartnerships ? '0 0 0 3px rgba(22,163,74,0.20)' : 'none', transition: 'all 150ms ease' }} />
                {showPartnerships ? 'Visible' : 'Masqué'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: partnerships.length ? '16px' : 0 }}>
              {partnerships.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{p.name}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>·</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{p.category}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8' }}>{p.date}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{p.result}</p>
                  </div>
                  <button
                    onClick={() => removePartnership(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', flexShrink: 0, transition: 'color 150ms ease' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#94a3b8')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {addingPartnership ? (
              <div style={{ padding: '20px', background: 'rgba(134,239,172,0.06)', border: '1.5px solid rgba(134,239,172,0.3)', borderRadius: '12px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '14px' }}>Nouveau partenariat</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  {([
                    { key: 'name', label: 'Marque / Entreprise', placeholder: 'NordVPN' },
                    { key: 'category', label: 'Catégorie', placeholder: 'Cybersécurité' },
                    { key: 'date', label: 'Date', placeholder: 'Mars 2025' },
                  ] as { key: keyof Partnership; label: string; placeholder: string }[]).map(f => (
                    <div key={f.key}>
                      <label style={labelStyle}>{f.label}</label>
                      <input
                        value={draft[f.key]}
                        onChange={e => setDraft({ ...draft, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        style={inputStyle}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Résultats obtenus</label>
                  <input
                    value={draft.result}
                    onChange={e => setDraft({ ...draft, result: e.target.value })}
                    placeholder="42 000 vues · 3,1% CTR lien description"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={addPartnership} style={{ ...addBtnStyle, background: '#16a34a', color: 'white', borderColor: '#16a34a' }}>Ajouter</button>
                  <button onClick={() => { setAddingPartnership(false); setDraft(EMPTY_PARTNERSHIP) }} style={{ ...addBtnStyle }}>Annuler</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingPartnership(true)} style={{ ...addBtnStyle, width: '100%', justifyContent: 'center' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#16a34a'; (e.currentTarget as HTMLElement).style.background = 'white' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
              >
                <Plus size={14} /> Ajouter un partenariat
              </button>
            )}
          </div>

          {/* Bannière personnalisée */}
          <div className="card-standard" style={{ padding: '28px', opacity: pro ? 1 : 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={sectionTitle}>Bannière personnalisée</h3>
                  {!pro && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '9999px', padding: '2px 8px' }}><Lock size={9} /> PRO</span>}
                </div>
                <p style={subText}>Image affichée en haut de ta page publique</p>
              </div>
            </div>
            {pro ? (
              <div>
                {bannerUrl ? (
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <img src={bannerUrl} alt="Bannière" style={{ width: '100%', aspectRatio: '1546 / 423', objectFit: 'cover', objectPosition: 'center', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', display: 'block' }} />
                    <button onClick={() => setBannerUrl('')} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', padding: '4px 8px', fontSize: '12px', fontWeight: 600 }}>✕ Retirer</button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '100px', border: '2px dashed rgba(0,0,0,0.12)', borderRadius: '10px', cursor: 'pointer', background: '#f8fafc', transition: 'all 150ms' }}>
                    <span style={{ fontSize: '24px' }}>🖼️</span>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Clique pour uploader une image</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Même format que ta bannière YouTube · 2560×1440px</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = ev => setBannerUrl(ev.target?.result as string)
                      reader.readAsDataURL(file)
                    }} />
                  </label>
                )}
              </div>
            ) : (
              <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Disponible avec le plan Pro</p>
                <Link href="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: '#16a34a', textDecoration: 'none', background: 'rgba(22,163,74,0.08)', padding: '6px 12px', borderRadius: '8px' }}>
                  <Zap size={11} /> Upgrader
                </Link>
              </div>
            )}
          </div>

          {/* Lien de réservation */}
          <div className="card-standard" style={{ padding: '28px', opacity: pro ? 1 : 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 style={sectionTitle}>Lien de réservation</h3>
              {!pro && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '9999px', padding: '2px 8px' }}><Lock size={9} /> PRO</span>}
            </div>
            <p style={{ ...subText, marginBottom: '16px' }}>Intègre ton lien Calendly pour que les marques bookent un appel directement</p>
            {pro ? (
              <div>
                <label style={labelStyle}>Lien Calendly</label>
                <input
                  style={inputStyle}
                  value={calendlyUrl}
                  onChange={e => setCalendlyUrl(e.target.value)}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder="https://calendly.com/ton-pseudo"
                />
                {calendlyUrl && (
                  <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '8px', fontWeight: 500 }}>
                    ✓ Un bouton "Réserver un appel" apparaîtra sur ta page publique
                  </p>
                )}
              </div>
            ) : (
              <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Disponible avec le plan Pro</p>
                <Link href="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: '#16a34a', textDecoration: 'none', background: 'rgba(22,163,74,0.08)', padding: '6px 12px', borderRadius: '8px' }}>
                  <Zap size={11} /> Upgrader
                </Link>
              </div>
            )}
          </div>

        </div>
      </main>

      {saved && (
        <div style={{
          position:'fixed', bottom:'32px', left:'50%',
          transform:'translateX(-50%)', zIndex:100,
          background:'#0f172a', color:'white', borderRadius:'14px',
          padding:'14px 24px', display:'flex', alignItems:'center', gap:'10px',
          boxShadow:'0 8px 32px rgba(0,0,0,0.25)',
          animation:'toastIn 220ms ease forwards', whiteSpace:'nowrap',
        }}>
          <span style={{ width:'22px', height:'22px', borderRadius:'50%', background:'#16a34a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, flexShrink:0 }}>✓</span>
          <span style={{ fontSize:'14px', fontWeight:500 }}>Modifications sauvegardées</span>
        </div>
      )}
    </div>
  )
}

const sectionTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }
const subText: React.CSSProperties = { fontSize: '13px', color: '#94a3b8', marginBottom: '0' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }
const inputStyle: React.CSSProperties = { width: '100%', background: '#f8fafc', border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'all 150ms ease' }
const addBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease' }

const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = '#16a34a'
  e.target.style.background = '#fff'
}
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = 'rgba(0,0,0,0.10)'
  e.target.style.background = '#f8fafc'
}
