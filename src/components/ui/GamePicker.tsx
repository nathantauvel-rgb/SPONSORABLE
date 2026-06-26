'use client'

import { X, ChevronDown, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { GAMES } from '@/lib/games'

// Sélecteur de jeux multi-choix, recherche + liste déroulante, depuis le
// référentiel partagé `GAMES`. Thémé via les tokens --ds-* (dark/light).
// Réutilisé côté créateur (media kit) et côté marque (profil + filtre annuaire).
const ACCENT = 'var(--ds-accent)'
const TEXT = 'var(--ds-text)'
const TEXT2 = 'var(--ds-text2)'
const MUTED = 'var(--ds-muted)'
const BORDER = 'var(--ds-border)'
const SURFACE = 'var(--ds-surface)'
const CARD = 'var(--ds-card)'
const SYNE = 'var(--font-syne), system-ui, sans-serif'

export default function GamePicker({
  values,
  onChange,
  max = 30,
  placeholder = 'Rechercher un jeu…',
}: {
  values: string[]
  onChange: (v: string[]) => void
  max?: number
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Ferme la liste au clic extérieur.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggle = (game: string) => {
    if (values.includes(game)) onChange(values.filter(g => g !== game))
    else if (values.length < max) onChange([...values, game])
  }

  const filtered = GAMES.filter(g => g.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Chips sélectionnés */}
      {values.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          {values.map(g => (
            <span key={g} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: ACCENT, color: '#fff', borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: 600, fontFamily: SYNE }}>
              {g}
              <button type="button" onClick={() => toggle(g)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', padding: 0 }}><X size={13} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Champ de recherche / déclencheur */}
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: '10px', background: SURFACE, color: values.length ? TEXT : MUTED, fontSize: '14px', cursor: 'pointer', fontFamily: SYNE }}>
        <span>{values.length ? `${values.length} sélectionné${values.length > 1 ? 's' : ''}` : 'Choisir des jeux…'}</span>
        <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms', color: MUTED }} />
      </button>

      {/* Liste déroulante */}
      {open && (
        <div style={{ position: 'absolute', zIndex: 20, top: 'calc(100% + 6px)', left: 0, right: 0, background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
          <div style={{ padding: '10px' }}>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={placeholder}
              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '14px', color: TEXT, outline: 'none', boxSizing: 'border-box', background: SURFACE, fontFamily: SYNE }} />
          </div>
          <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '0 6px 8px' }}>
            {filtered.length === 0 ? (
              <p style={{ padding: '8px 12px', fontSize: '13px', color: MUTED, fontFamily: SYNE }}>Aucun jeu trouvé.</p>
            ) : filtered.map(g => {
              const selected = values.includes(g)
              return (
                <button key={g} type="button" onClick={() => toggle(g)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: 'none', borderRadius: '8px', background: selected ? 'var(--ds-hover, rgba(22,163,74,0.1))' : 'transparent', color: TEXT, fontSize: '14px', cursor: 'pointer', fontFamily: SYNE, textAlign: 'left' }}
                  onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'var(--ds-hover, rgba(0,0,0,0.04))' }}
                  onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  <span style={{ color: selected ? TEXT : TEXT2 }}>{g}</span>
                  {selected && <Check size={15} style={{ color: ACCENT }} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
