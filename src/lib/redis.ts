import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

export const redis: Redis | null = REDIS_URL
  ? (globalForRedis.redis ?? new Redis(REDIS_URL, { lazyConnect: true, enableOfflineQueue: false }))
  : null

if (process.env.NODE_ENV !== 'production' && redis) globalForRedis.redis = redis

/**
 * Rate limit par clé. Retourne true si la limite est dépassée.
 * Si Redis n'est pas configuré, laisse passer (fail open).
 */
export async function isRateLimited(key: string, max: number, windowSeconds: number): Promise<boolean> {
  if (!redis) return false
  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, windowSeconds)
    return count > max
  } catch {
    return false
  }
}
