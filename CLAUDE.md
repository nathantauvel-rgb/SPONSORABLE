@AGENTS.md

---

# Sponsorable — Contexte Projet

## C'est quoi Sponsorable ?

Sponsorable est une plateforme de **media kit dynamique** pour les créateurs de contenu français (YouTube, Twitch).
En 2 minutes, un créateur connecte ses plateformes et obtient un lien public à partager aux marques, avec ses vraies stats vérifiées via API (pas du scraping).

**Tagline** : "Ton media kit pro, en 2 minutes."

**Cible principale** : Créateurs de contenu gaming/streaming francophones (YouTubers, streamers Twitch FR).

**Cible de la landing (positionnement marketing, validé)** : créateurs gaming FR **établis, 10k–200k abonnés**, déjà sollicités par des marques, qui font déjà des deals mais se présentent encore avec un PDF Canva / Drive / screenshots. Angle = **négo/tarif** (« arrête de te brader / de négocier en dessous de ta valeur »), pas « deviens crédible ». Ton **cash, direct, pair à pair**. Le petit créateur (3k–8k) = cible secondaire seulement.

---

## ⚙️ Infra & Prod — RÉCAP IMPORTANT (session juin 2026)

### Dépôt & déploiement
- **On ne travaille QUE sur le dépôt `nathantauvel-rgb/SPONSORABLE`** — c'est désormais le remote **`origin`** (le remote `perso` et le dépôt `shanome-hub` n'existent plus dans la config locale).
- Branches : développement sur **`Test`**, puis merge/fast-forward vers **`main`** = déploiement auto Vercel.
- **Domaine de prod : `sponsorable.fr`** (acheté chez OVH), pointe sur Vercel. `sponsorable.vercel.app` reste actif aussi.

### DNS OVH (pièges rencontrés — à connaître)
- L'apex `sponsorable.fr` doit avoir **uniquement** un `A` → `76.76.21.21` (Vercel) + `www` CNAME → `cname.vercel-dns.com`.
- ⚠️ **Bug résolu** : un enregistrement **AAAA (IPv6) OVH parasite** (`2001:41d0:...`) sur l'apex faisait tomber le site sur OVH (« Site en construction » / erreur cert TLS) en IPv6. **Toujours supprimer tout AAAA/A OVH sur l'apex.**
- Email Resend : MX `send` → `feedback-smtp.eu-west-1.amazonses.com` + TXT `resend._domainkey` (DKIM), `send` (SPF), `_dmarc`.

### Variables d'environnement Vercel (critiques)
- `AUTH_URL=https://sponsorable.fr` (NextAuth + génération des liens email — voir `getAppUrl`).
- `AUTH_SECRET`, `AUTH_GOOGLE_ID/SECRET`, `AUTH_TWITCH_ID/SECRET`.
- `DATABASE_URL` (Supabase, marquée **Sensitive** → non visible/réaffichable dans Vercel ; la récupérer depuis Supabase si besoin).
- `RESEND_API_KEY` + **`EMAIL_FROM=noreply@sponsorable.fr`** (domaine vérifié dans Resend, sinon l'envoi d'email échoue).
- Stripe : `STRIPE_SECRET_KEY`, **`STRIPE_PRICE_ID`** (prix du produit Pro), `STRIPE_WEBHOOK_SECRET`. (Actuellement en clés **Test** ; repasser en **Live** avant lancement public.)
- `REDIS_URL` (rate-limiting ; fail-open si absent).

### Google OAuth (console cloud)
- Écran de consentement **publié (En production)** → tout le monde peut se connecter.
- URIs de redirection autorisés : `https://sponsorable.fr/api/auth/callback/google` + `.../callback/twitch`, idem `sponsorable.vercel.app` + `localhost:3000`. Origines JS : `https://sponsorable.fr` etc.
- **Scopes YouTube découplés du login** : le login Google ne demande que `openid email profile` (non-sensible). Les scopes YouTube (sensibles) sont demandés **à la connexion de chaîne** via le 3e arg de `signIn('google', ..., YOUTUBE_AUTH_PARAMS)`. Évite la vérification Google pour le simple login.

### Stripe — réécrit de zéro (source de vérité unique)
- `src/lib/stripe.ts` : client unique + `mapStripeStatus`. Tout passe par là (plus de `new Stripe()` éparpillé).
- **Un seul webhook : `/api/stripe/webhook`** (l'ancien `/api/webhook/stripe` a été supprimé). Idempotent via table **`StripeEvent`** (créée en DB). Cycle complet : checkout.completed, subscription.created/updated/deleted, invoice.paid/payment_failed.
- Checkout via `STRIPE_PRICE_ID` (produit propre, plus de `price_data` inline). Bloque le double abonnement.
- **Billing Portal** : `/api/stripe/portal` + bouton « Gérer mon abonnement » (settings) pour les abonnés payants.
- Suppression de compte (`/api/me` DELETE) annule l'abonnement Stripe avant delete.

### Essai gratuit 14 jours (signup)
- Logique dans `src/lib/subscription.ts` : `isProUser({status, createdAt})` = abonnement payant **OU** essai actif (≤ 14 j depuis `createdAt`). **Aucune colonne DB ajoutée.**
- `/api/me` expose `isPro`, `isPaid`, `inTrial`, `trialDaysLeft`. Gating cohérent : dashboard, page publique, sidebar.
- Checkout reste possible pendant l'essai (le blocage double-abo ne porte que sur `isProStatus` payant).

### Sécurité / RGPD (audit appliqué)
- Emails : `escapeHtml` sur tout contenu user (contact, resend-verification). Rate-limit sur `/contact`, `/pageview`, `/resend-verification`.
- `/pageview` ne stocke **plus l'IP ni le user-agent** (RGPD). Tracking conditionné au consentement.
- **Cookie banner** (`src/components/CookieBanner.tsx` + `src/lib/consent.ts`) + pages **`/mentions-legales`** et **`/confidentialite`** (⚠️ champs `[À COMPLÉTER]` à remplir : nom, SIRET, adresse, email).
- `safeCalendlyUrl` corrigé (bypass `endsWith`). Upload : `type` whitelisté.

### Responsive / Mobile-first (en cours)
- Hook **`src/hooks/useIsMobile.ts`** (matchMedia ≤768px) pour adapter les styles inline.
- Classe CSS **`.dash-main`** dans `globals.css` (+ `!important` en media query) neutralise la marge sidebar 240px sur mobile.
- **Sidebar** : drawer/hamburger sur mobile. **Navbar landing** : liens centraux masqués via `.nav-desktop-links` (CSS pur — ⚠️ un style inline `display:flex` battait le `hidden` Tailwind). **Login** : panneau gauche masqué, form pleine largeur.
- `globals.css` : `overflow-x:hidden` global + viewport `initial-scale=1` dans `layout.tsx`.
- ⏳ **Reste à faire** : page publique `/[pseudo]`, grilles internes dashboard (stats, sponsors).
- ⚠️ Piège : un **style inline gagne toujours** sur une classe CSS (même Tailwind/`!important` de classe normale). Pour surcharger de l'inline en responsive → soit `useIsMobile`, soit CSS avec `!important`.

---

## Ce qui nous différencie des concurrents

| Nous | Concurrents (CreatorsJet, Beacons, MySocial…) |
|---|---|
| Stats vérifiées via OAuth YouTube + Twitch API | Scraping de stats publiques |
| Focus gaming/streaming français | Généralistes, américains |
| Interface 100% en français | Traductions approximatives |
| Page publique partageable en 1 clic | Souvent PDF ou lien non brandé |

**Concurrents identifiés :**
- **CreatorsJet** (creatorsjet.com) — Le plus proche, mais généraliste/US, pas d'OAuth réel
- **Beacons.ai** — Tout-en-un link-in-bio, 10-30$/mois, américain
- **MySocial** — Orienté CRM marques, 29$/mois
- **InfluenceFlow** — Gratuit + 1% commission sur deals
- **MediaFinder.fr** — Annuaire podcasts/newsletters FR, pas un media kit builder
- **Côté France** : quasi aucun concurrent direct sur le gaming/streaming → fenêtre de marché ouverte

---

## Stack technique

- **Framework** : Next.js 14 App Router (version avec breaking changes — lire `node_modules/next/dist/docs/` avant de coder)
- **Auth** : NextAuth v5 (beta) — JWT strategy, PrismaAdapter
- **DB** : PostgreSQL via Supabase (Prisma ORM)
- **Fichiers** : Vercel Blob
- **Paiement** : Stripe (abonnement Pro)
- **Email** : Resend
- **Style** : CSS-in-JS inline (pas de Tailwind, pas de composants UI tiers)
- **Typographie** : Space Grotesk (titres, var `--font-sans`) + Hanken Grotesk (corps, var `--font-body`) — importées dans `layout.tsx`. Plus jamais d'Inter (hardcode supprimé de `globals.css`).
- **Hébergement** : Vercel (plan Hobby), auto-deploy sur push `main`

---

## Branches Git

- `main` — version stable / production
- `Test` — branche de développement active

Toujours développer sur `Test`, merger vers `main` quand stable.

---

## Fonctionnalités existantes

### Créateur (dashboard)
- Connexion YouTube via OAuth Google (stats réelles : abonnés, vues, vidéos, analytics)
- Connexion Twitch via OAuth Twitch (followers, vues canal, clips, VODs)
- Media kit éditeur : bio, niche, formats, partenariats passés, lien Calendly
- Upload photo de profil (Vercel Blob)
- Page publique partageable via `/[pseudo]`
- Toggle page publique ON/OFF
- Suppression de compte (cascade)
- Abonnement Pro via Stripe

### Page publique (`/[pseudo]`)
- 3 thèmes visuels : Default (clair), Forest (vert sombre), Mono (noir)
- Stats en direct YouTube + Twitch avec données API
- Section analytics YouTube (pays, démographie, engagement)
- Section partenariats passés
- Formulaire de contact sponsor
- Lien Calendly optionnel

### Auth
- Inscription email/password avec vérification email (Resend)
- Connexion Google OAuth (création de compte + login)
- Twitch OAuth réservé au linking de plateforme dans le dashboard (PAS pour créer un compte Sponsorable)
- Protection profil : connecter Twitch/Google ne modifie pas la photo de profil si l'utilisateur avait déjà un compte
- **Config Edge-safe séparée** : `src/auth.config.ts` (sans bcrypt, providers vides, callback `authorized`) est utilisé par `src/middleware.ts`. Le `src/auth.ts` complet (Credentials + bcrypt + Prisma) ne tourne qu'en Node runtime. Évite l'erreur Edge Runtime sur `crypto`/bcrypt.

### Dashboard "Sponsorabilité" (`/dashboard/sponsors`)
- Page **privée créateur** (pas visible par les marques) — coach/roadmap, pas un score vanity
- Score /100 sur 6 dimensions (complétude profil, présence plateforme, taille audience, activité/contenu, engagement, dispo sponsor)
- Niveaux : "Profil à structurer / en montée / sponsor-ready / très attractif"
- Microcopy obligatoire : "Ce score est privé, pas visible par les marques, sert à améliorer ton profil"
- "Tes 3 priorités" triées par **impact sponsor/business réel** (niche/contenu récent avant micro-actions type Calendly)
- Catégories de marques : wording doux "À viser maintenant" / "Accessible prochainement"
- Bloc final "Ton profil aujourd'hui"
- Pro gate équilibré : score + priorité #1 gratuits ; recommandations détaillées + plan complet réservés Pro

### Landing page (`src/app/page.tsx`) — V3 "Neon Arena"
- Structure de conversion validée (11 blocs, ne pas re-discuter) : Hero → Problème → Solution → Exemples → Comment ça marche → Différenciation → Pour qui → Pourquoi → FAQ → Pricing → CTA final
- Palette : **vert = action/marque**, **violet = atmosphère uniquement (halos basse opacité, ressenti pas vu)**, **corail = la perte (Problème)**, **or = micro-valeur (badge vérifié)**. Pas de rainbow.
- Motion maîtrisé : composant `src/components/ui/Reveal.tsx` (IntersectionObserver, fade+rise) + hook `useInView`. Halos qui dérivent, mockup flottant, ligne lumineuse qui se trace, FAQ animée. **Une animation principale par bloc max.** Garde-fou `prefers-reduced-motion` coupe tout.
- Contrainte forte : **aucune fausse preuve sociale** (pas de faux témoignages/logos/compteurs). Crédibilité = produit (mockup + exemples live) + ton honnête.
- "Deviens Sponsorable" = signature de marque (kicker Hero + climax CTA final), pas le H1.
- Faux PDF Canva amateur (CSS) vs carte live = motif "mort vs vivant" dans la Différenciation.

### Données démo — SUPPRIMÉES (juin 2026)
- Les 5 profils de test (`/valcrest`, `/hexara`, etc.) et le script `prisma/seed-demo.ts` ont été supprimés (DB + repo) : pas de faux media kits accessibles publiquement.
- La page publique `/[pseudo]` affiche désormais une vraie page « introuvable » quand le slug n'existe pas ou que la page est désactivée (avant : elle affichait le mock AlexPlays).

### Photo de profil — Priorité
1. YouTube (miniature chaîne) — priorité maximale
2. Twitch (avatar) — si YouTube pas connecté
3. null (initiales affichées) — si aucune plateforme

---

## Décisions produit importantes

- **Twitch ne permet PAS de créer un compte Sponsorable** — uniquement pour lier une chaîne dans le dashboard
- **Google permet** de créer un compte ET de se connecter
- La **page publique** n'affiche la section stats que si au moins une plateforme est connectée (pas de padding vide)
- Les **cartes plateformes** dans le dashboard ont un design "full card" avec border-top verte quand connecté, CTA plein en bas

---

## Marché (recherche mai 2026)

- Influencer marketing mondial : **24 milliards $** en 2024 → **+30 milliards $** en 2026
- 87% des marques exigent un media kit avant tout partenariat
- Créateurs avec media kit pro reçoivent **3,5× plus d'opportunités**
- YouTube : **+54% de vidéos sponsorisées** en H1 2025
- **France/gaming : marché quasi vierge** sur ce créneau précis

---

## Bugs corrigés (historique)

- **Déconnexion plateforme silencieuse** : `DELETE /api/platforms/youtube` et `/twitch` n'avaient pas de handler DELETE dans les routes statiques (écrasées par la route dynamique `[type]`). Corrigé en ajoutant les handlers dans chaque fichier spécifique.
- **Photo de profil écrasée par Twitch OAuth** : le check `isLinking` ne fonctionnait que pour les comptes email/password. Corrigé en comptant les Account existants en DB.
- **Stats section vide sur page publique** : la `<section>` rendait toujours avec padding même sans plateformes. Corrigé avec un wrapper IIFE conditionnel.
- **Build Vercel — bcryptjs en Edge Runtime** : le middleware importait le `auth` complet (avec bcrypt) → erreur `crypto not supported in Edge`. Corrigé en séparant `auth.config.ts` (Edge-safe) pour le middleware.
- **Build Vercel — "Failed to collect page data"** : Next tentait de pré-rendre les routes API qui utilisent Prisma/auth. Corrigé en ajoutant `export const dynamic = 'force-dynamic'` sur toutes les routes `src/app/api/**`.
- **Build Vercel — cron Hobby** : `vercel.json` avait un cron horaire (`0 * * * *`), interdit en plan Hobby (1×/jour max). Corrigé en `0 6 * * *` (quotidien).

---

## Préférences de code

- Style **CSS-in-JS inline** uniquement — pas de classes Tailwind, pas de styled-components
- Pas de bibliothèques de composants UI (pas de shadcn, MUI, etc.)
- TypeScript strict
- Commentaires en **français**
- Commits en **anglais** (format conventionnel : feat/fix/chore)
- Toujours vérifier avec `npx tsc --noEmit` avant de committer

---

## Comment travailler avec Claude (rappels session)

### Réflexes à avoir
- **Début de session** : rien à faire, Claude relit ce fichier automatiquement
- **Décision importante** : dire "note ça dans le CLAUDE.md"
- **Fin de session** : dire "mets à jour le CLAUDE.md et Notion"
- **Bug** : décrire ce qu'on fait, ce qui se passe, ce qu'on attendait
- **Avant de pusher sur main** : toujours tester en local d'abord

### Comment formuler les demandes
- Donner le contexte *pourquoi* (pas juste *quoi*)
- Parler en vocal retranscrit / français familier, Claude s'adapte
- Si le résultat ne convient pas → décrire ce qui cloche, on itère

### Outils connectés à Claude
| Outil | Capacité |
|---|---|
| Linear | Créer, modifier, lire des tickets |
| Notion | Créer et mettre à jour des pages |
| GitHub | Lire le code, pusher des commits |
| Figma | Lire des designs (MCP connecté) |
| Recherche web | Concurrents, marché, outils |

### Ce que Claude ne peut PAS faire
- Se souvenir entre sessions sans ce fichier CLAUDE.md
- Tester sur téléphone ou en vrai (il voit le code, pas l'app)
- Prendre des décisions business à ta place
- Accéder à internet en temps réel sans recherche web explicite
