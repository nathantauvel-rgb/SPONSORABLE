import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { isRateLimited } from '@/lib/redis'
import { z } from 'zod'

const ContactSchema = z.object({
  slug: z.string().min(1).max(64),
  company: z.string().min(1).max(200),
  budget: z.string().min(1).max(100),
  type: z.string().min(1).max(100),
  message: z.string().min(1).max(5000),
})

// Échappe le HTML pour empêcher l'injection de contenu/phishing dans l'email
// envoyé au créateur (les champs viennent d'un formulaire public non authentifié).
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    // Rate-limit : empêche le spam de messages et l'email-bombing du créateur.
    if (await isRateLimited(`contact:${ip}`, 5, 3600)) {
      return NextResponse.json({ error: 'Trop de demandes. Réessaie plus tard.' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = ContactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const { slug, company, budget, type, message } = parsed.data

    const profile = await prisma.profile.findUnique({
      where: { slug },
      select: { id: true, isPublic: true, user: { select: { email: true, name: true } } },
    })

    if (!profile || !profile.isPublic) {
      return NextResponse.json({ error: 'Page introuvable' }, { status: 404 })
    }

    await prisma.message.create({
      data: { profileId: profile.id, company, budget, type, message },
    })

    // Envoi email si Resend est configuré
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (RESEND_API_KEY && profile.user.email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Sponsorable <noreply@sponsorable.gg>',
          to: profile.user.email,
          subject: `💼 Nouvelle proposition de ${company}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
              <h2 style="color:#0f172a;margin-bottom:4px">Nouvelle proposition de partenariat</h2>
              <p style="color:#64748b;margin-bottom:24px">Reçue via ton media kit Sponsorable</p>
              <div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:16px">
                <p style="margin:0 0 12px"><strong>Entreprise :</strong> ${escapeHtml(company)}</p>
                <p style="margin:0 0 12px"><strong>Budget :</strong> ${escapeHtml(budget)}</p>
                <p style="margin:0 0 12px"><strong>Type :</strong> ${escapeHtml(type)}</p>
                <p style="margin:0"><strong>Message :</strong><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
              </div>
              <a href="https://sponsorable.gg/dashboard/messages" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">
                Voir dans le dashboard →
              </a>
            </div>
          `,
        }),
      }).catch(err => { console.error('[contact] échec envoi email notification:', err) })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
