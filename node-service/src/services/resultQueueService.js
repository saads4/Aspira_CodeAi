// ─── Result Queue Service (BullMQ Producer) ─────────────────────
// Manages the "result-processing" queue — completely separate
// from the existing "sample-processing" queue.
// ────────────────────────────────────────────────────────────────
const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const logger = require('../utils/logger');

let resultQueue = null;

function getResultQueue() {
  if (resultQueue) return resultQueue;

  resultQueue = new Queue('result-processing', {
    connection: getRedisConnection(),
    defaultJobOptions: {
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 200 },
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 },
    },
  });

  logger.info('BullMQ queue "result-processing" initialized');
  return resultQueue;
}

/**
 * Enqueue a result-ready payload for processing.
 * @param {object} resultData — { sample_id, test_name, result_ready_at, status }
 */
async function enqueueResult(resultData) {
  const queue = getResultQueue();
  const job = await queue.add('process-result', resultData, { priority: 3 });
  logger.info(`Queued result ${resultData.sample_id} (job ${job.id})`);
  return job;
}

module.exports = { getResultQueue, enqueueResult };
