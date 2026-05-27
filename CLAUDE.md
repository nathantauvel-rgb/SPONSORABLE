@AGENTS.md

---

# Sponsorable — Contexte Projet

## C'est quoi Sponsorable ?

Sponsorable est une plateforme de **media kit dynamique** pour les créateurs de contenu français (YouTube, Twitch).
En 2 minutes, un créateur connecte ses plateformes et obtient un lien public à partager aux marques, avec ses vraies stats vérifiées via API (pas du scraping).

**Tagline** : "Ton media kit pro, en 2 minutes."

**Cible principale** : Créateurs de contenu gaming/streaming francophones (YouTubers, streamers Twitch FR).

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
