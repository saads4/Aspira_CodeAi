// ─── Worker Entry Point ─────────────────────────────────────────
// Run as a separate process:  node src/worker.js
// Listens to BullMQ queues:
//   - "sample-processing" (ingestion pipeline)
//   - "result-processing" (result completion pipeline)
// ────────────────────────────────────────────────────────────────
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const { getRedisConnection } = require('./config/redis');
const { connectDB } = require('./config/db');
const { loadEdos } = require('./services/edosLoader');
const { processSample } = require('./workers/sampleProcessor');
const { processResult } = require('./workers/resultWorker');
const logger = require('./utils/logger');

let sampleWorker = null;
let resultWorker = null;

async function startWorker() {
  // Connect MongoDB
  await connectDB();

  // Load EDOS into memory
  const redis = getRedisConnection();
  await loadEdos(redis);

  // ── Sample-processing worker (existing) ─────────────────────
  sampleWorker = new Worker(
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

  sampleWorker.on('completed', (job, result) => {
    logger.success(`Job ${job.id} completed → ${result?.sample_id || 'OK'}`);
  });

  sampleWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`);
  });

  sampleWorker.on('error', (err) => {
    logger.error(`Sample worker error: ${err.message}`);
  });

  logger.info('🏭 Worker started — listening to "sample-processing" queue');

  // ── Result-processing worker (new) ──────────────────────────
  resultWorker = new Worker(
    'result-processing',
    async (job) => {
      return processResult(job);
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
      limiter: {
        max: 20,
        duration: 1000,
      },
    }
  );

  resultWorker.on('completed', (job, result) => {
    if (result?.skipped) {
      logger.warn(`Result job ${job.id} skipped (already completed)`);
    } else {
      logger.success(`Result job ${job.id} completed → ${result?.sample_id || 'OK'}`);
    }
  });

  resultWorker.on('failed', (job, err) => {
    logger.error(`Result job ${job?.id} failed: ${err.message}`);
  });

  resultWorker.on('error', (err) => {
    logger.error(`Result worker error: ${err.message}`);
  });

  logger.info('🏭 Worker started — listening to "result-processing" queue');
}

// ── Graceful Shutdown ───────────────────────────────────────
async function shutdown(signal) {
  logger.warn(`${signal} received — shutting down worker gracefully...`);

  if (sampleWorker) {
    await sampleWorker.close();
    logger.info('BullMQ sample worker closed');
  }

  if (resultWorker) {
    await resultWorker.close();
    logger.info('BullMQ result worker closed');
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
