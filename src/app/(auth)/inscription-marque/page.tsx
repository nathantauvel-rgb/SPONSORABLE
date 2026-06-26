'use client'

import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

// Inscription dédiée aux MARQUES (compte accountType='company').
// Email/password uniquement (pas d'OAuth Google ici, réservé aux créateurs).
// Le profil entreprise complet se remplit après connexion, dans /marque/profil.
export default function BrandSignupPage() {
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [devVerifyUrl, setDevVerifyUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: company, email, password, accountType: 'company' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.')
      } else {
        setSuccess('Compte marque créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.')
        if (data.devVerifyUrl) setDevVerifyUrl(data.devVerifyUrl)
      }
    } catch {
      setError('Erreur réseau. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'border-color 150ms',
    boxSizing: 'border-box', background: 'white',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      {/* Panneau gauche — pitch marque (masqué sur mobile via media query inline-safe) */}
      <div className="brand-signup-aside" style={{
        flex: '0 0 45%', background: '#0a0f1a', position: 'relative', overflow: 'hidden',
        flexDirection: 'column', justifyContent: 'space-between', padding: '48px',
      }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(22,163,74,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '32px', height: '32px', background: '#16a34a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '18px', color: 'white', letterSpacing: '-0.02em' }}>Sponsorable</span>
        </Link>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>Espace marques</p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: '20px' }}>
            Trouve les bons<br />créateurs gaming FR.
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: '340px' }}>
            Parcours l&apos;annuaire, filtre par jeu, audience et engagement réel, et contacte directement les créateurs — stats vérifiées, pas de scraping.
          </p>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', position: 'relative', zIndex: 1 }}>© 2026 Sponsorable</p>
      </div>

      {/* Panneau droit — formulaire */}
      <div style={{ flex: 1, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>Créer un compte marque</h1>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              Déjà inscrit ?{' '}
              <Link href="/login" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Se connecter →</Link>
            </p>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '10px' }}>
              Tu es créateur ?{' '}
              <Link href="/login?register=1" style={{ color: '#64748b', fontWeight: 600, textDecoration: 'none' }}>Inscription créateur</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nom de l&apos;entreprise</label>
              <input type="text" placeholder="Ton entreprise" value={company} onChange={e => setCompany(e.target.value)} required
                style={inputStyle} onFocus={e => { e.target.style.borderColor = '#16a34a' }} onBlur={e => { e.target.style.borderColor = '#e2e8f0' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email professionnel</label>
              <input type="email" placeholder="contact@entreprise.com" value={email} onChange={e => setEmail(e.target.value)} required
                style={inputStyle} onFocus={e => { e.target.style.borderColor = '#16a34a' }} onBlur={e => { e.target.style.borderColor = '#e2e8f0' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 caractères" value={password} onChange={e => setPassword(e.target.value)} required
                  style={{ ...inputStyle, padding: '11px 40px 11px 14px' }} onFocus={e => { e.target.style.borderColor = '#16a34a' }} onBlur={e => { e.target.style.borderColor = '#e2e8f0' }} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>8 caractères min., avec majuscule, minuscule, chiffre et caractère spécial.</p>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#dc2626' }}>{error}</div>
            )}
            {success && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#16a34a', lineHeight: 1.5 }}>
                {success}
                {devVerifyUrl && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #bbf7d0' }}>
                    <a href={devVerifyUrl} style={{ color: '#15803d', fontWeight: 600, wordBreak: 'break-all' }}>Confirmer mon email (dev) →</a>
                  </div>
                )}
                <div style={{ marginTop: '8px' }}>
                  <Link href="/login" style={{ color: '#15803d', fontWeight: 600, textDecoration: 'none' }}>Aller à la connexion →</Link>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: loading ? '#86efac' : '#16a34a', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 150ms', marginTop: '4px', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#15803d' }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#16a34a' }}>
              {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
              Créer mon compte marque
            </button>
          </form>

          <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>
            En continuant, tu acceptes nos{' '}
            <a href="/cgu" target="_blank" rel="noopener" style={{ color: '#64748b', textDecoration: 'underline' }}>conditions</a>
            {' '}et notre{' '}
            <a href="/confidentialite" target="_blank" rel="noopener" style={{ color: '#64748b', textDecoration: 'underline' }}>politique de confidentialité</a>.
          </p>
        </div>
      </div>

      {/* Masque le panneau gauche sur mobile (cohérent avec /login) */}
      <style>{`
        .brand-signup-aside { display: flex; }
        @media (max-width: 768px) { .brand-signup-aside { display: none !important; } }
      `}</style>
    </div>
  )
}
