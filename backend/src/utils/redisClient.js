const redis = require('redis');

let redisClient;
let isConnected = false;

async function initRedis() {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: false, // Prevent infinite retry loops if Redis is completely unavailable
    }
  });

  let errorLogged = false;
  redisClient.on('error', (err) => {
    if (!errorLogged) {
      console.warn('Redis connection failed. Caching will gracefully degrade.');
      errorLogged = true;
    }
    isConnected = false;
  });

  redisClient.on('connect', () => {
    console.log('Redis connected successfully');
    isConnected = true;
  });

  try {
    await redisClient.connect();
  } catch (err) {
    console.warn('Failed to connect to Redis. Caching will gracefully degrade.');
  }

  return redisClient;
}

function getRedisClient() {
  return isConnected ? redisClient : null;
}

module.exports = { initRedis, getRedisClient };
