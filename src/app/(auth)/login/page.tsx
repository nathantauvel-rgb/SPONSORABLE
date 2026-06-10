'use client'

import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [devVerifyUrl, setDevVerifyUrl] = useState('')
  const [showResend, setShowResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('register') === '1') setMode('register')
    const emailParam = searchParams.get('email')
    if (emailParam) setEmail(emailParam)
    if (searchParams.get('verified') === '1') {
      setSuccess('Email confirmé ✓ Entre ton mot de passe pour accéder à ton dashboard.')
    }
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
          body: JSON.stringify({ name, email, password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Une erreur est survenue.')
        } else {
          setSuccess('Compte créé ! Vérifie ta boîte mail pour confirmer ton email, puis connecte-toi.')
          if (data.devVerifyUrl) setDevVerifyUrl(data.devVerifyUrl)
          setMode('login')
        }
      } else {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
          callbackUrl: '/dashboard',
        })
        if (result?.error) {
          const errCode = result.error
          if (errCode === 'EMAIL_NOT_VERIFIED' || errCode?.includes('EMAIL_NOT_VERIFIED')) {
            setError('Tu dois confirmer ton adresse email avant de te connecter.')
            setShowResend(true)
          } else {
            setError('Email ou mot de passe incorrect.')
            setShowResend(false)
          }
        } else {
          router.push('/dashboard')
        }
      }
    } catch {
      setError('Erreur réseau. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes float { 0%, 100% { transform: translateY(0px) } 50% { transform: translateY(-8px) } }
      `}</style>

      {/* Panneau gauche — identité visuelle (masqué sur mobile) */}
      <div style={{
        flex: '0 0 45%', background: '#0a0f1a', position: 'relative', overflow: 'hidden',
        display: isMobile ? 'none' : 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px',
      }}>
        {/* Glows */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(22,163,74,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '50%', height: '50%', background: 'radial-gradient(ellipse, rgba(22,163,74,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '32px', height: '32px', background: '#16a34a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '18px', color: 'white', letterSpacing: '-0.02em' }}>Sponsorable</span>
        </Link>

        {/* Tagline centrale */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>Pour les créateurs FR</p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: '20px' }}>
            Ton media kit pro,<br />en 2 minutes.
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: '320px' }}>
            Connecte YouTube et Twitch. Partage un lien. Les sponsors voient tout ce dont ils ont besoin.
          </p>

          {/* Social proof */}
          <div style={{ marginTop: '36px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { stat: '2 min', label: 'pour créer ton media kit' },
              { stat: '100%', label: 'données réelles, pas de mensonge' },
              { stat: '0€', label: 'pour commencer' },
            ].map(({ stat, label }) => (
              <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#4ade80', minWidth: '52px' }}>{stat}</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', position: 'relative', zIndex: 1 }}>© 2026 Sponsorable</p>
      </div>

      {/* Panneau droit — formulaire */}
      <div style={{ flex: 1, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '32px 20px' : '40px 48px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          {/* Logo (visible sur mobile, car le panneau gauche est masqué) */}
          {isMobile && (
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
              <div style={{ width: '32px', height: '32px', background: '#16a34a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a', letterSpacing: '-0.02em' }}>Sponsorable</span>
            </Link>
          )}

          {/* Titre */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              {mode === 'login' ? 'Bon retour 👋' : 'Créer un compte'}
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              {mode === 'login' ? "Pas encore de compte ? " : "Déjà un compte ? "}
              <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontWeight: 600, fontSize: '14px', padding: 0 }}>
                {mode === 'login' ? "S'inscrire →" : "Se connecter →"}
              </button>
            </p>
          </div>

          {/* OAuth buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px 20px', background: 'white', border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: '#0f172a', cursor: 'pointer', width: '100%', transition: 'all 150ms', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continuer avec Google
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>ou avec ton email</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Pseudo</label>
                <input
                  type="text"
                  placeholder="TonPseudo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box', background: 'white' }}
                  onFocus={e => { e.target.style.borderColor = '#16a34a' }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
                />
              </div>
            )}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email</label>
              <input
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box', background: 'white' }}
                onFocus={e => { e.target.style.borderColor = '#16a34a' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Min. 8 caractères' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '11px 40px 11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box', background: 'white' }}
                  onFocus={e => { e.target.style.borderColor = '#16a34a' }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#dc2626' }}>
                {error}
                {showResend && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #fecaca' }}>
                    <button type="button" disabled={resendLoading}
                      onClick={async () => {
                        setResendLoading(true)
                        try {
                          const res = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
                          const data = await res.json()
                          setError(''); setShowResend(false)
                          if (data.devVerifyUrl) { setSuccess('Lien de confirmation (mode dev) :'); setDevVerifyUrl(data.devVerifyUrl) }
                          else setSuccess('Email de confirmation renvoyé ! Vérifie ta boîte mail.')
                        } catch { setError('Erreur réseau lors du renvoi.') }
                        finally { setResendLoading(false) }
                      }}
                      style={{ background: 'none', border: 'none', cursor: resendLoading ? 'wait' : 'pointer', color: '#dc2626', fontWeight: 600, fontSize: '13px', padding: 0, textDecoration: 'underline' }}>
                      {resendLoading ? 'Envoi…' : "Renvoyer l'email de confirmation →"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {success && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#16a34a', lineHeight: 1.5 }}>
                {success}
                {devVerifyUrl && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #bbf7d0' }}>
                    <a href={devVerifyUrl} style={{ color: '#15803d', fontWeight: 600, wordBreak: 'break-all' }}>Clique ici pour confirmer ton email →</a>
                  </div>
                )}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: loading ? '#86efac' : '#16a34a', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 150ms', marginTop: '4px', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#15803d' }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#16a34a' }}>
              {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>
            En continuant, tu acceptes nos{' '}
            <a href="/cgu" target="_blank" rel="noopener" style={{ color: '#64748b', textDecoration: 'underline' }}>conditions d&apos;utilisation</a>
            {' '}et notre{' '}
            <a href="/confidentialite" target="_blank" rel="noopener" style={{ color: '#64748b', textDecoration: 'underline' }}>politique de confidentialité</a>.
          </p>
        </div>
      </div>
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
