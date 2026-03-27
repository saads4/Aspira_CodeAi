// ─── Worker Entry Point ─────────────────────────────────────────
// Run as a separate process:  node src/worker.js
// Listens to the BullMQ "sample-processing" queue and processes
// each job via the sampleProcessor handler.
// ────────────────────────────────────────────────────────────────
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const { getRedisConnection } = require('./config/redis');
const { connectDB } = require('./config/db');
const { loadEdos } = require('./services/edosLoader');
const { processSample } = require('./workers/sampleProcessor');
const logger = require('./utils/logger');

let worker = null;

async function startWorker() {
  // Connect MongoDB
  await connectDB();

  // Load EDOS into memory
  const redis = getRedisConnection();
  await loadEdos(redis);

  // Create BullMQ worker
  worker = new Worker(
    'sample-processing',
    async (job) => {
      return processSample(job);
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,           // process up to 5 jobs concurrently
      limiter: {
        max: 20,
        duration: 1000,         // max 20 jobs/sec
      },
    }
  );

  worker.on('completed', (job, result) => {
    logger.success(`Job ${job.id} completed → ${result?.sample_id || 'OK'}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error(`Worker error: ${err.message}`);
  });

  logger.info('🏭 Worker started — listening to "sample-processing" queue');
}

// ── Graceful Shutdown ───────────────────────────────────────
async function shutdown(signal) {
  logger.warn(`${signal} received — shutting down worker gracefully...`);

  if (worker) {
    await worker.close();
    logger.info('BullMQ worker closed');
  }

  try {
    const redis = getRedisConnection();
    await redis.quit();
    logger.info('Redis connection closed');
  } catch (_) { /* best effort */ }

  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (_) { /* best effort */ }

  process.exit(0);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startWorker().catch((err) => {
  logger.error(`Worker startup failed: ${err.message}`);
  process.exit(1);
});
