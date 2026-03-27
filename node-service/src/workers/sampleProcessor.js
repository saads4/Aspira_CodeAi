// ─── Sample Processor (BullMQ Job Handler) ──────────────────────
// This is the core processing engine. For each queued sample:
//   1. Lookup test in EDOS data
//   2. Assign batch window
//   3. Compute ETA, SLA, breach
//   4. Save to MongoDB
//   5. Fire alerts if needed
// ────────────────────────────────────────────────────────────────
const Sample = require('../models/Sample');
const { lookupTest } = require('../services/edosLoader');
const { assignBatch } = require('../services/batchAssigner');
const { alertMissedBatch, alertSLABreach, alertDelayEscalation } = require('../services/alertService');
const logger = require('../utils/logger');

/**
 * Process a single sample job.
 * @param {import('bullmq').Job} job
 */
async function processSample(job) {
  const sample = job.data;
  logger.info(`Processing sample ${sample.sample_id} (${sample.test_name})`);

  try {
    // ── 1. EDOS Lookup ────────────────────────────────────────
    const edos = lookupTest(sample.test_name, sample.test_code);

    let scheduleData;
    if (edos) {
      scheduleData = edos;
      logger.info(`EDOS match: ${edos.test_code} — schedule: ${edos.schedule_raw}, TAT: ${edos.tat_raw}`);
    } else {
      // Fallback: use payload's agreed_tat_hours + default daily schedule
      logger.warn(`No EDOS match for "${sample.test_name}" — using payload defaults`);
      scheduleData = {
        test_code: sample.test_code || 'UNKNOWN',
        test_name: sample.test_name,
        schedule_raw: 'Daily 5 pm',
        tat_raw: `${sample.agreed_tat_hours} Hrs`,
        schedule: { days: [0,1,2,3,4,5,6], cutoff_hour: 17, cutoff_minute: 0 },
        tat: { tat_minutes: (sample.agreed_tat_hours || 24) * 60 },
      };
    }

    // Apply batch_windows override from payload if provided
    if (sample.batch_windows && Array.isArray(sample.batch_windows) && sample.batch_windows.length > 0) {
      logger.info(`Using payload batch_windows override for ${sample.sample_id}`);
      // Expect batch_windows: [{ cutoff_hour, cutoff_minute, days }]
      scheduleData = {
        ...scheduleData,
        schedule: sample.batch_windows[0],
      };
    }

    // ── 2. Batch Assignment + Computation ─────────────────────
    const result = assignBatch(sample, scheduleData);

    // ── 3. Determine status ───────────────────────────────────
    const status = result.missed_batch ? 'delayed' : 'assigned';

    // ── 4. Save to MongoDB ────────────────────────────────────
    const doc = await Sample.findOneAndUpdate(
      { sample_id: sample.sample_id, test_name: sample.test_name },
      {
        $set: {
          test_id:          sample.test_id || '',
          test_code:        scheduleData.test_code || '',
          method:           sample.method || edos?.method || '',
          specimen_type:    sample.specimen_type || edos?.specimen_type || '',
          received_at:      new Date(sample.received_at),
          agreed_tat_hours: sample.agreed_tat_hours,
          priority_tat:     sample.priority_tat || 'NORMAL',
          batch_id:         result.batch_id,
          batch_run_start:  result.batch_run_start,
          batch_cutoff:     result.batch_cutoff,
          eta:              result.eta,
          sla_deadline:     result.sla_deadline,
          breach_flag:      result.breach_flag,
          overage_minutes:  result.overage_minutes,
          missed_batch:     result.missed_batch,
          delay_reason:     result.delay_reason,
          status,
          processed:        true,
        },
      },
      { upsert: true, new: true }
    );

    logger.success(
      `Sample ${sample.sample_id} → batch ${result.batch_id} | ` +
      `ETA: ${result.eta.toISOString()} | Breach: ${result.breach_flag} | ` +
      `Status: ${status}`
    );

    // ── 5. Alerts ─────────────────────────────────────────────
    // MISSED BATCH — highest priority alert
    if (result.missed_batch) {
      await alertMissedBatch(sample, result);
    }

    // SLA BREACH
    if (result.breach_flag) {
      await alertSLABreach(sample, result);
    }

    // DELAY ESCALATION — missed batch AND breach together
    if (result.missed_batch && result.breach_flag) {
      await alertDelayEscalation(sample, result);
    }

    return { sample_id: sample.sample_id, status, breach: result.breach_flag };
  } catch (err) {
    logger.error(`Failed to process sample ${sample.sample_id}: ${err.message}`);

    // Mark as error in DB
    try {
      await Sample.findOneAndUpdate(
        { sample_id: sample.sample_id, test_name: sample.test_name },
        {
          $set: {
            status: 'error',
            delay_reason: err.message,
            received_at: new Date(sample.received_at),
            agreed_tat_hours: sample.agreed_tat_hours,
            test_name: sample.test_name,
          },
        },
        { upsert: true }
      );
    } catch (_) { /* best effort */ }

    throw err; // let BullMQ handle retry
  }
}

module.exports = { processSample };
