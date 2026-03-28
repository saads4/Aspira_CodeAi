// ─── Result Worker (BullMQ Job Handler) ─────────────────────────
// Processes "result-processing" queue jobs.
// For each result-ready event:
//   1. Find sample in MongoDB (sample_id + test_name)
//   2. Skip if already completed (idempotent)
//   3. Compute TAT metrics
//   4. Update MongoDB
//   5. Fire RESULT_COMPLETED alert
// ────────────────────────────────────────────────────────────────
const Sample = require('../models/Sample');
const { alertResultCompleted } = require('../services/alertService');
const logger = require('../utils/logger');

/**
 * Process a single result-ready job.
 * @param {import('bullmq').Job} job
 */
async function processResult(job) {
  const { sample_id, test_name, result_ready_at } = job.data;

  logger.info(`Processing result for ${sample_id} (${test_name})`);

  // ── 1. Find the sample ────────────────────────────────────
  const sample = await Sample.findOne({ sample_id, test_name });

  if (!sample) {
    // Result arrived before the sample was ingested — retry via BullMQ
    const msg = `Sample not found: ${sample_id} (${test_name}) — will retry`;
    logger.warn(msg);
    throw new Error(msg);
  }

  // ── 2. Idempotency: skip if already completed ─────────────
  if (sample.status === 'completed') {
    logger.warn(`Sample ${sample_id} (${test_name}) already completed — skipping`);
    return { sample_id, status: 'already_completed', skipped: true };
  }

  // ── 3. Compute TAT metrics ────────────────────────────────
  const resultReadyDate = new Date(result_ready_at);
  const receivedDate    = new Date(sample.received_at);

  // actual_tat_minutes = result_ready_at - received_at (in minutes)
  const actual_tat_minutes = Math.round(
    (resultReadyDate.getTime() - receivedDate.getTime()) / 60000
  );

  // completed_within_sla = result_ready_at <= SLA_deadline
  const completed_within_sla = sample.sla_deadline
    ? resultReadyDate <= new Date(sample.sla_deadline)
    : null;

  // prediction_error_minutes = result_ready_at - ETA (positive = late, negative = early)
  const prediction_error_minutes = sample.eta
    ? Math.round((resultReadyDate.getTime() - new Date(sample.eta).getTime()) / 60000)
    : null;

  // ── 4. Update MongoDB ─────────────────────────────────────
  const updateFields = {
    result_ready_at:         resultReadyDate,
    actual_tat_minutes,
    completed_within_sla,
    prediction_error_minutes,
    status:                  'completed',
  };

  const updatedSample = await Sample.findOneAndUpdate(
    { sample_id, test_name },
    { $set: updateFields },
    { new: true }
  );

  logger.success(
    `Result completed: ${sample_id} (${test_name}) | ` +
    `Actual TAT: ${actual_tat_minutes} min | ` +
    `Within SLA: ${completed_within_sla} | ` +
    `Prediction Error: ${prediction_error_minutes} min`
  );

  // ── 5. Fire RESULT_COMPLETED alert ────────────────────────
  await alertResultCompleted(updatedSample, {
    actual_tat_minutes,
    completed_within_sla,
    prediction_error_minutes,
  });

  return {
    sample_id,
    status: 'completed',
    actual_tat_minutes,
    completed_within_sla,
    prediction_error_minutes,
  };
}

module.exports = { processResult };
