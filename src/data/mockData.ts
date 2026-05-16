import type { Platform } from '@/types'

export const creator = {
  pseudo: 'AlexPlays',
  niche: 'Gaming · Minecraft · FPS',
  niches: ['Gaming', 'Minecraft', 'FPS'],
  subscribers_yt: 87400,
  viewers_twitch: 12300,
  engagement_rate: 4.2,
  country: 'France',
  bio: 'Créateur gaming FR depuis 2019. Minecraft, FPS compétitif et streams quotidiens.',
  email: 'alex@alexplays.fr',
  url: 'sponsorable.gg/alexplays',
  avatar_initials: 'AP',
  mediakit_views: 348,
  last_sync: 'il y a 2h',
}

export const offers = [
  {
    title: 'Intégration vidéo YouTube',
    price: '800€',
    desc: '60 sec intégrées, lien description, 3 Shorts inclus',
    icon: 'youtube',
  },
  {
    title: 'Sponsoring stream Twitch',
    price: '350€',
    desc: 'Panel dédié, mention intro/outro, bannière 3h',
    icon: 'twitch',
  },
  {
    title: 'Pack réseaux sociaux',
    price: '250€/mois',
    desc: '4 posts Instagram + 2 TikToks sponsorisés',
    icon: 'instagram',
  },
  {
    title: 'Ambassadeur longue durée',
    price: 'Sur devis',
    desc: 'Contrat 3–6 mois, branding exclusif',
    icon: 'star',
  },
]

export const stats = [
  { label: 'Abonnés YouTube', value: '87 400', sub: '+2 300 ce mois' },
  { label: 'Viewers Twitch', value: '12 300', sub: 'Moyenne 30j' },
  { label: 'Taux d\'engagement', value: '4,2%', sub: '+0.3pt' },
  { label: 'Vues / vidéo moy.', value: '54 000', sub: 'Sur 90 jours' },
]

export const platforms: Platform[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    color: '#ef4444',
    hero: true,
    mainStat: { value: '87 400', label: 'abonnés' },
    secondaryStats: [
      { value: '54 000', label: 'vues / vidéo moy.' },
      { value: '62%', label: 'taux de complétion' },
      { value: '+18%', label: 'croissance 90j' },
    ],
  },
  {
    id: 'twitch',
    name: 'Twitch',
    color: '#9146ff',
    hero: false,
    mainStat: { value: '12 300', label: 'viewers moy.' },
    secondaryStats: [
      { value: '4,2%', label: 'engagement' },
      { value: '48h', label: 'streamées / mois' },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: '#000000',
    hero: false,
    mainStat: { value: '34 200', label: 'abonnés' },
    secondaryStats: [
      { value: '180K', label: 'vues / vidéo moy.' },
      { value: '8,3%', label: 'engagement' },
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#e1306c',
    hero: false,
    mainStat: { value: '18 500', label: 'abonnés' },
    secondaryStats: [
      { value: '3,1%', label: 'engagement' },
      { value: '12', label: 'posts / mois' },
    ],
  },
]

export const audienceAge = [
  { label: '13–17 ans', pct: 8 },
  { label: '18–24 ans', pct: 38 },
  { label: '25–34 ans', pct: 24 },
  { label: '35–44 ans', pct: 18 },
  { label: '45+ ans', pct: 12 },
]

export const audienceGender = { male: 72, female: 28 }

export const audienceCountries = [
  { flag: 'fr', name: 'France', pct: 64 },
  { flag: 'be', name: 'Belgique', pct: 14 },
  { flag: 'ch', name: 'Suisse', pct: 9 },
  { flag: 'ca', name: 'Canada', pct: 7 },
  { flag: 'world', name: 'Autres', pct: 6 },
]

export const pastPartners = [
  {
    name: 'NordVPN',
    category: 'Cybersécurité',
    result: '42 000 vues sur le segment · 3,1% CTR lien description',
    date: 'Mars 2025',
  },
  {
    name: 'Gportal',
    category: 'Hébergement serveur',
    result: '28 000 vues · 890 clics code promo',
    date: 'Jan. 2025',
  },
  {
    name: 'Corsair',
    category: 'Périphériques gaming',
    result: 'Pack 3 vidéos · 95 000 vues cumulées · 4,8% engagement',
    date: 'Nov. 2024',
  },
  {
    name: 'Instant Gaming',
    category: 'Marketplace jeux',
    result: '61 000 vues · 1 240 clics · taux de conversion 2,3%',
    date: 'Sept. 2024',
  },
]

export const availabilitySlots = [
  { label: 'Intégration YouTube', date: '3 juin 2025', available: true },
  { label: 'Intégration YouTube', date: '17 juin 2025', available: true },
  { label: 'Sponsoring Twitch', date: '7 juin 2025', available: false },
  { label: 'Pack réseaux sociaux', date: 'Juillet 2025', available: true },
]

export const videos = [
  {
    title: 'J\'ai survécu 100 jours en Hardcore Minecraft',
    views: '412 000 vues',
    date: 'Il y a 5 jours',
  },
  {
    title: 'CS2 — Rank S2 à Global en 30h (ft. Gotaga)',
    views: '298 000 vues',
    date: 'Il y a 12 jours',
  },
  {
    title: 'Minecraft mais les créatures sont FOLLES',
    views: '187 000 vues',
    date: 'Il y a 18 jours',
  },
]

export const metrics = [
  {
    label: 'Abonnés YouTube',
    value: '87 400',
    change: '+2,3% ce mois',
    positive: true,
  },
  {
    label: 'Viewers Twitch',
    value: '12 300',
    change: '+5,1%',
    positive: true,
  },
  {
    label: 'Engagement',
    value: '4,2%',
    change: '+0,3pt',
    positive: true,
  },
  {
    label: 'Vues du media kit',
    value: '348',
    change: 'ce mois',
    positive: true,
  },
]

export const exampleCreators = [
  {
    id: 'esport',
    pseudo: 'ViperFR',
    initials: 'VF',
    avatarColor: '#6c5fc7',
    niches: ['Valorant', 'FPS', 'Esport'],
    bio: 'Joueur Valorant Immortal+ FR. Highlights compétitifs et guides tactiques depuis 2021.',
    email: 'viper@viperfr.gg',
    country: 'France',
    platform: 'Twitch',
    mainStat: { value: '24 800', label: 'abonnés Twitch' },
    stats: [
      { value: '4 100', label: 'viewers moy.' },
      { value: '7,2%', label: 'engagement' },
      { value: '+28%', label: 'croissance 90j' },
    ],
    formats: ['Twitch', 'YouTube Clips', 'TikTok', 'Tournoi sponsorisé'],
    theme: {
      bg: '#0d0d12',
      cardBg: 'rgba(108,95,199,0.08)',
      border: 'rgba(108,95,199,0.35)',
      accent: '#6c5fc7',
      text: '#ffffff',
      subtext: 'rgba(255,255,255,0.45)',
      statBg: 'rgba(108,95,199,0.07)',
      statBorder: 'rgba(108,95,199,0.18)',
      boxShadow: '0 0 30px rgba(108,95,199,0.18)',
      avatarGlow: '0 0 16px rgba(108,95,199,0.35)',
      liveIndicator: false,
      styleLabel: 'Esport · Pro Player',
    },
  },
  {
    id: 'mono',
    pseudo: 'Kiro',
    initials: 'KI',
    avatarColor: '#ffffff',
    niches: ['Gaming', 'YouTube', 'FPS'],
    bio: 'Créateur FPS FR depuis 2019. Analyses tactiques, highlights et contenus longs format.',
    email: 'kiro@kiro.gg',
    country: 'France',
    platform: 'YouTube',
    mainStat: { value: '512K', label: 'abonnés YouTube' },
    stats: [
      { value: '240K', label: 'vues / vidéo' },
      { value: '3,8%', label: 'engagement' },
      { value: '+31%', label: 'croissance 90j' },
    ],
    formats: ['YouTube', 'Twitch', 'Ambassadeur'],
    theme: {
      bg: '#111111', cardBg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.07)',
      accent: '#ffffff', text: '#ffffff', subtext: 'rgba(255,255,255,0.32)',
      statBg: 'transparent', statBorder: 'rgba(255,255,255,0.07)',
      boxShadow: 'none', avatarGlow: 'none', liveIndicator: false, styleLabel: '',
    },
  },
  {
    id: 'forest',
    pseudo: 'Dread.gg',
    initials: 'DR',
    avatarColor: '#7ab356',
    niches: ['Variety', 'IRL', 'Gaming'],
    bio: 'Streamer variety FR depuis 2021. Communauté active, IRL, gaming et just chatting quotidien.',
    email: 'dread@dread.gg',
    country: 'France',
    platform: 'Twitch',
    mainStat: { value: '45 800', label: 'abonnés' },
    stats: [
      { value: '8 200', label: 'viewers moy.' },
      { value: '4,7%', label: 'engagement' },
      { value: '+19%', label: 'croissance 90j' },
    ],
    formats: ['Twitch', 'IRL sponsorisé', 'YouTube VOD', 'Ambassadeur'],
    theme: {
      bg: '#eae5d8', cardBg: '#f5f0e6', border: 'rgba(55,72,28,0.14)',
      accent: '#3d5418', text: '#1c2610', subtext: '#4a5c2e',
      statBg: '#f0ead8', statBorder: 'rgba(55,72,28,0.10)',
      boxShadow: 'none', avatarGlow: 'none', liveIndicator: false, styleLabel: 'Variety · IRL',
    },
  },
  {
    id: 'youtuber',
    pseudo: 'AlexPlays',
    initials: 'AP',
    avatarColor: '#ef4444',
    niches: ['YouTube', 'Minecraft', 'FPS'],
    bio: 'Créateur gaming FR depuis 2019. Minecraft, FPS compétitif et vidéos hebdomadaires.',
    email: 'alex@alexplays.fr',
    country: 'France',
    platform: 'YouTube',
    mainStat: { value: '87 400', label: 'abonnés YouTube' },
    stats: [
      { value: '54 000', label: 'vues / vidéo' },
      { value: '4,2%', label: 'engagement' },
      { value: '+18%', label: 'croissance 90j' },
    ],
    formats: ['YouTube', 'Twitch', 'Réseaux sociaux', 'Ambassadeur'],
    theme: {
      bg: '#ffffff',
      cardBg: '#f1f5f9',
      border: 'rgba(0,0,0,0.10)',
      accent: '#ef4444',
      text: '#0f172a',
      subtext: '#94a3b8',
      statBg: '#f8fafc',
      statBorder: 'rgba(0,0,0,0.06)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      avatarGlow: 'none',
      liveIndicator: false,
      styleLabel: 'YouTuber · Gaming',
    },
  },
]

export const plans = [
  {
    name: 'Gratuit',
    price: '0€',
    period: '',
    badge: null,
    features: [
      '1 plateforme connectée',
      'Page avec watermark',
      'Stats manuelles',
      'Lien public sponsorable.gg',
    ],
    cta: 'Commencer gratuitement',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '19€',
    period: '/mois',
    badge: 'Le plus populaire',
    features: [
      'YouTube + Twitch + Instagram',
      'Page sans watermark',
      'Stats automatiques (sync API)',
      'Export PDF',
      'Analytics kit (qui visite)',
    ],
    cta: 'Essayer Pro',
    highlight: true,
  },
  {
    name: 'Agence',
    price: '49€',
    period: '/mois',
    badge: null,
    features: [
      "Jusqu'à 20 créateurs",
      'Dashboard manager',
      'White-label (votre domaine)',
      'Priorité support',
    ],
    cta: 'Contacter les ventes',
    highlight: false,
  },
]
