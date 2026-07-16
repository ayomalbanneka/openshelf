import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

export default redis;
