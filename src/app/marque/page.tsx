'use client'

import { Loader2, Search, ExternalLink, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { GAMES } from '@/lib/games'
import BrandNav from '@/components/layout/BrandNav'

// Tokens design system (dark/light premium)
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

// Mêmes libellés que le sélecteur de langues du media kit créateur (pour matcher).
const LANGUAGES = ['Français', 'Anglais', 'Espagnol', 'Portugais', 'Allemand', 'Italien', 'Arabe']
const AUDIENCE_TIERS = [
  { label: 'Toutes tailles', value: 0 },
  { label: '1 000+', value: 1000 },
  { label: '10 000+', value: 10000 },
  { label: '50 000+', value: 50000 },
  { label: '100 000+', value: 100000 },
]

type Creator = {
  creatorId: string
  slug: string
  displayName: string | null
  niche: string | null
  games: string[]
  languages: string[]
  audienceTotal: number
  availableForCollabs: boolean
  avatarUrl: string | null
  platforms: string[]
}

const fmtNum = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (n >= 1_000) return n.toLocaleString('fr-FR')
  return String(n)
}

const PlatformDot = ({ type }: { type: string }) => {
  const color = type === 'youtube' ? '#f0504d' : type === 'twitch' ? '#a87cff' : type === 'tiktok' ? 'var(--ds-text)' : MUTED
  const label = type === 'youtube' ? 'YT' : type === 'twitch' ? 'TW' : type === 'tiktok' ? 'TK' : type
  return <span style={{ fontSize: '10px', fontWeight: 700, color, background: 'var(--ds-surface)', border: `1px solid ${BORDER}`, borderRadius: '5px', padding: '1px 5px', fontFamily: SYNE }}>{label}</span>
}

function CreatorCard({ c }: { c: Creator }) {
  const name = c.displayName?.trim() || c.slug
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const shownGames = c.games.slice(0, 3)
  const moreGames = c.games.length - shownGames.length
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: c.avatarUrl ? `center / cover no-repeat url("${c.avatarUrl}")` : '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px', fontFamily: SYNE, flexShrink: 0 }}>{c.avatarUrl ? '' : initials}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: TEXT, fontFamily: SYNE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
          {c.niche && <p style={{ margin: '2px 0 0', fontSize: '12px', color: MUTED, fontFamily: SYNE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.niche}</p>}
        </div>
        {c.platforms.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>{c.platforms.map(p => <PlatformDot key={p} type={p} />)}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={14} style={{ color: MUTED }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT, fontFamily: SYNE }}>{fmtNum(c.audienceTotal)}</span>
          <span style={{ fontSize: '12px', color: MUTED, fontFamily: SYNE }}>audience cumulée</span>
        </div>
        {c.availableForCollabs && (
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: '#16a34a', background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '9999px', padding: '2px 9px', fontFamily: SYNE }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />Dispo
          </span>
        )}
      </div>

      {c.games.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {shownGames.map(g => <span key={g} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '7px', background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT2, fontFamily: SYNE }}>{g}</span>)}
          {moreGames > 0 && <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '7px', color: MUTED, fontFamily: SYNE }}>+{moreGames}</span>}
        </div>
      )}

      <a href={`/${c.slug}`} target="_blank" rel="noopener noreferrer" style={{ marginTop: '2px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT, fontSize: '13px', fontWeight: 600, padding: '9px', borderRadius: '9px', textDecoration: 'none', fontFamily: SYNE }}>
        Voir la page <ExternalLink size={14} />
      </a>
    </div>
  )
}

export default function AnnuairePage() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [game, setGame] = useState('')
  const [lang, setLang] = useState('')
  const [minAudience, setMinAudience] = useState(0)
  const [sponsorReady, setSponsorReady] = useState(false)
  const [page, setPage] = useState(1)

  const [creators, setCreators] = useState<Creator[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  // Garde : l'annuaire est réservé aux marques.
  useEffect(() => {
    fetch('/api/me', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(me => { if (me && me.accountType !== 'company') router.replace('/dashboard') })
      .catch(() => {})
  }, [router])

  const fetchPage = useCallback(async (pageToLoad: number, replace: boolean) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (game) params.set('game', game)
      if (lang) params.set('lang', lang)
      if (minAudience > 0) params.set('minAudience', String(minAudience))
      if (sponsorReady) params.set('sponsorReady', '1')
      params.set('page', String(pageToLoad))
      const res = await fetch(`/api/directory?${params.toString()}`, { cache: 'no-store' })
      if (res.status === 403) { setForbidden(true); return }
      const data = await res.json()
      setCreators(prev => replace ? data.creators : [...prev, ...data.creators])
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [q, game, lang, minAudience, sponsorReady])

  // Re-fetch (page 1, remplacement) à chaque changement de filtre — léger debounce sur la recherche.
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchPage(1, true) }, 250)
    return () => clearTimeout(t)
  }, [fetchPage])

  const loadMore = () => { const next = page + 1; setPage(next); fetchPage(next, false) }

  const selectStyle: React.CSSProperties = {
    padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: '9px', fontSize: '13px',
    color: TEXT, background: CARD, outline: 'none', cursor: 'pointer', fontFamily: SYNE,
  }

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <BrandNav />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: TEXT, letterSpacing: '-0.02em', fontFamily: DISPLAY, margin: '0 0 6px' }}>Annuaire des créateurs</h1>
        <p style={{ fontSize: '14px', color: TEXT2, fontFamily: SYNE, margin: '0 0 24px' }}>Stats vérifiées via API. Filtre, puis ouvre une page pour en savoir plus.</p>

        {forbidden ? (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px', color: TEXT2, fontFamily: SYNE }}>
            L&apos;annuaire est réservé aux comptes marque.
          </div>
        ) : (
          <>
            {/* Barre de filtres */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '22px' }}>
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: MUTED }} />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un créateur, une niche…"
                  style={{ width: '100%', padding: '9px 12px 9px 34px', border: `1px solid ${BORDER}`, borderRadius: '9px', fontSize: '13px', color: TEXT, background: CARD, outline: 'none', boxSizing: 'border-box', fontFamily: SYNE }} />
              </div>
              <select value={game} onChange={e => setGame(e.target.value)} style={selectStyle}>
                <option value="">Tous les jeux</option>
                {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={lang} onChange={e => setLang(e.target.value)} style={selectStyle}>
                <option value="">Toutes les langues</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select value={minAudience} onChange={e => setMinAudience(Number(e.target.value))} style={selectStyle}>
                {AUDIENCE_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <button onClick={() => setSponsorReady(v => !v)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: sponsorReady ? `1px solid ${ACCENT}` : `1px solid ${BORDER}`, background: sponsorReady ? 'rgba(22,163,74,0.12)' : CARD, color: sponsorReady ? '#16a34a' : TEXT2, fontFamily: SYNE }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: sponsorReady ? '#16a34a' : BORDER }} />
                Prêts pour le sponsoring
              </button>
            </div>

            {/* Compteur */}
            <p style={{ fontSize: '13px', color: MUTED, fontFamily: SYNE, margin: '0 0 14px' }}>
              {loading && creators.length === 0 ? 'Chargement…' : `${total} créateur${total > 1 ? 's' : ''}`}
            </p>

            {/* Grille */}
            {creators.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {creators.map(c => <CreatorCard key={c.creatorId} c={c} />)}
              </div>
            ) : !loading ? (
              <div style={{ background: CARD, border: `1px dashed var(--ds-dashed, ${BORDER})`, borderRadius: '12px', padding: '40px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: TEXT, fontFamily: SYNE, margin: '0 0 6px' }}>Aucun créateur ne correspond</p>
                <p style={{ fontSize: '13px', color: MUTED, fontFamily: SYNE, margin: 0 }}>Élargis tes filtres — ou reviens bientôt, l&apos;annuaire se remplit.</p>
              </div>
            ) : null}

            {/* Charger plus */}
            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                <button onClick={loadMore} disabled={loading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: '14px', fontWeight: 600, padding: '10px 22px', borderRadius: '10px', cursor: loading ? 'wait' : 'pointer', fontFamily: SYNE }}>
                  {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                  Charger plus
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
