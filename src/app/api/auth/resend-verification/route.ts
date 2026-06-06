import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { isRateLimited } from '@/lib/redis'
import { z } from 'zod'
import crypto from 'crypto'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'

const Schema = z.object({ email: z.string().email() })

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const emailHtml = (verifyUrl: string) => `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
    <h2 style="color:#16a34a;margin-bottom:8px">Confirmez votre email — Sponsorable</h2>
    <p style="color:#475569;line-height:1.6">
      Clique sur le bouton ci-dessous pour confirmer ton adresse email.<br>
      Le lien expire dans <strong>24h</strong>.
    </p>
    <a href="${escapeHtml(verifyUrl)}"
       style="display:inline-block;margin:24px 0;padding:12px 28px;background:#16a34a;color:white;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px">
      Confirmer mon email →
    </a>
    <p style="color:#94a3b8;font-size:12px">Si tu n'as pas créé de compte, ignore cet email.</p>
  </div>
`

function getAppUrl(reqUrl: string) {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return new URL(reqUrl).origin
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  // Rate-limit : empêche l'email-bombing d'une adresse tierce + l'épuisement du quota Resend.
  if (await isRateLimited(`resend-verif:${ip}`, 5, 3600)) {
    return NextResponse.json({ error: 'Trop de demandes. Réessaie plus tard.' }, { status: 429 })
  }

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })

  const { email } = parsed.data

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, emailVerified: true } })

  // Toujours répondre 200 pour ne pas exposer si l'email existe
  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true })
  }

  // Supprimer l'ancien token si existant
  await prisma.verificationToken.deleteMany({ where: { identifier: email } }).catch(() => {})

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 3600 * 1000)
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } })

  const verifyUrl = `${getAppUrl(req.url)}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`
  const isDev = process.env.NODE_ENV !== 'production'

  if (isDev) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧  LIEN DE CONFIRMATION (resend, mode dev)')
    console.log('   ', verifyUrl)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
      to: email,
      subject: 'Confirmez votre adresse email — Sponsorable',
      html: emailHtml(verifyUrl),
    }).catch(err => { console.error('[resend-verification] échec envoi email:', err) })
  } else {
    const testAccount = await nodemailer.createTestAccount()
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
    const info = await transporter.sendMail({
      from: '"Sponsorable" <noreply@sponsorable.gg>',
      to: email,
      subject: 'Confirmez votre adresse email — Sponsorable',
      html: emailHtml(verifyUrl),
    })
    console.log('Aperçu Ethereal :', nodemailer.getTestMessageUrl(info))
  }

  return NextResponse.json({
    ok: true,
    ...(isDev && { devVerifyUrl: verifyUrl }),
  })
}
