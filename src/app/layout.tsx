import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
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
    <html lang="fr" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full"><Providers>{children}</Providers></body>
    </html>
  )
}
