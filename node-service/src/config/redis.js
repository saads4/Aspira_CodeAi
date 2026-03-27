// ─── Redis Connection (IORedis) ─────────────────────────────────
const Redis = require('ioredis');
const { REDIS_URL } = require('./env');
const logger = require('../utils/logger');

let connection = null;

/**
 * Get or create the shared Redis connection.
 */
function getRedisConnection() {
  if (connection) return connection;

  connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,   // required by BullMQ
    enableReadyCheck: false,
  });

  connection.on('connect', () => logger.info('Redis connected'));
  connection.on('error', (err) => logger.error(`Redis error: ${err.message}`));

  return connection;
}

module.exports = { getRedisConnection };
