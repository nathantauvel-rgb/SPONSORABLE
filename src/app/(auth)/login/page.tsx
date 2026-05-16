'use client'

import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (searchParams.get('register') === '1') setMode('register')
    const emailParam = searchParams.get('email')
    if (emailParam) setEmail(emailParam)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, pseudo }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Une erreur est survenue.')
        } else {
          setSuccess('Compte créé ! Vérifie ta boîte mail pour confirmer ton email, puis connecte-toi.')
          setMode('login')
        }
      } else {
        const res = await fetch('/api/auth/callback/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, redirect: false }),
        })
        if (res.ok) {
          router.push('/dashboard')
        } else {
          // Fallback: redirect via NextAuth signin
          const params = new URLSearchParams({ email, password, callbackUrl: '/dashboard' })
          router.push(`/api/auth/signin/credentials?${params}`)
        }
      }
    } catch {
      setError('Erreur réseau. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px' }}>
      <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link href="/" style={{ fontWeight: 700, fontSize: '22px', color: '#16a34a', textDecoration: 'none', letterSpacing: '-0.01em' }}>
            Sponsorable
          </Link>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px' }}>
            {mode === 'login' ? 'Accède à ton media kit' : 'Crée ton compte créateur'}
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', marginBottom: '24px' }}>
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 600, transition: 'all 150ms ease',
                background: mode === m ? 'white' : 'transparent',
                color: mode === m ? '#0f172a' : '#94a3b8',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {m === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          ))}
        </div>

        {/* OAuth buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <a
            href="/api/auth/signin/google"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '11px 20px', background: 'white', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: '#0f172a', textDecoration: 'none', transition: 'background 150ms' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continuer avec Google
          </a>
          <a
            href="/api/auth/signin/twitch"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '11px 20px', background: '#9146ff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: 'white', textDecoration: 'none', transition: 'opacity 150ms' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>
            Continuer avec Twitch
          </a>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>ou avec ton email</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '6px' }}>
                Pseudo / Nom de chaîne
              </label>
              <input
                type="text"
                placeholder="AlexPlays"
                value={pseudo}
                onChange={e => setPseudo(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#16a34a' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#16a34a' }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '6px' }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'register' ? '8 caractères minimum' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 40px 10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#16a34a' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#16a34a' }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '11px', background: loading ? '#86efac' : '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 150ms', marginTop: '4px' }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#15803d' }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#16a34a' }}
          >
            {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
            {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>
          En continuant, tu acceptes nos{' '}
          <span style={{ color: '#475569', textDecoration: 'underline', cursor: 'pointer' }}>conditions d&apos;utilisation</span>
          {' '}et notre{' '}
          <span style={{ color: '#475569', textDecoration: 'underline', cursor: 'pointer' }}>politique de confidentialité</span>.
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
