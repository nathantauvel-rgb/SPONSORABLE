import NextAuth, { type Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import Google from "next-auth/providers/google"
import Twitch from "next-auth/providers/twitch"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID
const AUTH_GOOGLE_SECRET = process.env.AUTH_GOOGLE_SECRET
const AUTH_TWITCH_ID = process.env.AUTH_TWITCH_ID
const AUTH_TWITCH_SECRET = process.env.AUTH_TWITCH_SECRET

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = []

if (AUTH_GOOGLE_ID && AUTH_GOOGLE_SECRET) {
    providers.push(Google({
        clientId: AUTH_GOOGLE_ID,
        clientSecret: AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: true,
        authorization: {
            params: {
                scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly",
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
            },
        },
    }))
}

if (AUTH_TWITCH_ID && AUTH_TWITCH_SECRET) {
    providers.push(Twitch({
        clientId: AUTH_TWITCH_ID,
        clientSecret: AUTH_TWITCH_SECRET,
        authorization: {
            params: {
                scope: "openid user:read:email user:read:follows moderator:read:followers channel:read:subscriptions",
            },
        },
    }))
}

providers.push(Credentials({
    name: "Credentials",
    credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
    },
    async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
            throw new Error("Email et mot de passe requis")
        }

        const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
        })

        if (!user || !user.password) {
            await new Promise(r => setTimeout(r, Math.random() * 400 + 100))
            throw new Error("Identifiants incorrects")
        }

        const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
        )

        if (!isPasswordValid) {
            throw new Error("Identifiants incorrects")
        }

        if (!user.emailVerified) {
            // En dev sans service email → auto-vérifier au passage
            if (process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { emailVerified: new Date() },
                })
            } else {
                throw new Error("EMAIL_NOT_VERIFIED")
            }
        }

        return user
    }
}))

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    debug: process.env.NODE_ENV === 'development',
    providers,
    callbacks: {
        authorized({ auth: session, request: { nextUrl } }) {
            const isLoggedIn = !!session?.user
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
            if (isOnDashboard) return isLoggedIn
            return true
        },
        async signIn({ user, account }) {
            if (account?.provider === 'google' || account?.provider === 'twitch') {
                // Vérifier si c'est un linking de plateforme (l'utilisateur a déjà un compte Credentials)
                // Dans ce cas on ne touche PAS au nom/image du compte Sponsorable
                const existingUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { password: true },
                })
                const isLinking = !!existingUser?.password
                if (isLinking) {
                    // Connexion de plateforme uniquement — ne pas écraser le profil Sponsorable
                    return true
                }
                // Première vraie connexion OAuth (sans compte Credentials) — mettre à jour le profil
                if (user.name || user.image) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { name: user.name ?? undefined, image: user.image ?? undefined }
                    }).catch(err => { console.error('[auth] user update failed', err) })
                }
            }
            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.name = user.name
                token.picture = user.image
            }
            return token
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.name = token.name as string
                session.user.image = token.picture as string
            }
            return session
        },
    },
})
