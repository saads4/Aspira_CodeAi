// ─── Queue Service (BullMQ Producer) ────────────────────────────
const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const logger = require('../utils/logger');

let sampleQueue = null;

function getSampleQueue() {
  if (sampleQueue) return sampleQueue;

  sampleQueue = new Queue('sample-processing', {
    connection: getRedisConnection(),
    defaultJobOptions: {
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 200 },
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  });

  logger.info('BullMQ queue "sample-processing" initialized');
  return sampleQueue;
}

/**
 * Enqueue a sample for processing.
 * Missed-batch / high-priority samples get priority boost.
 *
 * @param {object} sampleData – normalized sample record
 * @param {object} [opts] – { priority: number }
 */
async function enqueueSample(sampleData, opts = {}) {
  const queue = getSampleQueue();
  const priority = opts.priority || (sampleData.priority_tat === 'HIGH' ? 1 : 5);

  const job = await queue.add('process-sample', sampleData, { priority });
  logger.info(`Queued sample ${sampleData.sample_id} (job ${job.id}, priority ${priority})`);
  return job;
}

module.exports = { getSampleQueue, enqueueSample };
