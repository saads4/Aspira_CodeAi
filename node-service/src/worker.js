// ─── Worker Entry Point ─────────────────────────────────────────
// Run as a separate process:  node src/worker.js
// Listens to the BullMQ "sample-processing" queue and processes
// each job via the sampleProcessor handler.
// ────────────────────────────────────────────────────────────────
const { Worker } = require('bullmq');
const { getRedisConnection } = require('./config/redis');
const { connectDB } = require('./config/db');
const { loadEdos } = require('./services/edosLoader');
const { processSample } = require('./workers/sampleProcessor');
const logger = require('./utils/logger');

async function startWorker() {
  // Connect MongoDB
  await connectDB();

  // Load EDOS into memory
  const redis = getRedisConnection();
  await loadEdos(redis);

  // Create BullMQ worker
  const worker = new Worker(
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

startWorker().catch((err) => {
  logger.error(`Worker startup failed: ${err.message}`);
  process.exit(1);
});
