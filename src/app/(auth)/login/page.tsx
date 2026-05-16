export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '20px', padding: '48px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontWeight: 700, fontSize: '22px', color: '#16a34a', letterSpacing: '-0.01em' }}>Sponsorable</span>
          <p style={{ fontSize: '15px', color: '#475569', marginTop: '8px' }}>Connecte-toi pour accéder à ton media kit</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a
            href="/api/auth/signin/google"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px 20px', background: 'white', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '15px', fontWeight: 600, color: '#0f172a', textDecoration: 'none', transition: 'all 150ms ease', cursor: 'pointer' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continuer avec Google
          </a>
          <a
            href="/api/auth/signin/twitch"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px 20px', background: '#9146ff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, color: 'white', textDecoration: 'none', transition: 'all 150ms ease', cursor: 'pointer' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>
            Continuer avec Twitch
          </a>
        </div>
        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '24px' }}>
          En continuant, tu acceptes nos conditions d'utilisation et notre politique de confidentialité.
        </p>
      </div>
    </div>
  )
}
