import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const PostSchema = z.object({
  username: z.string().trim().min(1).max(64),
})

const TWITCH_CLIENT_ID = process.env.AUTH_TWITCH_ID
const TWITCH_CLIENT_SECRET = process.env.AUTH_TWITCH_SECRET

async function getTwitchToken(): Promise<string> {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    throw new Error('Twitch credentials not configured')
  }
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  })
  const data = await res.json()
  return data.access_token as string
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const platform = await prisma.platform.findUnique({
    where: { userId_type: { userId: session.user.id, type: 'twitch' } },
    select: { id: true, type: true, platformId: true, username: true, displayName: true, avatarUrl: true, stats: true, lastFetched: true },
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

  const body = await req.json()
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Paramètres invalides' }, { status: 400 })
  }

  const { username } = parsed.data

  let token: string
  try {
    token = await getTwitchToken()
  } catch {
    return NextResponse.json({ error: 'Twitch API non configurée' }, { status: 503 })
  }

  const userRes = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`,
    { headers: { 'Client-Id': TWITCH_CLIENT_ID!, Authorization: `Bearer ${token}` } }
  )
  const userData = await userRes.json()
  if (!userData.data?.length) {
    return NextResponse.json({ error: 'Utilisateur Twitch introuvable' }, { status: 404 })
  }

  const twitchUser = userData.data[0]
  const channelRes = await fetch(
    `https://api.twitch.tv/helix/channels?broadcaster_id=${twitchUser.id}`,
    { headers: { 'Client-Id': TWITCH_CLIENT_ID!, Authorization: `Bearer ${token}` } }
  )
  const channelData = await channelRes.json()
  const channel = channelData.data?.[0] ?? {}

  const followersRes = await fetch(
    `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${twitchUser.id}`,
    { headers: { 'Client-Id': TWITCH_CLIENT_ID!, Authorization: `Bearer ${token}` } }
  )
  const followersData = followersRes.ok ? await followersRes.json() : null

  const stats = {
    followerCount: (followersData?.total as number) ?? 0,
    viewCount: (twitchUser.view_count as number) ?? 0,
    displayName: twitchUser.display_name as string,
    game: channel.game_name as string | undefined,
  }

  const platform = await prisma.platform.upsert({
    where: { userId_type: { userId: session.user.id, type: 'twitch' } },
    update: {
      stats,
      lastFetched: new Date(),
      displayName: twitchUser.display_name as string,
      platformId: twitchUser.id as string,
      username: twitchUser.login as string,
      avatarUrl: twitchUser.profile_image_url as string | undefined,
    },
    create: {
      userId: session.user.id,
      type: 'twitch',
      platformId: twitchUser.id as string,
      username: twitchUser.login as string,
      displayName: twitchUser.display_name as string,
      avatarUrl: twitchUser.profile_image_url as string | undefined,
      stats,
      lastFetched: new Date(),
    },
  })

  return NextResponse.json({ platform })
}
