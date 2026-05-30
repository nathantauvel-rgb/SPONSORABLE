import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

// Middleware Edge-safe : utilise uniquement auth.config.ts (sans bcrypt ni Prisma)
export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: ['/dashboard/:path*'],
}

