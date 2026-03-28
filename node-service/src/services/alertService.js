// ─── Alert Service ──────────────────────────────────────────────
// Console (colour) + optional email alerts + MongoDB persistence.
// Alert types:
//   1. MISSED_BATCH   (high priority)
//   2. SLA_BREACH
//   3. DELAY_ESCALATION
// ────────────────────────────────────────────────────────────────
const nodemailer = require('nodemailer');
const { DateTime } = require('luxon');
const { ZONE } = require('../utils/timezone');
const config = require('../config/env');
const logger = require('../utils/logger');
const Alert = require('../models/Alert');

// ── Email transporter (lazy init) ───────────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.SMTP_HOST || !config.SMTP_USER) return null;

  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });
  return transporter;
}

function fmt(d) {
  if (!d) return 'N/A';
  return DateTime.fromJSDate(new Date(d), { zone: ZONE }).toFormat('dd-MMM-yyyy hh:mm a');
}

// ── Build alert data object ─────────────────────────────────
function buildAlertData(sample, result) {
  return {
    sample_id:          sample.sample_id,
    test_name:          sample.test_name,
    priority:           sample.priority_tat || 'NORMAL',
    received_at:        fmt(sample.received_at),
    batch_id:           result.batch_id,
    batch_run_start:    fmt(result.batch_run_start),
    eta:                fmt(result.eta),
    sla_deadline:       fmt(result.sla_deadline),
    overage_minutes:    result.overage_minutes,
    reason:             result.delay_reason || 'ETA exceeds SLA deadline',
    recommended_action: '',
  };
}

// ── Send email ──────────────────────────────────────────────
async function sendEmail(subject, body) {
  const smtp = getTransporter();
  if (!smtp || !config.ALERT_EMAIL_TO) return;

  try {
    await smtp.sendMail({
      from: config.ALERT_EMAIL_FROM,
      to: config.ALERT_EMAIL_TO,
      subject,
      text: body,
    });
    logger.info(`Alert email sent: ${subject}`);
  } catch (err) {
    logger.warn(`Email send failed: ${err.message}`);
  }
}

// ── Persist alert to MongoDB ────────────────────────────────
async function saveAlert(type, sample, data) {
  try {
    await Alert.create({
      type,
      sample_id:  sample.sample_id,
      test_name:  sample.test_name,
      priority:   sample.priority_tat || 'NORMAL',
      alert_data: data,
    });
  } catch (err) {
    logger.warn(`Failed to persist alert: ${err.message}`);
  }
}

function alertToText(type, data) {
  return [
    `=== ${type} ===`,
    `Sample ID    : ${data.sample_id}`,
    `Test Name    : ${data.test_name}`,
    `Priority     : ${data.priority}`,
    `Received At  : ${data.received_at}`,
    `Batch        : ${data.batch_id}`,
    `Batch Run    : ${data.batch_run_start}`,
    `ETA          : ${data.eta}`,
    `SLA Deadline : ${data.sla_deadline}`,
    `Overage      : ${data.overage_minutes} min`,
    `Reason       : ${data.reason}`,
    `Action       : ${data.recommended_action}`,
    '='.repeat(40),
  ].join('\n');
}

// ── Public API ──────────────────────────────────────────────

async function alertMissedBatch(sample, result) {
  const data = buildAlertData(sample, result);
  data.recommended_action = 'Reassign to next available batch immediately. Escalate if repeated.';

  // Console
  logger.missedBatch(data);

  // Persist to DB
  await saveAlert('MISSED_BATCH', sample, data);

  // Email
  await sendEmail(
    `🚨 MISSED BATCH — ${sample.sample_id} (${sample.test_name})`,
    alertToText('MISSED BATCH', data)
  );
}

async function alertSLABreach(sample, result) {
  const data = buildAlertData(sample, result);
  data.reason = 'ETA exceeds SLA deadline';
  data.recommended_action = 'Review batch capacity. Consider priority re-routing or expedited processing.';

  // Console
  logger.slaBreach(data);

  // Persist to DB
  await saveAlert('SLA_BREACH', sample, data);

  // Email
  await sendEmail(
    `⚠️ SLA BREACH — ${sample.sample_id} (${sample.test_name})`,
    alertToText('SLA BREACH', data)
  );
}

async function alertDelayEscalation(sample, result) {
  const data = buildAlertData(sample, result);
  data.recommended_action = 'Alert lab supervisor. Initiate contingency processing.';

  // Console
  logger.delayEscalation(data);

  // Persist to DB
  await saveAlert('DELAY_ESCALATION', sample, data);

  // Email
  await sendEmail(
    `🟠 DELAY ESCALATION — ${sample.sample_id} (${sample.test_name})`,
    alertToText('DELAY ESCALATION', data)
  );
}

// ── RESULT_COMPLETED alert ──────────────────────────────────
async function alertResultCompleted(sample, metrics) {
  const data = {
    sample_id:              sample.sample_id,
    test_name:              sample.test_name,
    priority:               sample.priority_tat || 'NORMAL',
    received_at:            fmt(sample.received_at),
    eta:                    fmt(sample.eta),
    sla_deadline:           fmt(sample.sla_deadline),
    result_ready_at:        fmt(sample.result_ready_at),
    actual_tat_minutes:     metrics.actual_tat_minutes,
    completed_within_sla:   metrics.completed_within_sla,
    prediction_error_minutes: metrics.prediction_error_minutes,
  };

  // Console (green)
  logger.resultCompleted(data);

  // Persist to DB
  try {
    await Alert.create({
      type: 'RESULT_COMPLETED',
      sample_id: sample.sample_id,
      test_name: sample.test_name,
      priority: sample.priority_tat || 'NORMAL',
      alert_data: data,
    });
  } catch (err) {
    logger.warn(`Failed to persist RESULT_COMPLETED alert: ${err.message}`);
  }

  // Optional email
  const body = [
    `=== RESULT COMPLETED ===`,
    `Sample ID          : ${data.sample_id}`,
    `Test Name          : ${data.test_name}`,
    `Priority           : ${data.priority}`,
    `Received At        : ${data.received_at}`,
    `ETA                : ${data.eta}`,
    `SLA Deadline       : ${data.sla_deadline}`,
    `Result Ready At    : ${data.result_ready_at}`,
    `Actual TAT         : ${data.actual_tat_minutes} min`,
    `Within SLA         : ${data.completed_within_sla}`,
    `Prediction Error   : ${data.prediction_error_minutes} min`,
    '='.repeat(40),
  ].join('\n');

  await sendEmail(
    `✅ RESULT COMPLETED — ${sample.sample_id} (${sample.test_name})`,
    body
  );
}

module.exports = { alertMissedBatch, alertSLABreach, alertDelayEscalation, alertResultCompleted };
