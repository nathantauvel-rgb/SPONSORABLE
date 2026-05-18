import type { Metadata } from 'next'

export async function generateMetadata(
  { params }: { params: Promise<{ pseudo: string }> }
): Promise<Metadata> {
  const { pseudo } = await params
  return {
    title: `${pseudo} — Media Kit`,
    description: `Découvrez le media kit de ${pseudo} et proposez un partenariat.`,
    robots: { index: true, follow: false },
    openGraph: {
      title: `${pseudo} — Media Kit`,
      description: `Découvrez le media kit de ${pseudo} et proposez un partenariat.`,
      type: 'profile',
    },
    twitter: { card: 'summary' },
  }
}

export default function PseudoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
