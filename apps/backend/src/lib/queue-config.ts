import IORedis, { type RedisOptions } from 'ioredis';
import { env } from '../config/env';

export const RESUME_GENERATION_QUEUE = 'resume-generation';

/** Creates a new Redis connection from `REDIS_URL`; each Queue and Worker needs its own. */
export function createRedisConnection(options: RedisOptions = {}) {
  return new IORedis(env.REDIS_URL, options);
}
