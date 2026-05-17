import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Twitch from "next-auth/providers/twitch"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
        Twitch({
            clientId: process.env.AUTH_TWITCH_ID,
            clientSecret: process.env.AUTH_TWITCH_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    scope: "openid user:read:email user:read:follows moderator:read:followers",
                },
            },
        }),
        Credentials({
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
                    throw new Error("Veuillez confirmer votre email avant de vous connecter")
                }
                
                return user
            }
        })
    ],
    debug: true,
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirige vers le login
            }
            return true;
        },
        async signIn({ user, account, profile }) {
             if (account?.provider === 'google' || account?.provider === 'twitch') {
                 const name = profile?.name || user.name;
                 const image = profile?.picture || profile?.image || user.image;
                 if (name || image) {
                     await prisma.user.update({
                         where: { id: user.id },
                         data: { name, image }
                     }).catch(() => null);
                     
                     user.name = name;
                     user.image = image;
                 }
             }
             return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.name = user.name
                token.picture = user.image
            }
            return token
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.name = token.name as string
                session.user.image = token.picture as string
            }
            return session
        },
    },
})