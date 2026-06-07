'use client'

import { Copy, ExternalLink } from 'lucide-react'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/button'
import MetricCard from '@/components/ui/MetricCard'

// Design system — dark palette
const BG      = '#0d0d0f'
const SURFACE = '#111318'
const CARD    = '#1c1f26'
const ACCENT  = '#22c55e'
const TEXT    = '#ffffff'
const MUTED   = '#888888'
const BORDER  = '#222222'
const SYNE    = '"Syne", var(--font-syne), system-ui, sans-serif'
const DISPLAY = '"Cabinet Grotesk", var(--font-display), system-ui, sans-serif'
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
  return null
}

// Scopes YouTube (sensibles) demandés UNIQUEMENT lors de la connexion de la chaîne,
// pas au login. Autorisation incrémentale via le 3e argument de signIn().
const YOUTUBE_AUTH_PARAMS = {
  scope: 'openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
  access_type: 'offline',
  prompt: 'consent',
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, update: updateSession } = useSession()

  const [ytData, setYtData] = useState<YTData | null>(null)
  const [ytLoading, setYtLoading] = useState(false)
  const [ytError, setYtError] = useState('')
  const [ytNeedsReauth, setYtNeedsReauth] = useState(false)
  const [ytReauthLoading, setYtReauthLoading] = useState(false)

  const [twitchData, setTwitchData] = useState<TwitchData | null>(null)
  const [twitchLoading, setTwitchLoading] = useState(false)
  const [twitchError, setTwitchError] = useState('')

  const [ytDisconnecting, setYtDisconnecting] = useState(false)
  const [twitchDisconnecting, setTwitchDisconnecting] = useState(false)
  const [publicPseudo, setPublicPseudo] = useState('')

  const fetchYouTube = async () => {
    setYtLoading(true)
    setYtError('')
    setYtNeedsReauth(false)
    try {
      const res = await fetch('/api/youtube/channel')
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'INSUFFICIENT_SCOPES') {
          setYtNeedsReauth(true)
          setYtError('Permissions YouTube manquantes — reconnexion requise.')
        } else {
          setYtError(data.error ?? 'Erreur inconnue')
        }
      } else {
        setYtData(data)
        localStorage.setItem('sponsorable_yt_data', JSON.stringify(data))
        // Rafraîchir la session pour mettre à jour la photo de profil (priorité YouTube)
        await updateSession()
      }
    } catch {
      setYtError('Erreur réseau')
    } finally {
      setYtLoading(false)
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

  const fetchTwitch = async () => {
    setTwitchLoading(true)
    setTwitchError('')
    try {
      const res = await fetch('/api/twitch/channel')
      const data = await res.json()
      if (!res.ok) {
        if (res.status !== 404) setTwitchError(data.error ?? 'Erreur inconnue')
      } else {
        setTwitchData(data)
        localStorage.setItem('sponsorable_twitch_data', JSON.stringify(data))
        // Rafraîchir la session pour mettre à jour la photo de profil (si pas de YouTube)
        await updateSession()
      }
    } catch {
      setTwitchError('Erreur réseau')
    } finally {
      setTwitchLoading(false)
    }
  }

  const disconnectPlatform = async (type: 'youtube' | 'twitch') => {
    if (type === 'youtube') setYtDisconnecting(true)
    else setTwitchDisconnecting(true)
    try {
      const res = await fetch(`/api/platforms/${type}`, { method: 'DELETE' })
      if (!res.ok) {
        console.error(`[disconnect] ${type} failed:`, res.status)
        return
      }
      if (type === 'youtube') {
        setYtData(null)
        localStorage.removeItem('sponsorable_yt_data')
      } else {
        setTwitchData(null)
        localStorage.removeItem('sponsorable_twitch_data')
      }
      // Rafraîchir la session pour mettre à jour la photo de profil
      await updateSession()
    } catch (err) {
      console.error(`[disconnect] ${type} error:`, err)
    } finally {
      if (type === 'youtube') setYtDisconnecting(false)
      else setTwitchDisconnecting(false)
    }
  }

  // On mount: load slug + only show platforms that have a Platform record in DB
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.profile?.slug) setPublicPseudo(data.profile.slug) })
      .catch(() => {})

    // Check which platforms are explicitly connected (Platform record exists)
    fetch('/api/platforms/youtube')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.platform?.stats) {
          setYtData(data.platform.stats as YTData)
          localStorage.setItem('sponsorable_yt_data', JSON.stringify(data.platform.stats))
        }
      }).catch(() => {})

    fetch('/api/platforms/twitch')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.platform?.stats) {
          setTwitchData(data.platform.stats as TwitchData)
          localStorage.setItem('sponsorable_twitch_data', JSON.stringify(data.platform.stats))
        }
      }).catch(() => {})
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
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, searchParams])

  const displayName = session?.user?.name ?? ytData?.title ?? 'toi'

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <Sidebar />
      <main className="dash-main" style={{ marginLeft: '240px', padding: '40px 48px', minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: TEXT, marginBottom: '6px', letterSpacing: '-0.02em', fontFamily: DISPLAY }}>
              Bonjour {displayName} 👋
            </h1>
            {!ytData && (
              <p style={{ fontSize: '14px', color: MUTED, fontFamily: SYNE }}>
                Connecte tes plateformes pour voir tes stats
              </p>
            )}
          </div>
          {publicPseudo && (
            <Button variant="outline" arrow onClick={() => router.push(`/${publicPseudo}`)}>
              Voir ma page
            </Button>
          )}
        </div>

        {/* Metrics — uniquement données réelles */}
        {(ytData || twitchData) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            {ytData && (
              <MetricCard label="Abonnés YouTube" value={fmtNum(ytData.subscriberCount)} change="YouTube" positive />
            )}
            {ytData && (
              <MetricCard label="Vues totales" value={fmtNum(ytData.viewCount)} change={`${fmtNum(ytData.videoCount)} vidéos`} positive />
            )}
            {twitchData && (
              <MetricCard label="Followers Twitch" value={fmtNum(twitchData.followerCount)} change="Twitch" positive />
            )}
            {twitchData && twitchData.viewCount > 0 && (
              <MetricCard label="Vues canal Twitch" value={fmtNum(twitchData.viewCount)} change="Twitch" positive />
            )}
          </div>
        )}

        {/* Platforms */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: TEXT, marginBottom: '16px', fontFamily: SYNE }}>Tes plateformes connectées</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', maxWidth: '560px' }}>

            {/* YouTube */}
            <div style={{
              background: CARD, borderRadius: '16px', overflow: 'hidden',
              border: `1px solid ${BORDER}`,
              borderTop: `4px solid ${ytData ? ACCENT : BORDER}`,
              boxShadow: ytData ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
              transition: 'box-shadow 300ms',
            }}>
              {/* Header */}
              <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: ytData ? 'rgba(239,68,68,0.12)' : SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PlatformIcon id="youtube" color={ytData ? '#ef4444' : '#444'} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, fontFamily: SYNE }}>YouTube</p>
                    <p style={{ fontSize: '12px', color: MUTED, marginTop: '1px', fontFamily: SYNE }}>
                      {ytLoading ? 'Chargement...' : ytData ? ytData.title : 'Non connecté'}
                    </p>
                  </div>
                </div>
                {ytData && (
                  <span style={{ flexShrink: 0, background: 'rgba(34,197,94,0.12)', color: ACCENT, border: '1px solid rgba(34,197,94,0.25)', borderRadius: '9999px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', fontFamily: SYNE }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACCENT, display: 'block' }} />
                    Connecté
                  </span>
                )}
              </div>

              {/* Mini stats */}
              {ytData && (
                <div style={{ padding: '0 18px 14px', display: 'flex', gap: '20px' }}>
                  <div>
                    <p style={{ fontSize: '17px', fontWeight: 600, color: TEXT, letterSpacing: '-0.02em', fontFamily: NUM, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(ytData.subscriberCount)}</p>
                    <p style={{ fontSize: '11px', color: MUTED, marginTop: '1px', fontFamily: SYNE }}>abonnés</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '17px', fontWeight: 600, color: TEXT, letterSpacing: '-0.02em', fontFamily: NUM, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(ytData.viewCount)}</p>
                    <p style={{ fontSize: '11px', color: MUTED, marginTop: '1px', fontFamily: SYNE }}>vues totales</p>
                  </div>
                </div>
              )}

              {/* Action */}
              <div style={{ borderTop: `1px solid ${BORDER}`, padding: '12px 14px' }}>
                {ytError ? (
                  <div style={{ marginBottom: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: ytNeedsReauth ? '8px' : '0', fontFamily: SYNE }}>⚠ {ytError}</p>
                    {ytNeedsReauth && (
                      <button onClick={handleYouTubeReauth} disabled={ytReauthLoading}
                        style={{ width: '100%', padding: '9px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontSize: '13px', fontWeight: 700, cursor: ytReauthLoading ? 'wait' : 'pointer', opacity: ytReauthLoading ? 0.7 : 1, fontFamily: SYNE }}>
                        {ytReauthLoading ? 'Reconnexion...' : 'Reconnecter Google →'}
                      </button>
                    )}
                  </div>
                ) : ytData ? (
                  <button onClick={() => disconnectPlatform('youtube')} disabled={ytDisconnecting}
                    style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: ytDisconnecting ? 'wait' : 'pointer', transition: 'background 150ms', fontFamily: SYNE }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)' }}>
                    {ytDisconnecting ? 'Déconnexion...' : 'Déconnecter'}
                  </button>
                ) : !ytLoading && (
                  <button
                    onClick={async () => {
                      await fetch('/api/platforms/google-reauth', { method: 'DELETE' }).catch(() => {})
                      signIn('google', { callbackUrl: '/dashboard?connected=youtube' }, YOUTUBE_AUTH_PARAMS)
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 150ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontFamily: SYNE }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                    Connecter YouTube
                  </button>
                )}
              </div>
            </div>

            {/* Twitch */}
            <div style={{
              background: CARD, borderRadius: '16px', overflow: 'hidden',
              border: `1px solid ${BORDER}`,
              borderTop: `4px solid ${twitchData ? ACCENT : BORDER}`,
              boxShadow: twitchData ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
              transition: 'box-shadow 300ms',
            }}>
              {/* Header */}
              <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: twitchData ? 'rgba(145,70,255,0.12)' : SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PlatformIcon id="twitch" color={twitchData ? '#9146ff' : '#444'} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, fontFamily: SYNE }}>Twitch</p>
                    <p style={{ fontSize: '12px', color: MUTED, marginTop: '1px', fontFamily: SYNE }}>
                      {twitchLoading ? 'Chargement...' : twitchData ? twitchData.displayName : 'Non connecté'}
                    </p>
                  </div>
                </div>
                {twitchData && (
                  <span style={{ flexShrink: 0, background: 'rgba(34,197,94,0.12)', color: ACCENT, border: '1px solid rgba(34,197,94,0.25)', borderRadius: '9999px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', fontFamily: SYNE }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACCENT, display: 'block' }} />
                    Connecté
                  </span>
                )}
              </div>

              {/* Mini stats */}
              {twitchData && (
                <div style={{ padding: '0 18px 14px', display: 'flex', gap: '20px' }}>
                  <div>
                    <p style={{ fontSize: '17px', fontWeight: 600, color: TEXT, letterSpacing: '-0.02em', fontFamily: NUM, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(twitchData.followerCount)}</p>
                    <p style={{ fontSize: '11px', color: MUTED, marginTop: '1px', fontFamily: SYNE }}>followers</p>
                  </div>
                  {twitchData.viewCount > 0 && (
                    <div>
                      <p style={{ fontSize: '17px', fontWeight: 600, color: TEXT, letterSpacing: '-0.02em', fontFamily: NUM, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(twitchData.viewCount)}</p>
                      <p style={{ fontSize: '11px', color: MUTED, marginTop: '1px', fontFamily: SYNE }}>vues canal</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action */}
              <div style={{ borderTop: `1px solid ${BORDER}`, padding: '12px 14px' }}>
                {twitchError ? (
                  <p style={{ fontSize: '12px', color: '#ef4444', fontFamily: SYNE }}>⚠ {twitchError}</p>
                ) : twitchData ? (
                  <button onClick={() => disconnectPlatform('twitch')} disabled={twitchDisconnecting}
                    style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: twitchDisconnecting ? 'wait' : 'pointer', transition: 'background 150ms', fontFamily: SYNE }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)' }}>
                    {twitchDisconnecting ? 'Déconnexion...' : 'Déconnecter'}
                  </button>
                ) : !twitchLoading && (
                  <button
                    onClick={() => signIn('twitch', { callbackUrl: '/dashboard?connected=twitch' })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#9146ff', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 150ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontFamily: SYNE }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                    Connecter Twitch
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Public link */}
        <div style={{ maxWidth: '560px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: TEXT, marginBottom: '16px', fontFamily: SYNE }}>Ton lien public</h3>
          {publicPseudo ? (
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: TEXT, fontWeight: 500, fontFamily: SYNE }}>sponsorable.gg/{publicPseudo}</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => navigator.clipboard.writeText(`https://sponsorable.gg/${publicPseudo}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }} title="Copier"><Copy size={15} /></button>
                <button onClick={() => router.push(`/${publicPseudo}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }} title="Ouvrir"><ExternalLink size={15} /></button>
              </div>
            </div>
          ) : (
            <div style={{ background: SURFACE, border: `1px dashed ${BORDER}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: MUTED, fontFamily: SYNE }}>Configure ton pseudo dans le media kit pour obtenir ton lien →</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="primary" arrow onClick={() => publicPseudo ? router.push(`/${publicPseudo}`) : router.push('/dashboard/mediakit')}>Voir ma page</Button>
            {publicPseudo ? (
              <a
                href={`/${publicPseudo}?print=1`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: '14px', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', transition: 'background 150ms', fontFamily: SYNE }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = SURFACE }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = CARD }}
              >
                Télécharger PDF
              </a>
            ) : (
              <Button variant="outline" onClick={() => router.push('/dashboard/mediakit')}>
                Télécharger PDF
                <span style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '9999px', padding: '1px 8px', fontSize: '10px', fontWeight: 600, color: MUTED, marginLeft: '4px', fontFamily: SYNE }}>Configurer pseudo d&apos;abord</span>
              </Button>
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
