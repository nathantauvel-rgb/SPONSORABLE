import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales — Sponsorable',
  description: 'Mentions légales du site Sponsorable.',
}

// ⚠️ À COMPLÉTER avec tes vraies informations légales avant le lancement.
const wrap: React.CSSProperties = {
  maxWidth: '760px', margin: '0 auto', padding: '64px 24px',
  fontFamily: 'system-ui, sans-serif', color: '#1e293b', lineHeight: 1.7,
}
const h1: React.CSSProperties = { fontSize: '32px', fontWeight: 800, marginBottom: '8px' }
const h2: React.CSSProperties = { fontSize: '20px', fontWeight: 700, margin: '32px 0 8px' }

export default function MentionsLegalesPage() {
  return (
    <main style={wrap}>
      <Link href="/" style={{ color: '#16a34a', fontWeight: 600, fontSize: '14px' }}>← Retour</Link>
      <h1 style={h1}>Mentions légales</h1>
      <p style={{ color: '#64748b', fontSize: '14px' }}>Dernière mise à jour : à compléter</p>

      <h2 style={h2}>Éditeur du site</h2>
      <p>
        Le site Sponsorable est édité par&nbsp;:<br />
        <strong>[Nom / Raison sociale]</strong><br />
        [Statut juridique — ex. entrepreneur individuel / SAS]<br />
        [Adresse postale]<br />
        SIRET&nbsp;: [numéro SIRET]<br />
        Email&nbsp;: [email de contact]<br />
        Directeur de la publication&nbsp;: [Nom]
      </p>

      <h2 style={h2}>Hébergement</h2>
      <p>
        Le site est hébergé par&nbsp;:<br />
        <strong>Vercel Inc.</strong><br />
        340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis<br />
        https://vercel.com<br /><br />
        Base de données hébergée par <strong>Supabase</strong> (https://supabase.com).
      </p>

      <h2 style={h2}>Propriété intellectuelle</h2>
      <p>
        L'ensemble des contenus présents sur le site (textes, graphismes, logo) sont la propriété
        de l'éditeur, sauf mention contraire. Toute reproduction non autorisée est interdite.
      </p>

      <h2 style={h2}>Données personnelles</h2>
      <p>
        Le traitement de tes données personnelles est décrit dans notre{' '}
        <Link href="/confidentialite" style={{ color: '#16a34a', fontWeight: 600 }}>
          Politique de confidentialité
        </Link>.
      </p>
    </main>
  )
}
