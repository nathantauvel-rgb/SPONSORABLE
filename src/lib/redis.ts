import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL
if (!REDIS_URL) throw new Error('Missing env var: REDIS_URL')

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis =
  globalForRedis.redis ??
  new Redis(REDIS_URL)

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
