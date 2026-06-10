import Redis from 'ioredis';
import logger from './logger.js';

let redisClient = null;
let pubClient = null;
let subClient = null;

const createRedisClient = (name = 'main') => {
  const client = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: 0,
    lazyConnect: false,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 10) {
        logger.error(`Redis (${name}) max retries exceeded`);
        return null;
      }
      const delay = Math.min(times * 500, 5000);
      logger.warn(`Redis (${name}) reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });

  client.on('connect', () => logger.info(`Redis (${name}) connecting...`));
  client.on('ready', () => logger.info(`Redis (${name}) ready`));
  client.on('error', (err) => logger.error(`Redis (${name}) error: ${err.message}`));
  client.on('close', () => logger.warn(`Redis (${name}) connection closed`));
  client.on('reconnecting', () => logger.warn(`Redis (${name}) reconnecting...`));
  client.on('end', () => logger.error(`Redis (${name}) connection ended`));

  return client;
};

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createRedisClient('main');
  }
  return redisClient;
};

export const getPubClient = () => {
  if (!pubClient) {
    pubClient = createRedisClient('pub');
  }
  return pubClient;
};

export const getSubClient = () => {
  if (!subClient) {
    subClient = createRedisClient('sub');
  }
  return subClient;
};

export const checkRedisConnection = async () => {
  try {
    const client = getRedisClient();
    const pong = await client.ping();
    return pong === 'PONG' ? 'connected' : 'disconnected';
  } catch {
    return 'disconnected';
  }
};

export default getRedisClient;
