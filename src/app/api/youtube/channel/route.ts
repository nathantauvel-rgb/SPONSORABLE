import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

async function refreshGoogleToken(account: { id: string; refresh_token: string | null }) {
  if (!account.refresh_token) return null
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
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
      expires_at: Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 3600),
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
    where: { userId: session.user.id, provider: 'google' },
  })

  if (!account?.access_token) {
    return NextResponse.json({ error: 'Compte Google non lié' }, { status: 404 })
  }

  let token = account.access_token

  // Refresh if expired
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    const refreshed = await refreshGoogleToken(account)
    if (!refreshed) {
      return NextResponse.json({ error: 'Token expiré, reconnecte-toi avec Google' }, { status: 401 })
    }
    token = refreshed
  }

  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()

  if (data.error) {
    // Token might be revoked — try refresh once
    if (data.error.code === 401) {
      const refreshed = await refreshGoogleToken(account)
      if (refreshed) {
        const retry = await fetch(
          'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
          { headers: { Authorization: `Bearer ${refreshed}` } }
        )
        const retryData = await retry.json()
        if (!retryData.error && retryData.items?.length) {
          const ch = retryData.items[0]
          return NextResponse.json(formatChannel(ch))
        }
      }
    }
    return NextResponse.json({ error: data.error.message }, { status: 400 })
  }

  if (!data.items?.length) {
    return NextResponse.json({ error: 'Aucune chaîne YouTube associée à ce compte' }, { status: 404 })
  }

  return NextResponse.json(formatChannel(data.items[0]))
}

function formatChannel(ch: any) {
  return {
    channelId: ch.id,
    title: ch.snippet.title,
    thumbnail: ch.snippet.thumbnails?.default?.url ?? null,
    subscriberCount: ch.statistics.subscriberCount ?? '0',
    viewCount: ch.statistics.viewCount ?? '0',
    videoCount: ch.statistics.videoCount ?? '0',
    lastFetched: new Date().toISOString(),
  }
}
