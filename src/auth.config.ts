import type { NextAuthConfig } from 'next-auth'

// Config Edge-safe : pas de bcrypt, pas de Prisma, pas de Node.js crypto.
// Utilisée uniquement par le middleware (Edge Runtime).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      if (isOnDashboard) return isLoggedIn
      return true
    },
  },
  providers: [], // les vrais providers sont dans auth.ts (Node.js uniquement)
}
