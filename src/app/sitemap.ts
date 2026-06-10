import type { MetadataRoute } from 'next'

// Sitemap des pages statiques publiques. Les pages créateurs /[pseudo]
// sont volontairement exclues : leur visibilité dépend du toggle isPublic
// et elles sont partagées par lien direct, pas découvertes via Google.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://sponsorable.fr'
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/login`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/mentions-legales`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/confidentialite`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/cgu`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
