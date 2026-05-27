import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isRateLimited } from "@/lib/redis"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import nodemailer from "nodemailer"
import { Resend } from "resend"
import { z } from "zod"

const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8)
    .max(128)
    .refine(p => /[A-Z]/.test(p), { message: "Doit contenir une majuscule" })
    .refine(p => /[a-z]/.test(p), { message: "Doit contenir une minuscule" })
    .refine(p => /[0-9]/.test(p), { message: "Doit contenir un chiffre" })
    .refine(p => /[^A-Za-z0-9]/.test(p), { message: "Doit contenir un caractère spécial" }),
})

function getAppUrl(reqUrl: string) {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return new URL(reqUrl).origin
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const emailHtml = (verifyUrl: string) => `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
    <h2 style="color:#16a34a;margin-bottom:8px">Bienvenue sur Sponsorable !</h2>
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

async function sendVerificationEmail(email: string, verifyUrl: string) {
  // Production : Resend
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
      to: email,
      subject: "Confirmez votre adresse email — Sponsorable",
      html: emailHtml(verifyUrl),
    })
    if (error) throw new Error(`[resend] ${JSON.stringify(error)}`)
    return
  }

  // Dev : Ethereal (aperçu en ligne, aucune config requise)
  const testAccount = await nodemailer.createTestAccount()
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  })
  const info = await transporter.sendMail({
    from: '"Sponsorable" <noreply@sponsorable.gg>',
    to: email,
    subject: "Confirmez votre adresse email — Sponsorable",
    html: emailHtml(verifyUrl),
  })
  if (process.env.NODE_ENV !== 'production') {
    console.log("[ethereal] aperçu email (dev uniquement):", nodemailer.getTestMessageUrl(info))
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const limited = await isRateLimited(`register:${ip}`, 5, 3600)
    if (limited) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessaie dans une heure." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data
    const hashedPassword = await bcrypt.hash(password, 10)
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 24 * 3600 * 1000)

    const isDev = process.env.NODE_ENV !== "production"
    const hasEmailService = !!process.env.RESEND_API_KEY
    // Auto-vérifier en dev sans service email configuré
    const autoVerify = isDev && !hasEmailService

    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { email } })
        if (existing) throw new Error("EMAIL_TAKEN")

        await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            emailVerified: autoVerify ? new Date() : null,
          },
        })

        if (!autoVerify) {
          await tx.verificationToken.create({
            data: { identifier: email, token, expires },
          })
        }
      })
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_TAKEN") {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 })
      }
      throw err
    }

    if (autoVerify) {
      console.log("\n✅  Compte créé + email auto-vérifié (dev sans Resend)")
      return NextResponse.json(
        { message: "Compte créé ! Tu peux maintenant te connecter.", autoVerified: true },
        { status: 201 }
      )
    }

    const verifyUrl = `${getAppUrl(req.url)}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`

    try {
      await sendVerificationEmail(email, verifyUrl)
    } catch (err) {
      console.error("[register] échec envoi email:", err)
      // Rollback : supprimer l'utilisateur et le token pour ne pas créer de compte sans email
      await prisma.$transaction([
        prisma.verificationToken.deleteMany({ where: { identifier: email } }),
        prisma.user.delete({ where: { email } }),
      ]).catch(() => { /* best effort */ })
      return NextResponse.json(
        { error: "Impossible d'envoyer l'email de confirmation. Réessaie dans quelques instants." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: "Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.",
        ...(isDev && { devVerifyUrl: verifyUrl }),
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
