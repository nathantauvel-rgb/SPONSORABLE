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
        // Scopes basiques uniquement pour le login : non-sensibles, donc accessibles
        // à tout le monde sans vérification Google. Les scopes YouTube (sensibles)
        // sont demandés à la demande lors de la connexion de la chaîne (cf. dashboard
        // signIn('google', ..., YOUTUBE_AUTH_PARAMS)) — autorisation incrémentale.
        authorization: {
            params: {
                scope: "openid email profile",
            },
        },
    }))
}

if (AUTH_TWITCH_ID && AUTH_TWITCH_SECRET) {
    providers.push(Twitch({
        clientId: AUTH_TWITCH_ID,
        clientSecret: AUTH_TWITCH_SECRET,
        // Permet de RELIER Twitch à un compte existant quand l'email correspond.
        // Sans ça, après une déconnexion (Account supprimé), la reconnexion lève
        // `OAuthAccountNotLinked` car Auth.js retrouve l'utilisateur par email mais
        // sans compte Twitch lié. Cohérent avec Google. La connexion Twitch reste
        // déclenchée uniquement depuis le dashboard (utilisateur déjà connecté).
        allowDangerousEmailAccountLinking: true,
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
    pages: {
        signIn: '/login',
        error: '/login',
    },
    providers,
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google' || account?.provider === 'twitch') {
                // C'est un linking si l'utilisateur a déjà au moins un Account en base
                // (qu'il se soit inscrit avec email/password OU avec un autre OAuth)
                const existingAccountCount = await prisma.account.count({
                    where: { userId: user.id },
                })
                const isLinking = existingAccountCount > 0
                if (isLinking) {
                    // Connexion de plateforme uniquement — ne pas écraser le profil Sponsorable
                    return true
                }
                // Première vraie connexion OAuth — mettre à jour le profil avec les données du provider
                if (user.name || user.image) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { name: user.name ?? undefined, image: user.image ?? undefined }
                    }).catch(err => { console.error('[auth] user update failed', err) })
                }
            }
            return true
        },
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id
                // Lire depuis la DB pour éviter qu'un OAuth de linking (Twitch, Google)
                // écrase le nom/avatar du compte Sponsorable dans le JWT
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id as string },
                    select: { name: true, image: true },
                })
                token.name = dbUser?.name ?? user.name
                token.picture = dbUser?.image ?? user.image
            }
            // Quand update() est appelé côté client (après connect/disconnect plateforme),
            // on relit le profil depuis la DB pour refléter la nouvelle image
            if (trigger === 'update' && token.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { name: true, image: true },
                })
                if (dbUser) {
                    token.name = dbUser.name ?? token.name
                    token.picture = dbUser.image ?? token.picture
                }
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
        async redirect({ url, baseUrl }) {
            // Normaliser les URLs relatives (`/dashboard?...`) en absolu. Sans ça, le
            // test `startsWith(baseUrl)` échouait sur une URL relative et on retombait
            // sur `/dashboard` nu — en EFFAÇANT le `?connected=` → la liaison plateforme
            // ne se déclenchait jamais côté client.
            const target = url.startsWith('/') ? `${baseUrl}${url}` : url
            // Préserver les retours de liaison plateforme (?connected=youtube|twitch)
            if (target.startsWith(baseUrl) && target.includes('connected=')) {
                return target
            }
            // Sinon, toujours atterrir sur /dashboard après login (évite d'atterrir sur
            // une page profonde type /dashboard/mediakit quand la session expire).
            return `${baseUrl}/dashboard`
        },
    },
})
