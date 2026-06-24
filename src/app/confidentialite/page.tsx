import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Sponsorable',
  description: 'Comment Sponsorable collecte et traite tes données personnelles.',
}

const wrap: React.CSSProperties = {
  maxWidth: '760px', margin: '0 auto', padding: '64px 24px',
  fontFamily: 'system-ui, sans-serif', color: '#1e293b', lineHeight: 1.7,
}
const h1: React.CSSProperties = { fontSize: '32px', fontWeight: 800, marginBottom: '8px' }
const h2: React.CSSProperties = { fontSize: '20px', fontWeight: 700, margin: '32px 0 8px' }

export default function ConfidentialitePage() {
  return (
    <main style={wrap}>
      <Link href="/" style={{ color: '#16a34a', fontWeight: 600, fontSize: '14px' }}>← Retour</Link>
      <h1 style={h1}>Politique de confidentialité</h1>
      <p style={{ color: '#64748b', fontSize: '14px' }}>Dernière mise à jour : 24 juin 2026</p>

      <h2 style={h2}>Responsable du traitement</h2>
      <p>
        Le responsable du traitement est <strong>Nathan Tauvel</strong> (entrepreneur individuel,
        SIREN 913&nbsp;584&nbsp;520), joignable à <strong>nathan@sponsorable.fr</strong>.
      </p>

      <h2 style={h2}>Données collectées</h2>
      <ul>
        <li><strong>Compte</strong>&nbsp;: email, nom, mot de passe (chiffré), photo de profil.</li>
        <li><strong>Plateformes connectées</strong>&nbsp;: statistiques publiques YouTube/Twitch
          récupérées via API officielle (abonnés, vues, etc.) après ton autorisation.</li>
        <li><strong>Messages sponsors</strong>&nbsp;: contenu des demandes envoyées via ton media kit,
          ainsi que l&apos;email de contact laissé par le sponsor (transmis uniquement au créateur concerné
          pour lui permettre de répondre).</li>
        <li><strong>Mesure d'audience</strong>&nbsp;: pays et page référente des visites de ton media kit
          (données <strong>anonymes</strong> — nous ne stockons ni adresse IP ni user-agent), uniquement
          si tu as accepté les cookies de mesure d'audience.</li>
      </ul>

      <h2 style={h2}>Finalités</h2>
      <p>
        Tes données servent à&nbsp;: créer et gérer ton compte, afficher ton media kit public,
        récupérer tes statistiques, te transmettre les demandes de sponsors, gérer ton abonnement,
        et mesurer l'audience de façon anonyme.
      </p>

      <h2 style={h2}>Base légale</h2>
      <p>
        Exécution du contrat (fourniture du service), ton consentement (connexion des plateformes,
        cookies de mesure d'audience) et notre intérêt légitime (sécurité, prévention de la fraude).
      </p>

      <h2 style={h2}>Sous-traitants</h2>
      <ul>
        <li><strong>Vercel</strong> — hébergement</li>
        <li><strong>Supabase</strong> — base de données</li>
        <li><strong>Stripe</strong> — paiements (abonnement Pro)</li>
        <li><strong>Resend</strong> — envoi d'emails</li>
        <li><strong>Google / Twitch</strong> — connexion OAuth et récupération des statistiques</li>
      </ul>

      <h2 style={h2}>Durée de conservation</h2>
      <p>
        Tes données de compte sont conservées tant que ton compte est actif. Tu peux supprimer ton
        compte à tout moment depuis tes paramètres&nbsp;: l'ensemble de tes données est alors effacé.
      </p>

      <h2 style={h2}>Tes droits</h2>
      <p>
        Conformément au RGPD, tu disposes d'un droit d'accès, de rectification, d'effacement,
        d'opposition et de portabilité. Pour les exercer, contacte-nous à <strong>nathan@sponsorable.fr</strong>.
        Tu peux aussi introduire une réclamation auprès de la CNIL (www.cnil.fr).
      </p>

      <h2 style={h2}>Cookies</h2>
      <p>
        Le site utilise des cookies strictement nécessaires (session/connexion, exemptés de consentement)
        et, sous réserve de ton accord via le bandeau, des cookies de mesure d'audience anonyme. Tu peux
        modifier ton choix en vidant les données du site dans ton navigateur.
      </p>

      <p style={{ marginTop: '32px' }}>
        Voir aussi nos{' '}
        <Link href="/mentions-legales" style={{ color: '#16a34a', fontWeight: 600 }}>
          mentions légales
        </Link>.
      </p>
    </main>
  )
}
