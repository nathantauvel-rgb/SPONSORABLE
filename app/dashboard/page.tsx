'use client'

import { Copy, ExternalLink, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import MetricCard from '@/components/ui/MetricCard'
import { creator, metrics, platforms } from '@/data/mockData'

type YTData = {
  channelId: string
  title: string
  subscriberCount: string
  viewCount: string
  videoCount: string
  lastFetched: string
}

const fmtNum = (n: string | number): string => {
  const num = typeof n === 'string' ? parseInt(n) : n
  if (isNaN(num)) return String(n)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (num >= 1_000) return num.toLocaleString('fr-FR')
  return String(num)
}

const PlatformIcon = ({ id, color }: { id: string; color: string }) => {
  if (id === 'youtube') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
      <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white"/>
    </svg>
  )
  if (id === 'twitch') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
  )
  if (id === 'tiktok') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
    </svg>
  )
  if (id === 'instagram') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
  return null
}

const STORAGE_KEY = 'sponsorable_connected_platforms'
const DEFAULT_CONNECTED = platforms.map(p => p.id)

const loadConnected = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : DEFAULT_CONNECTED
  } catch { return DEFAULT_CONNECTED }
}

const loadYTData = (): YTData | null => {
  try {
    const saved = localStorage.getItem('sponsorable_yt_data')
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

const loadProfile = () => {
  try {
    const saved = localStorage.getItem('sponsorable_profile')
    if (!saved) return null
    return JSON.parse(saved)
  } catch { return null }
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }
const inputStyle: React.CSSProperties = { width: '100%', background: '#f8fafc', border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'all 150ms ease' }
const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#16a34a'; e.target.style.background = '#fff' }
const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'rgba(0,0,0,0.10)'; e.target.style.background = '#f8fafc' }

export default function DashboardPage() {
  const router = useRouter()
  const [connected, setConnected] = useState<string[]>(loadConnected)
  const [savedProfile] = useState(loadProfile)
  const [ytData, setYtData] = useState<YTData | null>(loadYTData)
  const [showYTSetup, setShowYTSetup] = useState(false)
  const [ytApiKey, setYtApiKey] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('sponsorable_yt_api_key') || '' : '')
  const [ytHandle, setYtHandle] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('sponsorable_yt_handle') || '' : '')
  const [ytLoading, setYtLoading] = useState(false)
  const [ytError, setYtError] = useState('')

  const toggle = (id: string) => {
    const next = connected.includes(id)
      ? connected.filter(x => x !== id)
      : [...connected, id]
    setConnected(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const connectYouTube = async () => {
    if (!ytApiKey.trim() || !ytHandle.trim()) {
      setYtError('Remplis les deux champs.')
      return
    }
    setYtLoading(true)
    setYtError('')
    try {
      const handle = ytHandle.trim().startsWith('@') ? ytHandle.trim() : `@${ytHandle.trim()}`
      const byHandle = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(handle)}&key=${ytApiKey.trim()}`
      )
      let json = await byHandle.json()

      if (!json.items?.length) {
        const byId = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ytHandle.trim()}&key=${ytApiKey.trim()}`
        )
        json = await byId.json()
      }

      if (json.error) throw new Error(json.error.message)
      if (!json.items?.length) throw new Error('Chaîne introuvable. Vérifie le handle ou l\'ID.')

      const ch = json.items[0]
      const data: YTData = {
        channelId: ch.id,
        title: ch.snippet.title,
        subscriberCount: ch.statistics.subscriberCount ?? '0',
        viewCount: ch.statistics.viewCount ?? '0',
        videoCount: ch.statistics.videoCount ?? '0',
        lastFetched: new Date().toISOString(),
      }
      localStorage.setItem('sponsorable_yt_data', JSON.stringify(data))
      localStorage.setItem('sponsorable_yt_api_key', ytApiKey.trim())
      localStorage.setItem('sponsorable_yt_handle', ytHandle.trim())
      setYtData(data)
      setShowYTSetup(false)

      if (!connected.includes('youtube')) {
        const next = [...connected, 'youtube']
        setConnected(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      }
    } catch (e: unknown) {
      setYtError(e instanceof Error ? e.message : 'Erreur réseau')
    } finally {
      setYtLoading(false)
    }
  }

  const disconnectYT = () => {
    localStorage.removeItem('sponsorable_yt_data')
    setYtData(null)
    toggle('youtube')
    setShowYTSetup(false)
  }

  const lastSync = ytData
    ? (() => {
        const diff = Date.now() - new Date(ytData.lastFetched).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'à l\'instant'
        if (mins < 60) return `il y a ${mins} min`
        const h = Math.floor(mins / 60)
        return `il y a ${h}h`
      })()
    : null

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Sidebar />

      <main style={{ marginLeft: '240px', padding: '40px 48px', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Bonjour {ytData ? ytData.title : (savedProfile?.pseudo || 'AlexPlays')} 👋
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              {lastSync ? `Données YouTube synchronisées ${lastSync}` : `Mis à jour ${creator.last_sync}`} · {creator.url}
            </p>
          </div>
          <Button variant="outline" arrow onClick={() => router.push('/alexplays')}>
            Voir ma page
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {metrics.map((m, i) => (
            <MetricCard
              key={m.label}
              label={m.label}
              value={i === 0 && ytData ? fmtNum(ytData.subscriberCount) : m.value}
              change={m.change}
              positive={m.positive}
            />
          ))}
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
            Tes plateformes connectées
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '560px' }}>

            <div>
              <div
                className="card-standard"
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: connected.includes('youtube') ? 1 : 0.55, transition: 'opacity 200ms ease' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <PlatformIcon id="youtube" color={connected.includes('youtube') ? '#ef4444' : '#94a3b8'} />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>YouTube</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {ytData
                        ? `${ytData.title} · ${fmtNum(ytData.subscriberCount)} abonnés`
                        : connected.includes('youtube')
                        ? `${creator.pseudo} · données démo`
                        : 'Déconnecté'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {ytData ? (
                    <span style={{ background: 'rgba(134,239,172,0.2)', color: '#15803d', border: '1px solid rgba(134,239,172,0.4)', borderRadius: '9999px', padding: '3px 12px', fontSize: '12px', fontWeight: 500 }}>
                      Connecté ✓
                    </span>
                  ) : connected.includes('youtube') ? (
                    <span style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', borderRadius: '9999px', padding: '3px 12px', fontSize: '12px', fontWeight: 500 }}>
                      Données démo
                    </span>
                  ) : (
                    <span style={{ background: '#f1f5f9', color: '#94a3b8', borderRadius: '9999px', padding: '3px 12px', fontSize: '12px', fontWeight: 500 }}>
                      Déconnecté
                    </span>
                  )}
                  {ytData ? (
                    <>
                      <button
                        onClick={() => setShowYTSetup(v => !v)}
                        title="Synchroniser"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: '2px' }}
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button onClick={disconnectYT} style={{ fontSize: '12px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Déconnecter
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowYTSetup(v => !v)}
                      style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {connected.includes('youtube') ? 'Connecter API →' : 'Reconnecter'}
                    </button>
                  )}
                </div>
              </div>

              {showYTSetup && (
                <div style={{ marginTop: '8px', padding: '20px 24px', background: 'white', border: '1.5px solid rgba(22,163,74,0.2)', borderRadius: '12px', position: 'relative' }}>
                  <button
                    onClick={() => { setShowYTSetup(false); setYtError('') }}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <X size={16} />
                  </button>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    Connecter ta chaîne YouTube
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px', lineHeight: 1.5 }}>
                    Crée une clé API gratuite sur{' '}
                    <span style={{ color: '#16a34a', fontWeight: 500 }}>console.cloud.google.com</span>
                    {' '}→ Active "YouTube Data API v3" → Crée une clé.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Clé API Google</label>
                      <input
                        type="password"
                        value={ytApiKey}
                        onChange={e => setYtApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Handle ou ID de ta chaîne</label>
                      <input
                        value={ytHandle}
                        onChange={e => setYtHandle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && connectYouTube()}
                        placeholder="@monpseudo ou UCxxxxx..."
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                      />
                    </div>
                    {ytError && (
                      <p style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px' }}>
                        {ytError}
                      </p>
                    )}
                    <button
                      onClick={connectYouTube}
                      disabled={ytLoading}
                      style={{ alignSelf: 'flex-start', background: ytLoading ? '#86efac' : '#16a34a', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: ytLoading ? 'wait' : 'pointer', transition: 'background 150ms ease' }}
                    >
                      {ytLoading ? 'Connexion...' : 'Connecter'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {platforms.filter(p => p.id !== 'youtube').map(p => {
              const isConnected = connected.includes(p.id)
              return (
                <div
                  key={p.id}
                  className="card-standard"
                  style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isConnected ? 1 : 0.55, transition: 'opacity 200ms ease' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <PlatformIcon id={p.id} color={isConnected ? p.color : '#94a3b8'} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{p.name}</p>
                      <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {isConnected ? `${creator.pseudo} · ${p.mainStat.value} ${p.mainStat.label}` : 'Déconnecté'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isConnected ? (
                      <span style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', borderRadius: '9999px', padding: '3px 12px', fontSize: '12px', fontWeight: 500 }}>
                        Données démo
                      </span>
                    ) : (
                      <span style={{ background: '#f1f5f9', color: '#94a3b8', borderRadius: '9999px', padding: '3px 12px', fontSize: '12px', fontWeight: 500 }}>
                        Déconnecté
                      </span>
                    )}
                    <button
                      onClick={() => toggle(p.id)}
                      style={{ fontSize: '12px', color: isConnected ? '#94a3b8' : '#16a34a', fontWeight: isConnected ? 400 : 600, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {isConnected ? 'Masquer' : 'Afficher'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ maxWidth: '560px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
            Ton lien public
          </h3>
          <div style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>
              sponsorable.gg/alexplays
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => navigator.clipboard.writeText('https://sponsorable.gg/alexplays')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }} title="Copier">
                <Copy size={15} />
              </button>
              <button onClick={() => router.push('/alexplays')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }} title="Ouvrir">
                <ExternalLink size={15} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="primary" arrow onClick={() => router.push('/alexplays')}>
              Voir ma page
            </Button>
            <Button variant="outline">
              Télécharger PDF
              <span style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.10)', borderRadius: '9999px', padding: '1px 8px', fontSize: '10px', fontWeight: 600, color: '#94a3b8', marginLeft: '4px' }}>
                Pro
              </span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
