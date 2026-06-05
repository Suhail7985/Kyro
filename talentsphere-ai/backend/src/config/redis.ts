import { createClient } from 'redis';
import { env } from './env';

export const redisClient = createClient({
  url: env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis connected successfully'));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (err) {
      console.warn('Failed to connect to Redis. Caching will be disabled if this persists.', err);
    }
  }
}
