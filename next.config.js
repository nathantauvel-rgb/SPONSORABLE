/** @type {import('next').NextConfig} */

// Headers de sécurité appliqués à toutes les routes.
// HSTS : force HTTPS pendant 2 ans (Vercel gère le certificat et la redirection,
// ce header empêche tout downgrade après la première visite).
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Empêche l'affichage du site dans une iframe externe (clickjacking)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Empêche le navigateur de "deviner" un type MIME différent de celui annoncé
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Ne transmet que l'origine aux sites externes (pas l'URL complète)
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Coupe l'accès aux APIs sensibles du navigateur dont on ne se sert pas
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
]

const nextConfig = {
  // Ne pas annoncer "X-Powered-By: Next.js" dans les réponses
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'static-cdn.jtvnw.net' },
      { protocol: 'https', hostname: 'yt3.ggpht.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
