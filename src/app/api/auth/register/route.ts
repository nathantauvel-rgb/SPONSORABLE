import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import nodemailer from "nodemailer"

// Configuration Nodemailer (utilise Ethereal en mode dev pour tester gratuitement sans config)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  auth: {
    user: process.env.EMAIL_SERVER_USER || 'leola.steuber@ethereal.email',
    pass: process.env.EMAIL_SERVER_PASSWORD || 'E7XpU2gqZK7TqG8YyW',
  },
})

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 })
    }

    // Password validation
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    if (!(password.length >= minLength && hasUpper && hasLower && hasNumber && hasSpecial)) {
      return NextResponse.json({ 
        error: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial." 
      }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Génération du token
    const token = crypto.randomUUID()
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 heures
      },
    })

    // Envoi de l'email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`
    
    const mailOptions = {
      from: '"Sponsorable" <noreply@sponsorable.gg>',
      to: email,
      subject: "Confirmez votre adresse email - Sponsorable",
      html: `
        <h1>Bienvenue sur Sponsorable !</h1>
        <p>Merci de vous être inscrit. Veuillez cliquer sur le lien ci-dessous pour confirmer votre adresse email :</p>
        <a href="${verificationUrl}" style="display:inline-block;padding:10px 20px;background-color:#16a34a;color:white;text-decoration:none;border-radius:5px;">Confirmer mon email</a>
        <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
      `,
    }

    try {
      const info = await transporter.sendMail(mailOptions)
      
      // En dev (Ethereal), on log l'URL pour voir l'email sans boîte mail
      if (!process.env.EMAIL_SERVER_HOST || process.env.EMAIL_SERVER_HOST.includes('ethereal')) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
      }
    } catch (emailError: any) {
      console.error("Erreur d'envoi d'email:", emailError)
      // Si l'envoi échoue (ex: port bloqué), on renvoie le lien directement en mode dev pour ne pas bloquer l'utilisateur
      if (process.env.NODE_ENV !== "production") {
         console.log("LIEN DE VALIDATION DE SECOURS : ", verificationUrl)
         return NextResponse.json({ 
           message: "Compte créé. L'envoi d'email a échoué mais vous êtes en mode dev. Regardez le terminal pour le lien de validation." 
         }, { status: 201 })
      }
      return NextResponse.json({ error: "Compte créé mais impossible d'envoyer l'email de confirmation." }, { status: 500 })
    }

    return NextResponse.json({ message: "Compte créé. Veuillez vérifier vos emails." }, { status: 201 })
  } catch (error: any) {
    console.error("Erreur lors de l'inscription:", error)
    return NextResponse.json({ error: error.message || "Erreur interne du serveur" }, { status: 500 })
  }
}
