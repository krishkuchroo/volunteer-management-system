const Redis = require('ioredis');

let client = null;
let available = false;

function getClient() {
  if (!client) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      enableOfflineQueue: false,
    });

    client.on('connect', () => {
      available = true;
      console.log('Redis connected');
    });

    client.on('error', (err) => {
      if (available) {
        console.warn('Redis error — caching disabled:', err.message);
      }
      available = false;
    });

    client.on('close', () => {
      available = false;
    });

    client.connect().catch(() => {
      console.warn('Redis unavailable — running without cache');
    });
  }
  return client;
}

async function getCached(key, fetchFn, ttlSeconds = 300) {
  try {
    const redis = getClient();
    if (!available) return fetchFn();

    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const data = await fetchFn();
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
    return data;
  } catch {
    return fetchFn();
  }
}

async function invalidateCache(...keys) {
  try {
    const redis = getClient();
    if (!available || keys.length === 0) return;
    await redis.del(...keys);
  } catch {
    // non-fatal
  }
}

async function invalidatePattern(pattern) {
  try {
    const redis = getClient();
    if (!available) return;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // non-fatal
  }
}

module.exports = { getCached, invalidateCache, invalidatePattern };
