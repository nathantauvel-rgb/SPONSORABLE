'use client'

import { Plus, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/button'
import { creator, pastPartners } from '@/data/mockData'

type Partnership = { name: string; category: string; result: string; date: string }

const DEFAULT_FORMATS = ['YouTube', 'Twitch', 'Réseaux sociaux', 'Ambassadeur']
const EMPTY_PARTNERSHIP: Partnership = { name: '', category: '', result: '', date: '' }

const load = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch { return fallback }
}

const sectionTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }
const subText: React.CSSProperties = { fontSize: '13px', color: '#94a3b8', marginBottom: '0' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }
const inputStyle: React.CSSProperties = { width: '100%', background: '#f8fafc', border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'all 150ms ease' }
const chipStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(134,239,172,0.15)', color: '#15803d', border: '1px solid rgba(134,239,172,0.4)', borderRadius: '9999px', padding: '5px 12px', fontSize: '13px', fontWeight: 500 }
const chipBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#16a34a', opacity: 0.5, transition: 'opacity 150ms ease' }
const addBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease' }
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = '#16a34a'; e.target.style.background = '#fff' }
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = 'rgba(0,0,0,0.10)'; e.target.style.background = '#f8fafc' }

export default function MediaKitEditorPage() {
  const [formats, setFormats] = useState<string[]>(() => load('sponsorable_formats', DEFAULT_FORMATS))
  const [newFormat, setNewFormat] = useState('')
  const [showPartnerships, setShowPartnerships] = useState<boolean>(() => load('sponsorable_show_partnerships', true))
  const [partnerships, setPartnerships] = useState<Partnership[]>(() => load('sponsorable_partnerships', pastPartners))
  const [addingPartnership, setAddingPartnership] = useState(false)
  const [draft, setDraft] = useState<Partnership>(EMPTY_PARTNERSHIP)
  const [saved, setSaved] = useState(false)

  const addFormat = () => {
    const trimmed = newFormat.trim()
    if (!trimmed || formats.includes(trimmed)) return
    setFormats([...formats, trimmed]); setNewFormat('')
  }
  const removeFormat = (f: string) => setFormats(formats.filter(x => x !== f))
  const addPartnership = () => {
    if (!draft.name.trim()) return
    setPartnerships([...partnerships, draft]); setDraft(EMPTY_PARTNERSHIP); setAddingPartnership(false)
  }
  const removePartnership = (i: number) => setPartnerships(partnerships.filter((_, idx) => idx !== i))
  const handleSave = () => {
    localStorage.setItem('sponsorable_formats', JSON.stringify(formats))
    localStorage.setItem('sponsorable_show_partnerships', String(showPartnerships))
    localStorage.setItem('sponsorable_partnerships', JSON.stringify(partnerships))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', padding: '40px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Mon media kit</h1>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Personnalise ce que voient les sponsors.</p>
          </div>
          <Button variant="primary" onClick={handleSave}>{saved ? '✓ Sauvegardé' : 'Sauvegarder'}</Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>
          {/* Profil */}
          <div className="card-standard" style={{ padding: '28px' }}>
            <h3 style={sectionTitle}>Profil public</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              {[
                { label: 'Pseudo', value: creator.pseudo },
                { label: 'Niche', value: creator.niche },
                { label: 'Pays', value: creator.country },
                { label: 'Email de contact', value: creator.email },
              ].map(field => (
                <div key={field.label}>
                  <label style={labelStyle}>{field.label}</label>
                  <input defaultValue={field.value} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Bio</label>
                <textarea defaultValue={creator.bio} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
          </div>

          {/* Formats */}
          <div className="card-standard" style={{ padding: '28px' }}>
            <h3 style={sectionTitle}>Formats de collaboration</h3>
            <p style={subText}>Ces chips s'affichent sur ta page publique pour indiquer aux sponsors ce que tu proposes.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '16px 0', minHeight: '36px' }}>
              {formats.length === 0 && <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Aucun format — ajoutes-en au moins un.</p>}
              {formats.map(f => (
                <span key={f} style={chipStyle}>
                  {f}
                  <button onClick={() => removeFormat(f)} style={chipBtn} onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '1')} onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '0.5')}><X size={12} /></button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={newFormat} onChange={e => setNewFormat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFormat()} placeholder="Ex: Live gaming, Unboxing..." style={{ ...inputStyle, flex: 1 }} onFocus={onFocus} onBlur={onBlur} />
              <button onClick={addFormat} style={addBtnStyle} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#16a34a'; (e.currentTarget as HTMLElement).style.background = 'white' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}>
                <Plus size={14} /> Ajouter
              </button>
            </div>
          </div>

          {/* Partenariats */}
          <div className="card-standard" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={sectionTitle}>Partenariats précédents</h3>
                <p style={subText}>{showPartnerships ? 'Visible sur ta page publique.' : 'Masqué sur ta page publique.'}</p>
              </div>
              <button onClick={() => { const next = !showPartnerships; setShowPartnerships(next); localStorage.setItem('sponsorable_show_partnerships', String(next)) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                {showPartnerships ? <ToggleRight size={36} color="#16a34a" /> : <ToggleLeft size={36} color="#94a3b8" />}
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
                  <button onClick={() => removePartnership(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', flexShrink: 0 }} onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#ef4444')} onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#94a3b8')}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {addingPartnership ? (
              <div style={{ padding: '20px', background: 'rgba(134,239,172,0.06)', border: '1.5px solid rgba(134,239,172,0.3)', borderRadius: '12px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '14px' }}>Nouveau partenariat</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  {([{ key: 'name', label: 'Marque / Entreprise', placeholder: 'NordVPN' }, { key: 'category', label: 'Catégorie', placeholder: 'Cybersécurité' }, { key: 'date', label: 'Date', placeholder: 'Mars 2025' }] as { key: keyof Partnership; label: string; placeholder: string }[]).map(f => (
                    <div key={f.key}>
                      <label style={labelStyle}>{f.label}</label>
                      <input value={draft[f.key]} onChange={e => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Résultats obtenus</label>
                  <input value={draft.result} onChange={e => setDraft({ ...draft, result: e.target.value })} placeholder="42 000 vues · 3,1% CTR" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={addPartnership} style={{ ...addBtnStyle, background: '#16a34a', color: 'white', borderColor: '#16a34a' }} onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#15803d')} onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#16a34a')}>Ajouter</button>
                  <button onClick={() => { setAddingPartnership(false); setDraft(EMPTY_PARTNERSHIP) }} style={addBtnStyle}>Annuler</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingPartnership(true)} style={{ ...addBtnStyle, width: '100%', justifyContent: 'center' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#16a34a'; (e.currentTarget as HTMLElement).style.background = 'white' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}>
                <Plus size={14} /> Ajouter un partenariat
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
