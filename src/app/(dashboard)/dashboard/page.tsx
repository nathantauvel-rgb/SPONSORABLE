'use client'

import { Copy, ExternalLink } from 'lucide-react'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import Sidebar from '@/components/layout/Sidebar'

// Design system — dark premium (gris chauds façon Notion/Linear).
const BG      = '#1c1c1b'   // fond de page
const SURFACE = '#1f1f1e'   // surfaces secondaires
const CARD    = '#242423'   // cartes
const ACCENT  = '#2ea862'   // vert d'action
const GREEN_DK= '#4cc578'   // vert texte (statut "Relié")
const TEXT    = '#ededec'   // texte principal
const TEXT2   = '#9b9a95'   // texte secondaire
const MUTED   = '#6f6e6a'   // texte tertiaire / placeholders
const BORDER  = '#2f2f2d'   // bordures fines
const SYNE    = 'var(--font-syne), system-ui, sans-serif'
const DISPLAY = 'var(--font-display), system-ui, sans-serif'
const NUM     = '"Martian Mono", var(--font-num), ui-monospace, monospace'

type YTData = {
  channelId: string
  title: string
  thumbnail: string | null
  subscriberCount: string
  viewCount: string
  videoCount: string
  lastFetched: string
}

type TwitchData = {
  userId: string
  login: string
  displayName: string
  profileImageUrl: string
  viewCount: number
  followerCount: number
  lastFetched: string
}

type TikTokData = {
  displayName: string | null
  avatarUrl: string | null
  followerCount: number
  likesCount: number
  videoCount: number
  engagementRate: number | null
  lastFetched: string
}

// Tolérant aux espaces/casse de la variable d'env (build-time, NEXT_PUBLIC).
const TIKTOK_ENABLED = (process.env.NEXT_PUBLIC_TIKTOK_ENABLED ?? '').trim().toLowerCase() === 'true'

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
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  )
  return null
}

// Scopes YouTube (sensibles) demandés UNIQUEMENT lors de la connexion de la chaîne,
// pas au login. Autorisation incrémentale via le 3e argument de signIn().
const YOUTUBE_AUTH_PARAMS = {
  scope: 'openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
  access_type: 'offline',
  prompt: 'consent',
}

// Ligne plateforme — style light premium (logo teinté marque, stats alignées, statut discret).
type RowStat = { value: string; label: string }

function PlatformRow(props: {
  icon: React.ReactNode
  name: string
  brandTint: string
  connectColor: string
  accountName?: string | null
  connected: boolean
  loading?: boolean
  stats?: RowStat[]
  error?: string
  errorAction?: React.ReactNode
  onConnect?: () => void
  onDisconnect?: () => void
  disconnecting?: boolean
  connectLabel: string
}) {
  const { icon, name, brandTint, connectColor, accountName, connected, loading, stats = [], error, errorAction, onConnect, onDisconnect, disconnecting, connectLabel } = props
  const subtitle = loading ? 'Chargement…' : connected ? (accountName ?? 'Connecté') : 'Non connecté'
  return (
    <div style={{
      background: connected ? CARD : SURFACE,
      border: connected ? `1px solid ${BORDER}` : '1px dashed #3a3a36',
      borderRadius: '12px', padding: '14px 16px',
      boxShadow: connected ? '0 1px 2px rgba(15,15,15,0.04)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '13px', minWidth: 0 }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: connected ? brandTint : '#2a2a28', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: connected ? TEXT : TEXT2, fontFamily: SYNE }}>{name}</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: MUTED, fontFamily: SYNE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexShrink: 0 }}>
          {connected && stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: TEXT, fontFamily: NUM, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
              <p style={{ margin: '1px 0 0', fontSize: '11px', color: MUTED, fontFamily: SYNE }}>{s.label}</p>
            </div>
          ))}
          {connected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: GREEN_DK, fontWeight: 600, fontFamily: SYNE }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACCENT }} />Relié
              </span>
              {onDisconnect && (
                <button onClick={onDisconnect} disabled={disconnecting} style={{ background: 'none', border: 'none', cursor: disconnecting ? 'wait' : 'pointer', color: MUTED, fontSize: '12px', fontFamily: SYNE, padding: 0 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = MUTED }}>
                  {disconnecting ? '…' : 'Déconnecter'}
                </button>
              )}
            </div>
          ) : !loading && !error && onConnect ? (
            <button onClick={onConnect} style={{ border: `1px solid ${connectColor}`, background: connectColor, color: '#fff', fontSize: '13px', fontWeight: 600, padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontFamily: SYNE, transition: 'opacity 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
              {connectLabel}
            </button>
          ) : null}
        </div>
      </div>
      {error && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#f87171', fontFamily: SYNE }}>⚠ {error}</span>
          {errorAction}
        </div>
      )}
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, update: updateSession } = useSession()

  const [ytData, setYtData] = useState<YTData | null>(() => {
    try { const s = localStorage.getItem('sponsorable_yt_data'); return s ? JSON.parse(s) as YTData : null } catch { return null }
  })
  const [ytLoading, setYtLoading] = useState(false)
  const [ytError, setYtError] = useState('')
  const [ytNeedsReauth, setYtNeedsReauth] = useState(false)
  const [ytReauthLoading, setYtReauthLoading] = useState(false)

  const [twitchData, setTwitchData] = useState<TwitchData | null>(() => {
    try { const s = localStorage.getItem('sponsorable_twitch_data'); return s ? JSON.parse(s) as TwitchData : null } catch { return null }
  })
  const [twitchLoading, setTwitchLoading] = useState(false)
  const [twitchError, setTwitchError] = useState('')

  const [tiktokData, setTiktokData] = useState<TikTokData | null>(() => {
    try { const s = localStorage.getItem('sponsorable_tiktok_data'); return s ? JSON.parse(s) as TikTokData : null } catch { return null }
  })
  const [tiktokLoading, setTiktokLoading] = useState(false)
  const [tiktokError, setTiktokError] = useState('')

  const [ytDisconnecting, setYtDisconnecting] = useState(false)
  const [twitchDisconnecting, setTwitchDisconnecting] = useState(false)
  const [tiktokDisconnecting, setTiktokDisconnecting] = useState(false)
  const [publicPseudo, setPublicPseudo] = useState('')

  // silent : auto-réparation au chargement — ne montre ni spinner ni erreur réseau,
  // mais conserve l'état actionnable (données, besoin de reconnexion de scopes).
  const fetchYouTube = async (silent = false) => {
    if (!silent) { setYtLoading(true); setYtError(''); setYtNeedsReauth(false) }
    try {
      const res = await fetch('/api/youtube/channel', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'INSUFFICIENT_SCOPES') {
          setYtNeedsReauth(true)
          setYtError('Permissions YouTube manquantes — reconnexion requise.')
        } else if (!silent && res.status !== 404) {
          setYtError(data.error ?? 'Erreur inconnue')
        }
      } else {
        setYtData(data)
        localStorage.setItem('sponsorable_yt_data', JSON.stringify(data))
        // Rafraîchir la session pour mettre à jour la photo de profil (priorité YouTube)
        await updateSession()
      }
    } catch {
      if (!silent) setYtError('Erreur réseau')
    } finally {
      if (!silent) setYtLoading(false)
    }
  }

  const handleYouTubeReauth = async () => {
    setYtReauthLoading(true)
    try {
      // Supprimer l'ancien token Google (scopes insuffisants)
      await fetch('/api/platforms/google-reauth', { method: 'DELETE' })
    } catch { /* continue */ }
    // Lancer un nouveau OAuth Google avec tous les scopes YouTube + prompt consent
    signIn('google', { callbackUrl: '/dashboard?connected=youtube' }, YOUTUBE_AUTH_PARAMS)
  }

  const fetchTwitch = async (silent = false) => {
    if (!silent) { setTwitchLoading(true); setTwitchError('') }
    try {
      const res = await fetch('/api/twitch/channel', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        if (!silent && res.status !== 404) setTwitchError(data.error ?? 'Erreur inconnue')
      } else {
        setTwitchData(data)
        localStorage.setItem('sponsorable_twitch_data', JSON.stringify(data))
        // Rafraîchir la session pour mettre à jour la photo de profil (si pas de YouTube)
        await updateSession()
      }
    } catch {
      if (!silent) setTwitchError('Erreur réseau')
    } finally {
      if (!silent) setTwitchLoading(false)
    }
  }

  const fetchTikTok = async (silent = false) => {
    if (!silent) { setTiktokLoading(true); setTiktokError('') }
    try {
      const res = await fetch('/api/tiktok/channel', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        if (!silent && res.status !== 404) setTiktokError(data.error ?? 'Erreur inconnue')
      } else {
        setTiktokData(data)
        localStorage.setItem('sponsorable_tiktok_data', JSON.stringify(data))
        await updateSession()
      }
    } catch {
      if (!silent) setTiktokError('Erreur réseau')
    } finally {
      if (!silent) setTiktokLoading(false)
    }
  }

  const disconnectPlatform = async (type: 'youtube' | 'twitch' | 'tiktok') => {
    if (type === 'youtube') setYtDisconnecting(true)
    else if (type === 'twitch') setTwitchDisconnecting(true)
    else setTiktokDisconnecting(true)
    try {
      const res = await fetch(`/api/platforms/${type}`, { method: 'DELETE' })
      if (!res.ok) {
        console.error(`[disconnect] ${type} failed:`, res.status)
        return
      }
      if (type === 'youtube') {
        setYtData(null)
        localStorage.removeItem('sponsorable_yt_data')
      } else if (type === 'twitch') {
        setTwitchData(null)
        localStorage.removeItem('sponsorable_twitch_data')
      } else {
        setTiktokData(null)
        localStorage.removeItem('sponsorable_tiktok_data')
      }
      // Rafraîchir la session pour mettre à jour la photo de profil
      await updateSession()
    } catch (err) {
      console.error(`[disconnect] ${type} error:`, err)
    } finally {
      if (type === 'youtube') setYtDisconnecting(false)
      else if (type === 'twitch') setTwitchDisconnecting(false)
      else setTiktokDisconnecting(false)
    }
  }

  // On mount: load slug + only show platforms that have a Platform record in DB
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.profile?.slug) setPublicPseudo(data.profile.slug) })
      .catch(() => {})

    // Check which platforms are explicitly connected (Platform record exists).
    // Si la Platform manque mais qu'un compte OAuth est lié, on la recrée
    // silencieusement via la route channel (auto-réparation après un retour OAuth
    // qui n'aurait pas créé la Platform).
    fetch('/api/platforms/youtube', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.platform?.stats) {
          setYtData(data.platform.stats as YTData)
          localStorage.setItem('sponsorable_yt_data', JSON.stringify(data.platform.stats))
        } else {
          fetchYouTube(true)
        }
      }).catch(() => {})

    fetch('/api/platforms/twitch', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.platform?.stats) {
          setTwitchData(data.platform.stats as TwitchData)
          localStorage.setItem('sponsorable_twitch_data', JSON.stringify(data.platform.stats))
        } else {
          fetchTwitch(true)
        }
      }).catch(() => {})

    if (TIKTOK_ENABLED) {
      fetch('/api/platforms/tiktok', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.platform?.stats) {
            setTiktokData(data.platform.stats as TikTokData)
            localStorage.setItem('sponsorable_tiktok_data', JSON.stringify(data.platform.stats))
          } else {
            fetchTikTok(true)
          }
        }).catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // After OAuth redirect: fetch live data and create/update Platform record
  useEffect(() => {
    if (!session?.user?.id) return
    const connected = searchParams.get('connected')
    if (connected === 'youtube') {
      fetchYouTube()
      router.replace('/dashboard')
    } else if (connected === 'twitch') {
      fetchTwitch()
      router.replace('/dashboard')
    } else if (connected === 'tiktok') {
      fetchTikTok()
      router.replace('/dashboard')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, searchParams])

  const displayName = session?.user?.name ?? ytData?.title ?? 'toi'

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <Sidebar theme="dark" />
      <main className="dash-main" style={{ marginLeft: '240px', padding: '40px 48px', minHeight: '100vh', background: BG }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '13px', color: MUTED, marginBottom: '4px', fontFamily: SYNE }}>Bon retour, {displayName} 👋</p>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: TEXT, letterSpacing: '-0.02em', fontFamily: DISPLAY, margin: 0 }}>Tableau de bord</h1>
            {!ytData && !twitchData && (
              <p style={{ fontSize: '14px', color: TEXT2, fontFamily: SYNE, marginTop: '8px' }}>Connecte tes plateformes pour voir tes stats</p>
            )}
          </div>
          {publicPseudo && (
            <button onClick={() => router.push(`/${publicPseudo}`)} style={{ border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: '14px', fontWeight: 500, padding: '9px 16px', borderRadius: '9px', cursor: 'pointer', fontFamily: SYNE, transition: 'background 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = SURFACE }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = CARD }}>
              Voir ma page →
            </button>
          )}
        </div>

        {/* Plateformes */}
        <div style={{ marginBottom: '36px', maxWidth: '620px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT2, fontFamily: SYNE }}>Plateformes connectées</span>
            <span style={{ fontSize: '12px', color: MUTED, fontFamily: SYNE }}>
              {[ytData, twitchData, TIKTOK_ENABLED ? tiktokData : null].filter(Boolean).length} / {TIKTOK_ENABLED ? 3 : 2} reliées
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            <PlatformRow
              icon={<PlatformIcon id="youtube" color={ytData ? '#f0504d' : '#6f6e6a'} />}
              name="YouTube" brandTint="rgba(240,80,77,0.16)" connectColor="#f0504d"
              connected={!!ytData} loading={ytLoading} accountName={ytData?.title}
              stats={ytData ? [{ value: fmtNum(ytData.subscriberCount), label: 'abonnés' }, { value: fmtNum(ytData.viewCount), label: 'vues totales' }] : []}
              error={ytError || undefined}
              errorAction={ytNeedsReauth ? (
                <button onClick={handleYouTubeReauth} disabled={ytReauthLoading} style={{ border: 'none', background: '#f0504d', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '7px 12px', borderRadius: '8px', cursor: ytReauthLoading ? 'wait' : 'pointer', fontFamily: SYNE }}>
                  {ytReauthLoading ? 'Reconnexion…' : 'Reconnecter Google →'}
                </button>
              ) : undefined}
              onDisconnect={() => disconnectPlatform('youtube')} disconnecting={ytDisconnecting}
              onConnect={async () => { await fetch('/api/platforms/google-reauth', { method: 'DELETE' }).catch(() => {}); signIn('google', { callbackUrl: '/dashboard?connected=youtube' }, YOUTUBE_AUTH_PARAMS) }}
              connectLabel="Connecter"
            />

            <PlatformRow
              icon={<PlatformIcon id="twitch" color={twitchData ? '#a87cff' : '#6f6e6a'} />}
              name="Twitch" brandTint="rgba(168,124,255,0.16)" connectColor="#a87cff"
              connected={!!twitchData} loading={twitchLoading} accountName={twitchData?.displayName}
              stats={twitchData ? [{ value: fmtNum(twitchData.followerCount), label: 'followers' }, ...(twitchData.viewCount > 0 ? [{ value: fmtNum(twitchData.viewCount), label: 'vues canal' }] : [])] : []}
              error={twitchError || undefined}
              onDisconnect={() => disconnectPlatform('twitch')} disconnecting={twitchDisconnecting}
              onConnect={() => signIn('twitch', { callbackUrl: '/dashboard?connected=twitch' })}
              connectLabel="Connecter"
            />

            {TIKTOK_ENABLED && (
              <PlatformRow
                icon={<PlatformIcon id="tiktok" color={tiktokData ? '#ededec' : '#6f6e6a'} />}
                name="TikTok" brandTint="rgba(255,255,255,0.08)" connectColor="#fe2c55"
                connected={!!tiktokData} loading={tiktokLoading} accountName={tiktokData?.displayName ?? undefined}
                stats={tiktokData ? [{ value: fmtNum(tiktokData.followerCount), label: 'followers' }, ...(tiktokData.engagementRate != null ? [{ value: `${tiktokData.engagementRate}%`, label: 'engagement' }] : [])] : []}
                error={tiktokError || undefined}
                onDisconnect={() => disconnectPlatform('tiktok')} disconnecting={tiktokDisconnecting}
                onConnect={() => signIn('tiktok', { callbackUrl: '/dashboard?connected=tiktok' })}
                connectLabel="Connecter"
              />
            )}

          </div>
        </div>

        {/* Lien public */}
        <div style={{ maxWidth: '620px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT2, fontFamily: SYNE }}>Ton lien public</span>
          {publicPseudo ? (
            <div style={{ marginTop: '12px', background: '#1e2620', border: '1px solid #2c3a30', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', color: TEXT, fontFamily: SYNE }}>sponsorable.fr/<span style={{ fontWeight: 600 }}>{publicPseudo}</span></span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => navigator.clipboard.writeText(`https://sponsorable.fr/${publicPseudo}`)} style={{ border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: '13px', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: SYNE }}><Copy size={15} />Copier</button>
                <button onClick={() => router.push(`/${publicPseudo}`)} style={{ border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: '13px', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: SYNE }}><ExternalLink size={15} />Voir</button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '12px', background: SURFACE, border: '1px dashed #3a3a36', borderRadius: '12px', padding: '14px 16px' }}>
              <span style={{ fontSize: '14px', color: MUTED, fontFamily: SYNE }}>Configure ton pseudo dans le media kit pour obtenir ton lien →</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginTop: '16px' }}>
            <button onClick={() => publicPseudo ? router.push(`/${publicPseudo}`) : router.push('/dashboard/mediakit')} style={{ border: 'none', background: ACCENT, color: '#fff', fontSize: '14px', fontWeight: 600, padding: '10px 18px', borderRadius: '9px', cursor: 'pointer', fontFamily: SYNE, transition: 'opacity 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>Voir ma page →</button>
            {publicPseudo ? (
              <a href={`/${publicPseudo}?print=1`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '9px', border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: '14px', fontWeight: 500, textDecoration: 'none', cursor: 'pointer', fontFamily: SYNE }}>
                Télécharger PDF
              </a>
            ) : (
              <button onClick={() => router.push('/dashboard/mediakit')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '9px', border: `1px solid ${BORDER}`, background: CARD, color: TEXT2, fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: SYNE }}>
                Télécharger PDF
                <span style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '9999px', padding: '1px 8px', fontSize: '10px', fontWeight: 600, color: MUTED, fontFamily: SYNE }}>Configurer pseudo d&apos;abord</span>
              </button>
            )}
          </div>
        </div>

      </main>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}
