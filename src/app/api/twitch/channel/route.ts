import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

async function refreshTwitchToken(account: { id: string; refresh_token: string | null }) {
  if (!account.refresh_token) return null
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AUTH_TWITCH_ID!,
      client_secret: process.env.AUTH_TWITCH_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: account.refresh_token,
    }),
  })
  const tokens = await res.json()
  if (!tokens.access_token) return null
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? account.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 14400),
    },
  })
  return tokens.access_token as string
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: 'twitch' },
  })

  if (!account?.access_token) {
    return NextResponse.json({ error: 'Compte Twitch non lié' }, { status: 404 })
  }

  let token = account.access_token

  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    const refreshed = await refreshTwitchToken(account)
    if (!refreshed) {
      return NextResponse.json({ error: 'Token expiré, reconnecte-toi avec Twitch' }, { status: 401 })
    }
    token = refreshed
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Client-Id': process.env.AUTH_TWITCH_ID!,
  }

  const userRes = await fetch('https://api.twitch.tv/helix/users', { headers })
  const userData = await userRes.json()

  if (!userData.data?.length) {
    return NextResponse.json({ error: 'Utilisateur Twitch introuvable' }, { status: 404 })
  }

  const user = userData.data[0]

  // Follower count (broadcaster reads own channel with moderator:read:followers)
  const followersRes = await fetch(
    `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`,
    { headers }
  )
  const followersData = await followersRes.json()

  return NextResponse.json({
    userId: user.id,
    login: user.login,
    displayName: user.display_name,
    profileImageUrl: user.profile_image_url,
    viewCount: user.view_count ?? 0,
    followerCount: followersData.total ?? 0,
    lastFetched: new Date().toISOString(),
  })
}
