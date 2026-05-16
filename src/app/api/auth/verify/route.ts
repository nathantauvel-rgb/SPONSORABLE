import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  if (!token || !email) {
    return new NextResponse("Token ou email manquant", { status: 400 })
  }

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
    })

    if (!verificationToken) {
      return new NextResponse("Token invalide", { status: 400 })
    }

    if (new Date() > verificationToken.expires) {
      return new NextResponse("Token expiré", { status: 400 })
    }

    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    })

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
    })

    return NextResponse.redirect(new URL(`/login?verified=1&email=${encodeURIComponent(email)}`, req.url))
  } catch (error) {
    console.error("Erreur lors de la vérification:", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}
