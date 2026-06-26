'use client'

import { Loader2, Upload, X, Check } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

// Tokens design system (dark/light premium, pilotés par variables CSS — cf. globals.css)
const BG = 'var(--ds-bg)'
const SURFACE = 'var(--ds-surface)'
const CARD = 'var(--ds-card)'
const ACCENT = 'var(--ds-accent)'
const TEXT = 'var(--ds-text)'
const TEXT2 = 'var(--ds-text2)'
const MUTED = 'var(--ds-muted)'
const BORDER = 'var(--ds-border)'
const SYNE = 'var(--font-syne), system-ui, sans-serif'
const DISPLAY = 'var(--font-display), system-ui, sans-serif'

type Company = {
  name: string
  sector: string | null
  logoUrl: string | null
  website: string | null
  description: string | null
  budgetMinEur: number | null
  budgetMaxEur: number | null
  preferredGames: string[]
  preferredLanguages: string[]
  targetAudienceAgeMin: number | null
  targetAudienceAgeMax: number | null
  isVerified?: boolean
}

const EMPTY: Company = {
  name: '', sector: null, logoUrl: null, website: null, description: null,
  budgetMinEur: null, budgetMaxEur: null, preferredGames: [], preferredLanguages: [],
  targetAudienceAgeMin: null, targetAudienceAgeMax: null,
}

// Secteurs courants côté annonceurs gaming (liste indicative, champ libre possible).
const SECTORS = [
  'Périphériques gaming', 'Énergie / boissons', 'Édition de jeux', 'Hardware / PC',
  'Mode / lifestyle', 'Tech / SaaS', 'Food / snacking', 'Télécom', 'Autre',
]

function ChipInput({ label, hint, values, onChange, placeholder }: {
  label: string; hint?: string; values: string[]; onChange: (v: string[]) => void; placeholder: string
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (v && !values.includes(v) && values.length < 30) onChange([...values, v])
    setDraft('')
  }
  return (
    <div>
      <label style={{ fontSize: '13px', fontWeight: 600, color: TEXT2, display: 'block', marginBottom: '6px', fontFamily: SYNE }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: values.length ? '8px' : 0 }}>
        {values.map(v => (
          <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: ACCENT, color: '#fff', borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: 600, fontFamily: SYNE }}>
            {v}
            <button type="button" onClick={() => onChange(values.filter(x => x !== v))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', padding: 0 }}><X size={13} /></button>
          </span>
        ))}
      </div>
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
        onBlur={add}
        placeholder={placeholder}
        style={{ width: '100%', padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: '10px', fontSize: '14px', color: TEXT, outline: 'none', boxSizing: 'border-box', background: SURFACE, fontFamily: SYNE }}
      />
      {hint && <p style={{ fontSize: '12px', color: MUTED, marginTop: '6px', fontFamily: SYNE }}>{hint}</p>}
    </div>
  )
}

export default function BrandProfilePage() {
  const router = useRouter()
  const [form, setForm] = useState<Company>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Garde d'accès + chargement du profil existant.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const meRes = await fetch('/api/me', { cache: 'no-store' })
        if (meRes.ok) {
          const me = await meRes.json()
          if (me.accountType !== 'company') { router.replace('/dashboard'); return }
        }
        const res = await fetch('/api/company', { cache: 'no-store' })
        if (res.ok && !cancelled) {
          const data = await res.json()
          if (data.company) {
            setForm({
              ...EMPTY,
              ...data.company,
              preferredGames: data.company.preferredGames ?? [],
              preferredLanguages: data.company.preferredLanguages ?? [],
            })
          }
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [router])

  const set = <K extends keyof Company>(key: K, value: Company[K]) => {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'logo')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) set('logoUrl', data.url)
      else setError(data.error ?? 'Échec de l\'upload')
    } catch { setError('Erreur réseau pendant l\'upload') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          // Champs vides → null (cohérent avec la validation côté serveur).
          sector: form.sector || null,
          website: form.website || null,
          description: form.description || null,
        }),
      })
      const data = await res.json()
      if (res.ok) { setSaved(true) }
      else setError(data.error ?? 'Échec de l\'enregistrement')
    } catch { setError('Erreur réseau') }
    finally { setSaving(false) }
  }

  const numOrNull = (s: string): number | null => {
    if (s.trim() === '') return null
    const n = parseInt(s, 10)
    return Number.isFinite(n) ? n : null
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: '10px',
    fontSize: '14px', color: TEXT, outline: 'none', boxSizing: 'border-box', background: SURFACE, fontFamily: SYNE,
  }
  const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: TEXT2, display: 'block', marginBottom: '6px', fontFamily: SYNE }

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      {/* Top bar minimal (le vrai nav marque arrive au Lot C avec l'annuaire) */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${BORDER}`, background: CARD }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: '#16a34a', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: TEXT, fontFamily: DISPLAY }}>Sponsorable <span style={{ color: MUTED, fontWeight: 500 }}>· Marque</span></span>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })} style={{ background: 'none', border: `1px solid ${BORDER}`, color: TEXT2, fontSize: '13px', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontFamily: SYNE }}>Déconnexion</button>
      </header>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: TEXT, letterSpacing: '-0.02em', fontFamily: DISPLAY, margin: '0 0 6px' }}>Profil de ta marque</h1>
        <p style={{ fontSize: '14px', color: TEXT2, fontFamily: SYNE, margin: '0 0 32px' }}>
          Ces infos servent à cibler les bons créateurs et à te présenter quand tu les contactes.
        </p>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: MUTED, fontFamily: SYNE }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Chargement…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

            {/* Logo */}
            <div>
              <label style={labelStyle}>Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: SURFACE, border: `1px solid ${BORDER}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {form.logoUrl
                    ? <img src={form.logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '11px', color: MUTED, fontFamily: SYNE }}>Aucun</span>}
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleLogo} style={{ display: 'none' }} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: '13px', fontWeight: 600, padding: '8px 14px', borderRadius: '9px', cursor: uploading ? 'wait' : 'pointer', fontFamily: SYNE }}>
                    {uploading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
                    {uploading ? 'Envoi…' : 'Importer un logo'}
                  </button>
                  {form.logoUrl && (
                    <button type="button" onClick={() => set('logoUrl', null)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: MUTED, fontSize: '13px', cursor: 'pointer', fontFamily: SYNE }}>Retirer</button>
                  )}
                </div>
              </div>
            </div>

            {/* Nom */}
            <div>
              <label style={labelStyle}>Nom de l&apos;entreprise *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ton entreprise" style={inputStyle} />
            </div>

            {/* Secteur */}
            <div>
              <label style={labelStyle}>Secteur</label>
              <select value={form.sector ?? ''} onChange={e => set('sector', e.target.value || null)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">— Choisir —</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Site web */}
            <div>
              <label style={labelStyle}>Site web</label>
              <input value={form.website ?? ''} onChange={e => set('website', e.target.value)} placeholder="https://…" style={inputStyle} />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)} rows={4} maxLength={2000}
                placeholder="Présente ta marque, tes produits, ce que tu cherches chez un créateur…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </div>

            {/* Budget */}
            <div>
              <label style={labelStyle}>Budget indicatif par collaboration (€)</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input type="number" min={0} value={form.budgetMinEur ?? ''} onChange={e => set('budgetMinEur', numOrNull(e.target.value))} placeholder="Min" style={inputStyle} />
                <span style={{ color: MUTED, fontFamily: SYNE }}>→</span>
                <input type="number" min={0} value={form.budgetMaxEur ?? ''} onChange={e => set('budgetMaxEur', numOrNull(e.target.value))} placeholder="Max" style={inputStyle} />
              </div>
            </div>

            {/* Jeux ciblés */}
            <ChipInput label="Jeux ciblés" hint="Entrée ou virgule pour ajouter. Ex : Valorant, League of Legends…"
              values={form.preferredGames} onChange={v => set('preferredGames', v)} placeholder="Ajouter un jeu…" />

            {/* Langues */}
            <ChipInput label="Langues visées" hint="Ex : fr, en"
              values={form.preferredLanguages} onChange={v => set('preferredLanguages', v)} placeholder="Ajouter une langue…" />

            {/* Tranche d'âge audience */}
            <div>
              <label style={labelStyle}>Tranche d&apos;âge de l&apos;audience visée</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input type="number" min={0} max={120} value={form.targetAudienceAgeMin ?? ''} onChange={e => set('targetAudienceAgeMin', numOrNull(e.target.value))} placeholder="Min" style={inputStyle} />
                <span style={{ color: MUTED, fontFamily: SYNE }}>→</span>
                <input type="number" min={0} max={120} value={form.targetAudienceAgeMax ?? ''} onChange={e => set('targetAudienceAgeMax', numOrNull(e.target.value))} placeholder="Max" style={inputStyle} />
              </div>
            </div>

            {error && (
              <div style={{ background: 'var(--ds-error-bg, #fef2f2)', border: '1px solid var(--ds-error)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: 'var(--ds-error)', fontFamily: SYNE }}>{error}</div>
            )}

            {/* Barre de sauvegarde */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', background: (saving || !form.name.trim()) ? 'var(--ds-muted)' : ACCENT, color: '#fff', fontSize: '14px', fontWeight: 600, padding: '11px 22px', borderRadius: '10px', cursor: (saving || !form.name.trim()) ? 'not-allowed' : 'pointer', fontFamily: SYNE }}>
                {saving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              {saved && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ds-green-dk, #15803d)', fontWeight: 600, fontFamily: SYNE }}>
                  <Check size={15} /> Enregistré
                </span>
              )}
            </div>
          </div>
        )}
      </main>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
