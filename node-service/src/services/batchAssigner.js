// ─── Batch Assigner ─────────────────────────────────────────────
// Core logic: given a sample's received_at and the EDOS test config,
// determine the correct batch window, compute ETA, SLA, breach, overage.
// ────────────────────────────────────────────────────────────────
const { DateTime } = require('luxon');
const { ZONE } = require('../utils/timezone');

/**
 * Assign a batch and compute all derived timestamps.
 *
 * @param {object} sample – { received_at, agreed_tat_hours, ... }
 * @param {object} edos   – parsed EDOS record with .schedule and .tat
 * @returns {{ batch_id, batch_run_start, batch_cutoff, eta, sla_deadline,
 *             breach_flag, overage_minutes, missed_batch, delay_reason }}
 */
function assignBatch(sample, edos) {
  const receivedIST = DateTime.fromJSDate(new Date(sample.received_at), { zone: ZONE });
  const schedule = edos.schedule;
  const tatInfo = edos.tat;

  // ── Find the first valid batch window ──────────────────────
  let batchDate = receivedIST;
  let missedBatch = false;
  let delayReason = '';
  let batchCutoff = null;
  let batchRunStart = null;
  const MAX_SCAN_DAYS = 30; // safety cap

  for (let dayOffset = 0; dayOffset < MAX_SCAN_DAYS; dayOffset++) {
    const candidateDate = receivedIST.plus({ days: dayOffset });
    const weekday = candidateDate.weekday % 7; // luxon: Mon=1..Sun=7 → we use Sun=0..Sat=6

    // Check if this day is in the schedule's allowed days
    if (!schedule.days.includes(weekday)) continue;

    // Build the cutoff DateTime for this candidate day
    const cutoff = candidateDate.set({
      hour: schedule.cutoff_hour,
      minute: schedule.cutoff_minute || 0,
      second: 0,
      millisecond: 0,
    });

    // For the first day (dayOffset === 0), the cutoff must be >= received time
    if (dayOffset === 0 && cutoff < receivedIST) {
      // Missed today's batch
      missedBatch = true;
      delayReason = `Sample received at ${receivedIST.toFormat('HH:mm')} IST, cutoff was ${cutoff.toFormat('HH:mm')} IST`;
      continue;
    }

    // Valid batch found
    batchCutoff = cutoff;
    // Batch run starts at the cutoff time (batch processes immediately at cutoff)
    batchRunStart = cutoff;
    batchDate = candidateDate;
    break;
  }

  // Safety: if no batch found in 30 days, assign to tomorrow
  if (!batchCutoff) {
    batchCutoff = receivedIST.plus({ days: 1 }).set({ hour: 17, minute: 0, second: 0 });
    batchRunStart = batchCutoff;
    missedBatch = true;
    delayReason = 'No valid batch window found in 30-day scan';
  }

  // If batch was missed (even on subsequent days due to schedule gaps)
  if (!missedBatch && batchDate.startOf('day') > receivedIST.startOf('day')) {
    missedBatch = true;
    delayReason = `Next available batch is on ${batchDate.toFormat('ccc dd-MMM')} (schedule: ${edos.schedule_raw})`;
  }

  // ── Build batch_id ─────────────────────────────────────────
  const batchId = `BATCH-${edos.test_code || edos.test_name}-${batchDate.toFormat('yyyyMMdd')}-${batchCutoff.toFormat('HHmm')}`;

  // ── Compute ETA ────────────────────────────────────────────
  let eta;
  if (tatInfo.deadline_hour !== undefined) {
    // Absolute deadline: e.g. "Next Day 8 pm" means ETA = batchRunStart + days offset, at the specified hour
    const daysFromTat = Math.floor(tatInfo.tat_minutes / 1440);
    eta = batchRunStart.plus({ days: daysFromTat }).set({
      hour: tatInfo.deadline_hour,
      minute: 0,
      second: 0,
    });
    // If tat_minutes is 0 and we have a deadline_hour, it means same day at that hour
    if (tatInfo.tat_minutes === 0) {
      eta = batchRunStart.set({ hour: tatInfo.deadline_hour, minute: 0, second: 0 });
      // If deadline_hour is before batch run, push to runstart + tatminutes
      if (eta < batchRunStart) {
        eta = batchRunStart; // at least batch run time
      }
    }
  } else {
    // Relative: ETA = batch_run_start + tat_minutes
    eta = batchRunStart.plus({ minutes: tatInfo.tat_minutes });
  }

  // ── Compute SLA ────────────────────────────────────────────
  const slaDeadline = receivedIST.plus({ hours: sample.agreed_tat_hours });

  // ── Breach detection ───────────────────────────────────────
  const breachFlag = eta > slaDeadline;
  const overageMinutes = breachFlag
    ? Math.round(eta.diff(slaDeadline, 'minutes').minutes)
    : 0;

  return {
    batch_id: batchId,
    batch_run_start: batchRunStart.toJSDate(),
    batch_cutoff: batchCutoff.toJSDate(),
    eta: eta.toJSDate(),
    sla_deadline: slaDeadline.toJSDate(),
    breach_flag: breachFlag,
    overage_minutes: overageMinutes,
    missed_batch: missedBatch,
    delay_reason: delayReason,
  };
}

module.exports = { assignBatch };
