/**
 * Backfill ponctuel — champs dénormalisés de l'annuaire marketplace.
 * ──────────────────────────────────────────────────────────────────────────
 * Les colonnes `Profile.sponsorScore` et `Profile.audienceTotal` viennent d'être
 * ajoutées : elles sont `null` sur tous les profils existants. Ce script les
 * calcule une fois pour l'existant (ensuite le cron + les routes les maintiennent).
 *
 * Lancer UNE fois après le `prisma db push` :
 *   npx tsx prisma/backfill-denormalization.ts
 *
 * Idempotent : relançable sans risque (recalcule, n'écrit pas de doublon).
 * Le champ `games` n'est pas backfillé (renseigné manuellement via le media kit).
 *
 * Note : import relatif de sponsorScore + chargement manuel du .env, pour ne PAS
 * dépendre de l'alias `@/` ni du chargement d'env de Next (script standalone).
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'
import {
  buildScoreInputs,
  computeUniversalScore,
  type ApiPlatform,
  type ApiProfile,
} from '../src/lib/sponsorScore'

// Le client Prisma standalone ne charge pas .env tout seul — on le fait à la main.
function loadEnv(): void {
  try {
    const content = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const key = m[1]
      let val = m[2].trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {
    // pas de .env lisible (env déjà injecté autrement) — on continue
  }
}
loadEnv()

const prisma = new PrismaClient()

function toArray<T = string>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

async function main(): Promise<void> {
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      userId: true,
      bio: true,
      niche: true,
      formats: true,
      positioningPhrase: true,
      country: true,
      languages: true,
      availableForCollabs: true,
      calendlyUrl: true,
      targetBrands: true,
      partnerships: true,
    },
  })
  console.log(`[backfill] ${profiles.length} profil(s) à traiter`)

  let ok = 0
  for (const profile of profiles) {
    const platforms = await prisma.platform.findMany({
      where: { userId: profile.userId },
      select: { type: true, stats: true },
    })

    const apiPlatforms: ApiPlatform[] = platforms.map((p) => ({
      type: p.type,
      stats: (p.stats ?? null) as Record<string, unknown> | null,
    }))

    const apiProfile: ApiProfile = {
      bio: profile.bio,
      niche: profile.niche,
      formats: toArray<string>(profile.formats),
      positioningPhrase: profile.positioningPhrase,
      country: profile.country,
      languages: toArray<string>(profile.languages),
      availableForCollabs: profile.availableForCollabs,
      calendlyUrl: profile.calendlyUrl,
      targetBrands: profile.targetBrands,
      partnerships: toArray<unknown>(profile.partnerships),
    }

    const result = computeUniversalScore(buildScoreInputs(apiPlatforms, apiProfile))
    const audienceTotal = result.platforms.reduce((s, p) => s + (p.audienceCount ?? 0), 0)

    await prisma.profile.update({
      where: { id: profile.id },
      data: { sponsorScore: result.globalScore, audienceTotal },
    })
    ok++
    console.log(`[backfill] ${profile.userId} → score=${result.globalScore} audience=${audienceTotal}`)
  }

  console.log(`[backfill] terminé — ${ok}/${profiles.length} profil(s) mis à jour`)
}

main()
  .catch((e) => {
    console.error('[backfill] échec', e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
