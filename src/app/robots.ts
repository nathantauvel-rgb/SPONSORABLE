import type { MetadataRoute } from 'next'

// robots.txt généré par Next : on indexe le site public,
// pas le dashboard ni les routes API.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/'],
    },
    sitemap: 'https://sponsorable.fr/sitemap.xml',
  }
}
