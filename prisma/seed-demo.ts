/**
 * SEED DE DÉMONSTRATION — Sponsorable
 * ─────────────────────────────────────
 * Lance    : npx tsx prisma/seed-demo.ts
 * Reset    : relancer la même commande (idempotent)
 *
 * Profils disponibles après seed :
 *   http://localhost:3000/valcrest         → rich    (48k YT + 12k Twitch, Pro)
 *   http://localhost:3000/hexara           → medium  (6k YT + 870 Twitch, Pro)
 *   http://localhost:3000/lankdower-test   → positioned (petit créateur bien positionné)
 *   http://localhost:3000/newdrop          → sparse  (profil éditorial sans plateforme)
 *   http://localhost:3000/nightbyte        → rich    (14k YT + 1,9k Twitch, hybride, Pro)
 *
 * Note — newdrop (sparse) :
 *   Pour atteindre la stratégie `sparse`, ce profil n'a pas de plateformes connectées
 *   (platformConnected=false + editorialScore=2). C'est le seul moyen d'être `sparse`
 *   avec des données éditoriales remplies, car editorialScore ≥ 3 force `positioned`.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_EMAILS = [
  'seed-valcrest@sponsorable.local',
  'seed-hexara@sponsorable.local',
  'seed-lankdower@sponsorable.local',
  'seed-newdrop@sponsorable.local',
  'seed-nightbyte@sponsorable.local',
]

const LAST_FETCHED = new Date('2025-05-29T14:30:00Z')

/* ── Helpers ─────────────────────────────────────────────── */

function ytVideo(
  id: string, title: string, publishedAt: string,
  viewCount: number, likeCount: number, commentCount: number
) {
  return { id, title, publishedAt, thumbnail: null, viewCount: String(viewCount), likeCount: String(likeCount), commentCount: String(commentCount) }
}

function twitchClip(id: string, title: string, viewCount: number, createdAt: string, duration: number) {
  return { id, title, viewCount, thumbnail: null, createdAt, duration }
}

function twitchStream(id: string, title: string, publishedAt: string, duration: string, viewCount: number) {
  return { id, title, publishedAt, duration, thumbnail: null, viewCount }
}

/* ── main ────────────────────────────────────────────────── */

async function main() {
  console.log('Nettoyage des seeds démo...')
  await prisma.user.deleteMany({ where: { email: { in: DEMO_EMAILS } } })

  console.log('Création des 5 profils...')
  await createValcrest()
  await createHexara()
  await createLankdower()
  await createNewdrop()
  await createNightbyte()

  console.log('\n✓ Seed terminé. URLs à ouvrir :')
  console.log('  http://localhost:3000/valcrest')
  console.log('  http://localhost:3000/hexara')
  console.log('  http://localhost:3000/lankdower-test')
  console.log('  http://localhost:3000/newdrop')
  console.log('  http://localhost:3000/nightbyte')
}

/* ── 1. VALCREST — rich ──────────────────────────────────── */

async function createValcrest() {
  const user = await prisma.user.create({
    data: {
      email: 'seed-valcrest@sponsorable.local',
      name: 'Valcrest',
      username: 'demo_valcrest',
      emailVerified: new Date('2024-12-01'),
      stripeSubscriptionStatus: 'active',
    },
  })

  await prisma.profile.create({
    data: {
      userId: user.id,
      slug: 'valcrest',
      displayName: 'Valcrest',
      bio: 'Créateur FPS francophone orienté Valorant compétitif, entre analyse, gameplay et lives communautaires.',
      niche: 'Valorant · FPS · Esport',
      country: 'France',
      languages: ['Français'],
      contentStyle: 'Compétitif',
      targetBrands: 'Hardware gaming, Énergie, Périphériques, Anti-triche, VPN',
      availableForCollabs: true,
      positioningPhrase: 'Créateur FPS francophone orienté Valorant compétitif, avec une audience engagée sur YouTube et Twitch.',
      sponsorSummary: 'Profil gaming établi avec contenu régulier, visibilité multi-plateforme et formats adaptés aux campagnes hardware, gaming et énergie.',
      formats: ['Intégration YouTube', 'Session live sponsorisée', 'Ambassadeur'],
      showPartnerships: true,
      partnerships: [
        { name: 'NordVPN', category: 'Cybersécurité', result: '38 000 vues · 3,4% CTR lien description · 1 200 clics', date: 'Avr. 2025' },
        { name: 'Razer', category: 'Périphériques gaming', result: 'Pack 3 vidéos · 87 000 vues cumulées · 5,1% engagement', date: 'Fév. 2025' },
        { name: 'GFuel France', category: 'Boissons gaming', result: 'Code promo actif 4 semaines · 420 conversions directes', date: 'Nov. 2024' },
      ],
      theme: 'esport',
      isPublic: true,
    },
  })

  await prisma.platform.create({
    data: {
      userId: user.id,
      type: 'youtube',
      platformId: 'yt_valcrest',
      username: '@valcrest',
      displayName: 'Valcrest',
      lastFetched: LAST_FETCHED,
      stats: {
        subscriberCount: 48200,
        viewCount: 2480000,
        videoCount: 156,
        engagementRate: 4.8,
        avgViewsPerVideo: 26400,
        analytics: {
          views90d: 318000,
          topCountries: [
            { country: 'FR', views: 197160 },
            { country: 'BE', views: 34980 },
            { country: 'CA', views: 28620 },
            { country: 'CH', views: 22260 },
          ],
          ageGroups: [
            { age: '13-17 ans', pct: 12 },
            { age: '18-24 ans', pct: 38 },
            { age: '25-34 ans', pct: 41 },
            { age: '35-44 ans', pct: 9 },
          ],
          gender: { male: 76, female: 24 },
          avgViewDuration: 340,
          avgViewPercentage: 42,
          estimatedMinutesWatched: 1802000,
        },
        recentVideos: [
          ytVideo('vc-v1', 'VALORANT : Comment passer Immortal sans aim parfait (Guide tactique)', '2025-05-27T14:00:00Z', 34200, 1640, 218),
          ytVideo('vc-v2', 'J\'ai joué 50 ranked avec un Iron pour voir sa progression', '2025-05-22T14:00:00Z', 28900, 1380, 186),
          ytVideo('vc-v3', 'Top 10 agents sous-cotés en ranked — patch actuel', '2025-05-17T14:00:00Z', 26100, 1240, 142),
        ],
      },
    },
  })

  await prisma.platform.create({
    data: {
      userId: user.id,
      type: 'twitch',
      platformId: 'tw_valcrest',
      username: 'valcrestgg',
      displayName: 'Valcrest',
      lastFetched: LAST_FETCHED,
      stats: {
        followerCount: 12800,
        viewCount: 1840000,
        subscriptionCount: 340,
        avgVodViews: 8500,
        gameName: 'VALORANT',
        tags: ['FPS', 'Francophone', 'Compétitif'],
        topClips: [
          twitchClip('vc-c1', 'Clutch 1v4 ranked — le chat a perdu la tête', 48200, '2025-05-24T20:00:00Z', 38),
          twitchClip('vc-c2', 'Ace en pistol round — Neon rush parfait', 31500, '2025-05-18T20:00:00Z', 22),
          twitchClip('vc-c3', 'Réaction au nerf Jett — le débat en live', 22800, '2025-05-12T20:00:00Z', 47),
          twitchClip('vc-c4', 'Triple headshot Operator — la room était là', 18200, '2025-05-06T20:00:00Z', 15),
        ],
        recentStreams: [
          twitchStream('vc-s1', '[RANKED] Road to Radiant — Ranked only, pas de smurf', '2025-05-28T18:00:00Z', '4h20m', 9200),
          twitchStream('vc-s2', 'PATCH DAY — Réaction en live + ranked direct après', '2025-05-26T18:00:00Z', '3h45m', 8100),
          twitchStream('vc-s3', '[RANKED] Sessions BO3 avec le chat — on vote le duelliste', '2025-05-24T18:00:00Z', '5h10m', 7800),
        ],
      },
    },
  })

  console.log('  ✓ valcrest (rich)')
}

/* ── 2. HEXARA — medium ──────────────────────────────────── */

async function createHexara() {
  const user = await prisma.user.create({
    data: {
      email: 'seed-hexara@sponsorable.local',
      name: 'Hexara',
      username: 'demo_hexara',
      emailVerified: new Date('2025-01-15'),
      stripeSubscriptionStatus: 'active',
    },
  })

  await prisma.profile.create({
    data: {
      userId: user.id,
      slug: 'hexara',
      displayName: 'Hexara',
      bio: 'Créatrice gaming francophone spécialisée Minecraft, entre contenu chill, pédagogie et communauté.',
      niche: 'Minecraft · Sandbox · Chill',
      country: 'France',
      languages: ['Français', 'Anglais'],
      contentStyle: 'Pédagogique',
      targetBrands: 'Gaming family-friendly, Tech, Lifestyle, Education, Alimentaire',
      availableForCollabs: true,
      positioningPhrase: 'Créatrice gaming francophone spécialisée sur Minecraft, entre contenu chill, pédagogie et communauté.',
      sponsorSummary: 'Profil en croissance avec communauté fidèle, cadence régulière et formats compatibles avec campagnes gaming family-friendly, tech et lifestyle.',
      formats: ['Mention live', 'Intégration vidéo', 'Pack réseaux'],
      showPartnerships: true,
      partnerships: [
        { name: 'Instant Gaming', category: 'Marketplace jeux', result: '14 800 vues · 560 clics code promo · 2,1% conversion', date: 'Mar. 2025' },
        { name: 'Gportal', category: 'Hébergement serveur', result: 'Intégration vidéo · 11 200 vues · 380 clics', date: 'Jan. 2025' },
      ],
      theme: 'forest',
      isPublic: true,
    },
  })

  await prisma.platform.create({
    data: {
      userId: user.id,
      type: 'youtube',
      platformId: 'yt_hexara',
      username: '@hexaragaming',
      displayName: 'Hexara',
      lastFetched: LAST_FETCHED,
      stats: {
        subscriberCount: 6300,
        viewCount: 420000,
        videoCount: 87,
        engagementRate: 6.1,
        avgViewsPerVideo: 2900,
        analytics: {
          views90d: 44000,
          topCountries: [
            { country: 'FR', views: 29480 },
            { country: 'BE', views: 6160 },
            { country: 'CA', views: 3960 },
            { country: 'CH', views: 2640 },
          ],
          ageGroups: [
            { age: '13-17 ans', pct: 28 },
            { age: '18-24 ans', pct: 42 },
            { age: '25-34 ans', pct: 22 },
            { age: '35-44 ans', pct: 8 },
          ],
          gender: { male: 54, female: 46 },
          avgViewDuration: 375,
          avgViewPercentage: 48,
          estimatedMinutesWatched: 275000,
        },
        recentVideos: [
          ytVideo('hx-v1', 'J\'ai construit une ville entière en survie Hardcore (episode 12)', '2025-05-26T15:00:00Z', 4200, 340, 98),
          ytVideo('hx-v2', 'Les 10 builds Minecraft les plus utiles pour débutants', '2025-05-20T15:00:00Z', 3800, 290, 74),
          ytVideo('hx-v3', 'Minecraft 1.21 — tout ce qui change pour les builders', '2025-05-14T15:00:00Z', 2900, 218, 62),
        ],
      },
    },
  })

  await prisma.platform.create({
    data: {
      userId: user.id,
      type: 'twitch',
      platformId: 'tw_hexara',
      username: 'hexaracraft',
      displayName: 'Hexara',
      lastFetched: LAST_FETCHED,
      stats: {
        followerCount: 870,
        viewCount: 48000,
        avgVodViews: 820,
        gameName: 'Minecraft',
        tags: ['Chill', 'Francophone', 'Building'],
        topClips: [
          twitchClip('hx-c1', 'Le chat m\'aide à nommer mon village — résultats catastrophiques', 3800, '2025-05-22T16:00:00Z', 44),
          twitchClip('hx-c2', 'Construction live d\'une ferme à XP — le chat donne les recettes', 2100, '2025-05-15T16:00:00Z', 38),
          twitchClip('hx-c3', 'Découverte d\'un donjon secret en direct — la réaction était là', 1800, '2025-05-08T16:00:00Z', 28),
        ],
        recentStreams: [
          twitchStream('hx-s1', '[SURVIE] Construction du marché du village — architecte du dimanche', '2025-05-25T15:00:00Z', '3h10m', 920),
          twitchStream('hx-s2', '[CHILL] Session build + Q&R avec le chat', '2025-05-21T15:00:00Z', '2h40m', 780),
        ],
      },
    },
  })

  console.log('  ✓ hexara (medium)')
}

/* ── 3. LANKDOWER — positioned ───────────────────────────── */

async function createLankdower() {
  const user = await prisma.user.create({
    data: {
      email: 'seed-lankdower@sponsorable.local',
      name: 'Lankdower',
      username: 'demo_lankdower',
      emailVerified: new Date('2025-03-01'),
      stripeSubscriptionStatus: 'free',
    },
  })

  await prisma.profile.create({
    data: {
      userId: user.id,
      slug: 'lankdower-test',
      displayName: 'Lankdower',
      bio: 'Créateur Valorant francophone, orienté gameplay compétitif, live et clips.',
      niche: 'Valorant · FPS · Tryhard',
      country: 'France',
      languages: ['Français'],
      contentStyle: 'Compétitif',
      targetBrands: 'Gaming, Énergie, Périphériques FPS',
      availableForCollabs: true,
      positioningPhrase: 'Créateur Valorant francophone, orienté gameplay compétitif, live et clips.',
      sponsorSummary: 'Profil gaming bien positionné sur une niche FPS claire, avec présence Twitch active et formats exploitables pour partenariats gaming.',
      formats: ['Mention live', 'Session sponsorisée', 'Clip sponsorisé'],
      showPartnerships: true,
      partnerships: [
        { name: 'Instant Gaming', category: 'Marketplace jeux', result: 'Mention live sur 3 streams · 840 vues cumulées · code utilisé 28 fois', date: 'Avr. 2025' },
      ],
      isPublic: true,
    },
  })

  await prisma.platform.create({
    data: {
      userId: user.id,
      type: 'youtube',
      platformId: 'yt_lankdower',
      username: '@lankdower',
      displayName: 'Lankdower',
      lastFetched: LAST_FETCHED,
      stats: {
        subscriberCount: 180,
        viewCount: 14800,
        videoCount: 18,
        avgViewsPerVideo: 120,
        analytics: {
          views90d: 1400,
          topCountries: [
            { country: 'FR', views: 1120 },
            { country: 'BE', views: 168 },
            { country: 'CH', views: 112 },
          ],
          ageGroups: [
            { age: '13-17 ans', pct: 22 },
            { age: '18-24 ans', pct: 58 },
            { age: '25-34 ans', pct: 20 },
          ],
          gender: { male: 82, female: 18 },
          avgViewDuration: 170,
          avgViewPercentage: 37,
        },
        recentVideos: [
          ytVideo('ld-v1', 'Clutch 1v3 en ranked — Sage Op', '2025-05-25T12:00:00Z', 180, 22, 8),
          ytVideo('ld-v2', 'Mon setup Valorant complet — config souris + réticule', '2025-05-14T12:00:00Z', 140, 18, 5),
        ],
      },
    },
  })

  await prisma.platform.create({
    data: {
      userId: user.id,
      type: 'twitch',
      platformId: 'tw_lankdower',
      username: 'lankdower_valo',
      displayName: 'Lankdower',
      lastFetched: LAST_FETCHED,
      stats: {
        followerCount: 131,
        viewCount: 8400,
        avgVodViews: 180,
        gameName: 'VALORANT',
        tags: ['FPS', 'Francophone', 'Ranked'],
        topClips: [
          twitchClip('ld-c1', 'Ace complet en pistol — le chat était là', 1240, '2025-05-26T21:00:00Z', 28),
          twitchClip('ld-c2', 'Double headshot Operator — une chance sur mille', 980, '2025-05-20T21:00:00Z', 14),
          twitchClip('ld-c3', 'Réaction rank-up — Diamond pour la première fois', 820, '2025-05-16T21:00:00Z', 42),
          twitchClip('ld-c4', 'Fail epic — grenade sur moi-même en clutch', 760, '2025-05-10T21:00:00Z', 19),
          twitchClip('ld-c5', 'Chat vote l\'agent — chat a dit Neon, chat a eu tort', 640, '2025-05-04T21:00:00Z', 33),
        ],
        recentStreams: [
          twitchStream('ld-s1', '[RANKED] Valo avec le chat — Diamond push', '2025-05-27T20:00:00Z', '3h20m', 220),
          twitchStream('ld-s2', '[RANKED] Soloq ou avec sub — on monte ensemble', '2025-05-23T20:00:00Z', '2h50m', 190),
        ],
      },
    },
  })

  console.log('  ✓ lankdower-test (positioned)')
}

/* ── 4. NEWDROP — sparse ─────────────────────────────────── */
// Pas de plateformes connectées : editorialScore=2, platformConnected=false → sparse

async function createNewdrop() {
  const user = await prisma.user.create({
    data: {
      email: 'seed-newdrop@sponsorable.local',
      name: 'Newdrop',
      username: 'demo_newdrop',
      emailVerified: new Date('2025-04-10'),
      stripeSubscriptionStatus: 'free',
    },
  })

  await prisma.profile.create({
    data: {
      userId: user.id,
      slug: 'newdrop',
      displayName: 'Newdrop',
      // bio (> 20 chars) → editorialScore +1
      bio: 'Créateur gaming francophone en lancement, centré sur des contenus fun et accessibles.',
      // niche → editorialScore +1
      niche: 'Battle Royale · Fun',
      // formats vide → pas de +1
      formats: [],
      // country null → pas de +1
      country: null,
      // languages vide → pas de +1
      languages: [],
      // Total editorialScore = 2, platformConnected = false → stratégie sparse
      contentStyle: null,
      targetBrands: null,
      availableForCollabs: true,
      positioningPhrase: 'Créateur gaming francophone en lancement, centré sur des contenus fun et accessibles.',
      sponsorSummary: null,
      showPartnerships: false,
      partnerships: [],
      isPublic: true,
    },
  })

  // Pas de Platform créée → platformConnected=false → sparse confirmé

  console.log('  ✓ newdrop (sparse)')
}

/* ── 5. NIGHTBYTE — rich / hybride ──────────────────────── */

async function createNightbyte() {
  const user = await prisma.user.create({
    data: {
      email: 'seed-nightbyte@sponsorable.local',
      name: 'Nightbyte',
      username: 'demo_nightbyte',
      emailVerified: new Date('2025-01-05'),
      stripeSubscriptionStatus: 'active',
    },
  })

  await prisma.profile.create({
    data: {
      userId: user.id,
      slug: 'nightbyte',
      displayName: 'Nightbyte',
      bio: 'Créateur sim racing et hardware, entre contenu explicatif sur YouTube et démonstration live sur Twitch.',
      niche: 'Sim Racing · Hardware · Setup',
      country: 'France',
      languages: ['Français', 'Anglais'],
      contentStyle: 'Expert',
      targetBrands: 'Sim Racing, Périphériques, Tech, Accessoires gaming, Setup',
      availableForCollabs: true,
      positioningPhrase: 'Créateur sim racing et hardware, entre contenu explicatif sur YouTube et démonstration live sur Twitch.',
      sponsorSummary: 'Profil hybride idéal pour marques tech, périphériques, sim racing et accessoires, avec formats complémentaires entre vidéo et live.',
      formats: ['Review intégrée', 'Live setup sponsorisé', 'Ambassadeur'],
      showPartnerships: true,
      partnerships: [
        { name: 'Thrustmaster', category: 'Périphériques sim racing', result: 'Review dédiée · 21 400 vues · 4,2% engagement · 840 clics produit', date: 'Mar. 2025' },
        { name: 'Corsair', category: 'Périphériques gaming', result: 'Intégration setup · 18 200 vues · mise en avant 4 semaines', date: 'Déc. 2024' },
      ],
      theme: 'mono',
      isPublic: true,
    },
  })

  await prisma.platform.create({
    data: {
      userId: user.id,
      type: 'youtube',
      platformId: 'yt_nightbyte',
      username: '@nightbyte',
      displayName: 'Nightbyte',
      lastFetched: LAST_FETCHED,
      stats: {
        subscriberCount: 14700,
        viewCount: 980000,
        videoCount: 94,
        engagementRate: 5.2,
        avgViewsPerVideo: 7800,
        analytics: {
          views90d: 96000,
          topCountries: [
            { country: 'FR', views: 62400 },
            { country: 'BE', views: 11520 },
            { country: 'CA', views: 8640 },
            { country: 'CH', views: 7680 },
            { country: 'DE', views: 4800 },
          ],
          ageGroups: [
            { age: '18-24 ans', pct: 28 },
            { age: '25-34 ans', pct: 44 },
            { age: '35-44 ans', pct: 22 },
            { age: '45+ ans', pct: 6 },
          ],
          gender: { male: 88, female: 12 },
          avgViewDuration: 430,
          avgViewPercentage: 46,
          estimatedMinutesWatched: 690000,
        },
        recentVideos: [
          ytVideo('nb-v1', 'Fanatec CSL DD vs Moza R5 — lequel acheter en 2025 ?', '2025-05-26T10:00:00Z', 14200, 740, 186),
          ytVideo('nb-v2', 'Mon nouveau setup sim racing — 2 000€ de budget, 0 compromis', '2025-05-20T10:00:00Z', 8900, 480, 134),
          ytVideo('nb-v3', 'Tutoriel : calibrer un volant sim racing en 10 minutes', '2025-05-13T10:00:00Z', 7200, 380, 98),
          ytVideo('nb-v4', 'Assetto Corsa Evo — premier test sur circuit Nürburgring', '2025-05-06T10:00:00Z', 6100, 320, 82),
        ],
      },
    },
  })

  await prisma.platform.create({
    data: {
      userId: user.id,
      type: 'twitch',
      platformId: 'tw_nightbyte',
      username: 'nightbyte_racing',
      displayName: 'Nightbyte',
      lastFetched: LAST_FETCHED,
      stats: {
        followerCount: 1950,
        viewCount: 182000,
        subscriptionCount: 48,
        avgVodViews: 2200,
        gameName: 'Assetto Corsa Competizione',
        tags: ['Sim Racing', 'Francophone', 'Hardware'],
        topClips: [
          twitchClip('nb-c1', 'Dépassement à la limite sur Spa — le chat silence', 8400, '2025-05-24T14:00:00Z', 26),
          twitchClip('nb-c2', 'Réaction unboxing volant en live — le chat valide', 5200, '2025-05-10T14:00:00Z', 58),
        ],
        recentStreams: [
          twitchStream('nb-s1', '[SIM RACING] Endurance Spa 3h — setup Thrustmaster T300', '2025-05-27T19:00:00Z', '3h10m', 2600),
          twitchStream('nb-s2', 'SETUP DAY — configuration live du nouveau cockpit avec le chat', '2025-05-22T19:00:00Z', '2h30m', 2100),
        ],
      },
    },
  })

  console.log('  ✓ nightbyte (rich/hybride)')
}

/* ── run ─────────────────────────────────────────────────── */

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
