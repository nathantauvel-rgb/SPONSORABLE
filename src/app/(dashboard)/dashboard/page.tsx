'use client'

import { Copy, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/button'
import MetricCard from '@/components/ui/MetricCard'

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

const timeSince = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  return `il y a ${Math.floor(mins / 60)}h`
}

const StatusBadge = ({ connected }: { connected: boolean }) => (
  <span style={{
    borderRadius: '9999px', padding: '3px 12px', fontSize: '12px', fontWeight: 500,
    background: connected ? 'rgba(134,239,172,0.2)' : '#f1f5f9',
    color: connected ? '#15803d' : '#94a3b8',
    border: connected ? '1px solid rgba(134,239,172,0.4)' : 'none',
  }}>
    {connected ? 'Connecté ✓' : 'Non connecté'}
  </span>
)

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [ytData, setYtData] = useState<YTData | null>(null)
  const [ytLoading, setYtLoading] = useState(false)
  const [ytError, setYtError] = useState('')

  const [twitchData, setTwitchData] = useState<TwitchData | null>(null)
  const [twitchLoading, setTwitchLoading] = useState(false)
  const [twitchError, setTwitchError] = useState('')

  const [ytDisconnecting, setYtDisconnecting] = useState(false)
  const [twitchDisconnecting, setTwitchDisconnecting] = useState(false)
  const [publicPseudo, setPublicPseudo] = useState('')

  const fetchYouTube = async () => {
    setYtLoading(true)
    setYtError('')
    try {
      const res = await fetch('/api/youtube/channel')
      const data = await res.json()
      if (!res.ok) {
        setYtError(data.error ?? 'Erreur inconnue')
      } else {
        setYtData(data)
        localStorage.setItem('sponsorable_yt_data', JSON.stringify(data))
      }
    } catch {
      setYtError('Erreur réseau')
    } finally {
      setYtLoading(false)
    }
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
      await fetch(`/api/platforms/${type}`, { method: 'DELETE' })
      if (type === 'youtube') {
        setYtData(null)
        localStorage.removeItem('sponsorable_yt_data')
      } else {
        setTwitchData(null)
        localStorage.removeItem('sponsorable_twitch_data')
      }
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
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', padding: '40px 48px', minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Bonjour {displayName} 👋
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              {ytData ? `YouTube synchronisé ${timeSince(ytData.lastFetched)}` : 'Connecte tes plateformes pour voir tes stats'}
            </p>
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
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Tes plateformes connectées</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '560px' }}>

            {/* YouTube */}
            <div className="card-standard" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <PlatformIcon id="youtube" color={ytData ? '#ef4444' : '#94a3b8'} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>YouTube</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {ytData
                      ? `${ytData.title} · ${fmtNum(ytData.subscriberCount)} abonnés · ${fmtNum(ytData.viewCount)} vues`
                      : ytLoading ? 'Chargement...' : ytError || 'Non connecté'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StatusBadge connected={!!ytData} />
                {ytData ? (
                  <button
                    onClick={() => disconnectPlatform('youtube')}
                    disabled={ytDisconnecting}
                    style={{ fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '9999px', border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.06)', color: '#dc2626', cursor: ytDisconnecting ? 'wait' : 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.12)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.06)' }}
                  >
                    {ytDisconnecting ? '...' : '× Déconnecter'}
                  </button>
                ) : !ytLoading && (
                  <button
                    onClick={() => signIn('google', { callbackUrl: '/dashboard?connected=youtube' }, {
                      scope: 'openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
                      prompt: 'consent',
                      access_type: 'offline',
                    })}
                    style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Connecter →
                  </button>
                )}
              </div>
            </div>

            {ytError && (
              <p style={{ fontSize: '12px', color: '#ef4444', padding: '0 4px' }}>⚠ YouTube : {ytError}</p>
            )}

            {/* Twitch */}
            <div className="card-standard" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <PlatformIcon id="twitch" color={twitchData ? '#9146ff' : '#94a3b8'} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Twitch</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {twitchData
                      ? `${twitchData.displayName} · ${fmtNum(twitchData.followerCount)} followers`
                      : twitchLoading ? 'Chargement...' : twitchError || 'Non connecté'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StatusBadge connected={!!twitchData} />
                {twitchData ? (
                  <button
                    onClick={() => disconnectPlatform('twitch')}
                    disabled={twitchDisconnecting}
                    style={{ fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '9999px', border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.06)', color: '#dc2626', cursor: twitchDisconnecting ? 'wait' : 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.12)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.06)' }}
                  >
                    {twitchDisconnecting ? '...' : '× Déconnecter'}
                  </button>
                ) : !twitchLoading && (
                  <button
                    onClick={() => signIn('twitch', { callbackUrl: '/dashboard?connected=twitch' })}
                    style={{ fontSize: '12px', color: '#9146ff', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Connecter →
                  </button>
                )}
              </div>
            </div>

            {twitchError && (
              <p style={{ fontSize: '12px', color: '#ef4444', padding: '0 4px' }}>⚠ Twitch : {twitchError}</p>
            )}

          </div>
        </div>

        {/* Public link */}
        <div style={{ maxWidth: '560px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Ton lien public</h3>
          <div style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>sponsorable.gg/alexplays</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => navigator.clipboard.writeText('https://sponsorable.gg/alexplays')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }} title="Copier"><Copy size={15} /></button>
              <button onClick={() => router.push('/p/alexplays')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }} title="Ouvrir"><ExternalLink size={15} /></button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="primary" arrow onClick={() => publicPseudo ? router.push(`/${publicPseudo}`) : router.push('/dashboard/mediakit')}>Voir ma page</Button>
            {publicPseudo ? (
              <a
                href={`/${publicPseudo}?print=1`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', background: 'white', color: '#0f172a', fontSize: '14px', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', transition: 'background 150ms' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white' }}
              >
                Télécharger PDF
              </a>
            ) : (
              <Button variant="outline" onClick={() => router.push('/dashboard/mediakit')}>
                Télécharger PDF
                <span style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.10)', borderRadius: '9999px', padding: '1px 8px', fontSize: '10px', fontWeight: 600, color: '#94a3b8', marginLeft: '4px' }}>Configurer pseudo d&apos;abord</span>
              </Button>
            )}
          </div>
        </div>

      </main>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
