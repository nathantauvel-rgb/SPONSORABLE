import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions générales — Sponsorable',
  description: "Conditions générales d'utilisation et de vente du service Sponsorable.",
}

// ⚠️ À COMPLÉTER avec tes vraies informations légales avant le lancement
// (mêmes champs que /mentions-legales : raison sociale, email de contact).
const wrap: React.CSSProperties = {
  maxWidth: '760px', margin: '0 auto', padding: '64px 24px',
  fontFamily: 'system-ui, sans-serif', color: '#1e293b', lineHeight: 1.7,
}
const h1: React.CSSProperties = { fontSize: '32px', fontWeight: 800, marginBottom: '8px' }
const h2: React.CSSProperties = { fontSize: '20px', fontWeight: 700, margin: '32px 0 8px' }

export default function CguPage() {
  return (
    <main style={wrap}>
      <Link href="/" style={{ color: '#16a34a', fontWeight: 600, fontSize: '14px' }}>← Retour</Link>
      <h1 style={h1}>Conditions générales d&apos;utilisation et de vente</h1>
      <p style={{ color: '#64748b', fontSize: '14px' }}>Dernière mise à jour : à compléter</p>

      <h2 style={h2}>1. Objet</h2>
      <p>
        Les présentes conditions encadrent l&apos;utilisation du service <strong>Sponsorable</strong>
        {' '}(le «&nbsp;Service&nbsp;»), édité par <strong>[Nom / Raison sociale]</strong>, accessible sur{' '}
        <strong>https://sponsorable.fr</strong>. Le Service permet aux créateurs de contenu de générer
        un media kit en ligne à partir de leurs statistiques YouTube et Twitch, et de le partager via
        une page publique.
      </p>
      <p>
        En créant un compte, tu acceptes ces conditions sans réserve.
      </p>

      <h2 style={h2}>2. Compte</h2>
      <p>
        L&apos;inscription nécessite une adresse email valide. Tu dois être majeur, ou mineur avec
        l&apos;accord de ton représentant légal. Tu es responsable de la confidentialité de tes
        identifiants et des actions effectuées depuis ton compte. Tu t&apos;engages à ne connecter que
        des chaînes YouTube ou Twitch dont tu es titulaire.
      </p>

      <h2 style={h2}>3. Description du Service</h2>
      <p>
        Sponsorable récupère tes statistiques via les API officielles de YouTube et Twitch, avec ton
        autorisation explicite (OAuth). Les statistiques affichées proviennent de ces services tiers&nbsp;:
        Sponsorable les restitue fidèlement mais ne garantit pas leur exactitude ni leur disponibilité,
        qui dépendent de ces plateformes.
      </p>

      <h2 style={h2}>4. Offre gratuite et abonnement Pro</h2>
      <p>
        Le Service propose une offre gratuite et un abonnement payant («&nbsp;Pro&nbsp;»). Les prix et
        le détail des fonctionnalités de chaque offre sont indiqués sur la page d&apos;accueil au moment
        de la souscription, en euros toutes taxes comprises.
      </p>
      <ul>
        <li><strong>Essai gratuit</strong>&nbsp;: les fonctionnalités Pro sont offertes pendant 14 jours
          après la création du compte, sans carte bancaire. À l&apos;issue de l&apos;essai, le compte
          bascule automatiquement sur l&apos;offre gratuite, sans aucun prélèvement.</li>
        <li><strong>Paiement</strong>&nbsp;: l&apos;abonnement est réglé par carte bancaire via notre
          prestataire <strong>Stripe</strong>. Sponsorable ne stocke aucune donnée de carte.</li>
        <li><strong>Renouvellement</strong>&nbsp;: l&apos;abonnement se renouvelle tacitement à chaque
          échéance (mensuelle ou annuelle selon la formule choisie).</li>
        <li><strong>Résiliation</strong>&nbsp;: tu peux résilier à tout moment depuis tes paramètres
          («&nbsp;Gérer mon abonnement&nbsp;»). La résiliation prend effet à la fin de la période déjà
          payée, qui reste due&nbsp;; aucun remboursement au prorata n&apos;est effectué.</li>
      </ul>

      <h2 style={h2}>5. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L221-28 du Code de la consommation, en souscrivant l&apos;abonnement
        Pro tu demandes son exécution immédiate et tu reconnais renoncer à ton droit de rétractation de
        14 jours pour les contenus et services numériques fournis immédiatement. L&apos;essai gratuit de
        14 jours te permet de tester l&apos;intégralité du Service avant tout paiement.
      </p>

      <h2 style={h2}>6. Contenu publié</h2>
      <p>
        Tu restes propriétaire des contenus que tu publies sur ton media kit (bio, photo, partenariats
        passés…). Tu garantis qu&apos;ils sont exacts, que tu disposes des droits nécessaires, et
        qu&apos;ils ne sont ni trompeurs (fausses statistiques, faux partenariats) ni illicites.
        Sponsorable peut retirer un contenu manifestement illicite ou trompeur et suspendre le compte
        concerné après notification.
      </p>

      <h2 style={h2}>7. Disponibilité et responsabilité</h2>
      <p>
        Sponsorable est fourni «&nbsp;en l&apos;état&nbsp;» avec un objectif de disponibilité maximale,
        sans garantie d&apos;absence d&apos;interruption. Sponsorable est un outil de présentation&nbsp;:
        il ne garantit ni l&apos;obtention de partenariats, ni le sérieux des marques qui te contactent
        via ton media kit. La responsabilité de l&apos;éditeur est limitée aux sommes versées au titre
        de l&apos;abonnement sur les 12 derniers mois.
      </p>

      <h2 style={h2}>8. Données personnelles</h2>
      <p>
        Le traitement de tes données est décrit dans la{' '}
        <Link href="/confidentialite" style={{ color: '#16a34a', fontWeight: 600 }}>
          Politique de confidentialité
        </Link>. Tu peux supprimer ton compte et l&apos;ensemble de tes données à tout moment depuis
        tes paramètres&nbsp;; l&apos;abonnement en cours est alors annulé.
      </p>

      <h2 style={h2}>9. Modification des conditions</h2>
      <p>
        Ces conditions peuvent évoluer. En cas de changement substantiel, tu en seras informé par email
        ou via le Service au moins 15 jours avant l&apos;entrée en vigueur. La poursuite de
        l&apos;utilisation vaut acceptation.
      </p>

      <h2 style={h2}>10. Droit applicable et litiges</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de litige, une solution
        amiable sera recherchée en priorité&nbsp;: contacte-nous à <strong>[email de contact]</strong>.
        Conformément aux articles L611-1 et suivants du Code de la consommation, tu peux recourir
        gratuitement à un médiateur de la consommation&nbsp;: <strong>[médiateur à désigner]</strong>.
        À défaut, les tribunaux français sont compétents.
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
