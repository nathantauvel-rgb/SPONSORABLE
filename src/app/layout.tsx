import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter, Martian_Mono } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers'
import CookieBanner from '@/components/CookieBanner'

/* Space Grotesk — titres (var --font-sans, aliasée sur --font-display dans globals.css) */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
})

/* Inter — corps & UI (var --font-body, aliasée sur --font-syne dans globals.css) */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

/* Martian Mono — chiffres métriques uniquement (look carré/terminal). */
const martianMono = Martian_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-num',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://sponsorable.fr'),
  title: 'Sponsorable — Ton media kit pour créateurs gaming',
  description:
    'Connecte YouTube et Twitch, génère un media kit professionnel et partage un lien à tes sponsors en 2 minutes.',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://sponsorable.fr',
    siteName: 'Sponsorable',
    title: 'Sponsorable — Ton media kit pour créateurs gaming',
    description:
      'Connecte YouTube et Twitch, génère un media kit professionnel et partage un lien à tes sponsors en 2 minutes.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sponsorable — Ton media kit pour créateurs gaming',
    description:
      'Connecte YouTube et Twitch, génère un media kit professionnel et partage un lien à tes sponsors en 2 minutes.',
  },
}

// Viewport mobile correct (zoom autorisé pour l'accessibilité).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${inter.variable} ${martianMono.variable} h-full antialiased`}
    >
      <body className="min-h-full"><Providers>{children}</Providers><CookieBanner /></body>
    </html>
  )
}
