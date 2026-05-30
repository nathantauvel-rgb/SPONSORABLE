import { NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const QuerySchema = z.object({
  token: z.string().min(1).max(128),
  email: z.string().email().max(255),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    token: searchParams.get("token"),
    email: searchParams.get("email"),
  })

  if (!parsed.success) {
    return new NextResponse("Paramètres invalides", { status: 400 })
  }

  const { token, email } = parsed.data

  try {
    await prisma.$transaction(
      async (tx) => {
        const verificationToken = await tx.verificationToken.findUnique({
          where: { identifier_token: { identifier: email, token } },
        })

        if (!verificationToken) throw new Error("TOKEN_INVALID")
        if (new Date() > verificationToken.expires) throw new Error("TOKEN_EXPIRED")

        await tx.verificationToken.delete({
          where: { identifier_token: { identifier: email, token } },
        })

        await tx.user.update({
          where: { email },
          data: { emailVerified: new Date() },
        })
      },
      { isolationLevel: "Serializable" }
    )

    return NextResponse.redirect(new URL("/login?verified=1", req.url))
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "TOKEN_INVALID") return new NextResponse("Token invalide", { status: 400 })
      if (err.message === "TOKEN_EXPIRED") return new NextResponse("Token expiré", { status: 400 })
    }
    console.error("[verify] error", err)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}
