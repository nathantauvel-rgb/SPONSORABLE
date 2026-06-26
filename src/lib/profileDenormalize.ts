/**
 * Dénormalisation du Profil pour l'annuaire marketplace.
 * ──────────────────────────────────────────────────────────────────────────
 * Le score de sponsorabilité et la taille d'audience ne sont PAS stockés : ils
 * sont calculés à la volée par `sponsorScore.ts` depuis le JSON des plateformes.
 * Pour pouvoir FILTRER et TRIER l'annuaire en SQL (sans recalculer pour chaque
 * créateur à chaque requête), on cache ici ces deux valeurs sur `Profile`
 * (`sponsorScore`, `audienceTotal`).
 *
 * Appelé après toute mise à jour qui peut faire bouger le score :
 *   - cron de refresh des stats (quotidien)
 *   - refresh manuel des stats (dashboard)
 *   - sauvegarde du media kit (complétude éditoriale, dispo collab…)
 *
 * Le champ `games` n'est PAS touché ici : il est renseigné directement par le
 * créateur via l'éditeur media kit (texte structuré), pas dérivé des stats.
 *
 * Conçu pour être NON BLOQUANT : toute erreur est avalée et loggée, elle ne doit
 * jamais faire échouer l'opération appelante (refresh stats, sauvegarde profil).
 */

import { prisma } from '@/lib/prisma'
import {
  buildScoreInputs,
  computeUniversalScore,
  type ApiPlatform,
  type ApiProfile,
} from '@/lib/sponsorScore'

/** Coerce un champ Json Prisma (formats, languages, partnerships) en tableau. */
function toArray<T = string>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

/**
 * Recalcule et persiste les champs dénormalisés (`sponsorScore`, `audienceTotal`)
 * du profil d'un utilisateur. No-op silencieux si l'utilisateur n'a pas de profil.
 */
export async function recomputeProfileDenormalization(userId: string): Promise<void> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        id: true,
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
    if (!profile) return // l'utilisateur n'est pas un créateur — rien à dénormaliser

    const platforms = await prisma.platform.findMany({
      where: { userId },
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

    const audienceTotal = result.platforms.reduce(
      (sum, p) => sum + (p.audienceCount ?? 0),
      0,
    )

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        sponsorScore: result.globalScore,
        audienceTotal,
      },
    })
  } catch (err) {
    // Non bloquant : un échec de dénormalisation ne doit jamais casser l'appelant.
    console.error('[profileDenormalize] échec recompute pour user', userId, err)
  }
}
