import Link from 'next/link'

const linkStyle: React.CSSProperties = {
  color: '#94a3b8',
  textDecoration: 'none',
}

const Footer = () => (
  <footer
    style={{
      padding: '32px',
      textAlign: 'center',
      color: '#94a3b8',
      fontSize: '14px',
      borderTop: '1px solid rgba(0,0,0,0.06)',
    }}
  >
    <nav
      aria-label="Liens légaux"
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 20px', marginBottom: '14px', fontSize: '13px' }}
    >
      <Link href="/mentions-legales" style={linkStyle}>Mentions légales</Link>
      <Link href="/confidentialite" style={linkStyle}>Confidentialité</Link>
      <Link href="/cgu" style={linkStyle}>CGU / CGV</Link>
      <a href="mailto:contact@sponsorable.fr" style={linkStyle}>Contact</a>
    </nav>
    Sponsorable · Fait pour les créateurs gaming FR 🎮 · © {new Date().getFullYear()}
  </footer>
)

export default Footer
