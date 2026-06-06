import type { Metadata } from 'next'
import { Space_Grotesk, Hanken_Grotesk, Syne, Martian_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import Providers from '@/components/providers'
import CookieBanner from '@/components/CookieBanner'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
})

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
})

/* Syne — corps / labels / UI de la landing et du dashboard */
const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
})

/* Martian Mono — chiffres métriques (substitut libre de Berkeley Mono, look carré/terminal).
   Pour passer au vrai Berkeley Mono : déposer les .woff2 dans src/app/fonts/ et
   remplacer ce bloc par un localFont pointant dessus. */
const martianMono = Martian_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-num',
})

/* Cabinet Grotesk — titres display (auto-hébergé, Fontshare/ITF, licence gratuite) */
const cabinetGrotesk = localFont({
  src: [
    { path: './fonts/CabinetGrotesk-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/CabinetGrotesk-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/CabinetGrotesk-Extrabold.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sponsorable — Ton media kit pour créateurs gaming',
  description:
    'Connecte YouTube et Twitch, génère un media kit professionnel et partage un lien à tes sponsors en 2 minutes.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${hankenGrotesk.variable} ${syne.variable} ${martianMono.variable} ${cabinetGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full"><Providers>{children}</Providers><CookieBanner /></body>
    </html>
  )
}
