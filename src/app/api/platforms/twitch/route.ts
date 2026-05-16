import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getTwitchToken(): Promise<string> {
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
  })
  const data = await res.json()
  return data.access_token
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const platform = await prisma.platform.findUnique({
    where: { userId_type: { userId: session.user.id, type: 'twitch' } },
  })

  if (!platform) {
    return NextResponse.json({ error: 'Plateforme Twitch non connectée' }, { status: 404 })
  }

  return NextResponse.json({ platform })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { username } = await req.json()
  if (!username) {
    return NextResponse.json({ error: 'username requis' }, { status: 400 })
  }

  const token = await getTwitchToken()

  const userRes = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`,
    { headers: { 'Client-Id': process.env.TWITCH_CLIENT_ID!, Authorization: `Bearer ${token}` } }
  )
  const userData = await userRes.json()
  if (!userData.data?.length) {
    return NextResponse.json({ error: 'Utilisateur Twitch introuvable' }, { status: 404 })
  }

  const user = userData.data[0]
  const channelRes = await fetch(
    `https://api.twitch.tv/helix/channels?broadcaster_id=${user.id}`,
    { headers: { 'Client-Id': process.env.TWITCH_CLIENT_ID!, Authorization: `Bearer ${token}` } }
  )
  const channelData = await channelRes.json()
  const channel = channelData.data?.[0] ?? {}

  const stats = { followersCount: 0, game: channel.game_name }

  const platform = await prisma.platform.upsert({
    where: { userId_type: { userId: session.user.id, type: 'twitch' } },
    update: { stats, lastFetched: new Date(), displayName: user.display_name, platformId: user.id, username: user.login, avatarUrl: user.profile_image_url },
    create: { userId: session.user.id, type: 'twitch', platformId: user.id, username: user.login, displayName: user.display_name, avatarUrl: user.profile_image_url, stats, lastFetched: new Date() },
  })

  return NextResponse.json({ platform })
}
