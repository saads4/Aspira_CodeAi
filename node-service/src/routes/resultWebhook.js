// ─── Result Webhook Route ───────────────────────────────────────
// POST /webhook/result — SAP result-ready intake endpoint
// Validates, checks idempotency, enqueues to "result-processing" queue.
// NO database writes — worker handles persistence.
// ────────────────────────────────────────────────────────────────
const express = require('express');
const { getRedisConnection } = require('../config/redis');
const { enqueueResult } = require('../services/resultQueueService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Validate the result-ready payload.
 */
function validateResultPayload(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }
  if (!body.sample_id || typeof body.sample_id !== 'string' || !body.sample_id.trim()) {
    errors.push('Missing or invalid required field: sample_id');
  }
  if (!body.test_name || typeof body.test_name !== 'string' || !body.test_name.trim()) {
    errors.push('Missing or invalid required field: test_name');
  }
  if (!body.result_ready_at) {
    errors.push('Missing required field: result_ready_at');
  } else {
    const d = new Date(body.result_ready_at);
    if (isNaN(d.getTime())) {
      errors.push('result_ready_at must be a valid ISO 8601 timestamp');
    }
  }

  return { valid: errors.length === 0, errors };
}

router.post('/', async (req, res, next) => {
  try {
    const body = req.body;

    // ── Validate ──────────────────────────────────────────────
    const { valid, errors } = validateResultPayload(body);
    if (!valid) {
      return res.status(400).json({
        status: 'rejected',
        message: 'Validation failed',
        details: errors,
      });
    }

    // ── Normalize ─────────────────────────────────────────────
    const payload = {
      sample_id:       body.sample_id.toString().trim(),
      test_name:       body.test_name.trim(),
      result_ready_at: new Date(body.result_ready_at).toISOString(),
      status:          'completed',
    };

    // ── Idempotency check via Redis ───────────────────────────
    const redis = getRedisConnection();
    const idempotencyKey = `result:processed:${payload.sample_id}:${payload.test_name}`;
    const alreadyProcessed = await redis.get(idempotencyKey);

    if (alreadyProcessed) {
      logger.warn(`Duplicate result webhook ignored: ${payload.sample_id} (${payload.test_name})`);
      return res.status(202).json({
        status: 'accepted',
        message: 'Already received — duplicate ignored',
        sample_id: payload.sample_id,
      });
    }

    // Mark as received (TTL 48h) to prevent duplicate processing
    await redis.set(idempotencyKey, new Date().toISOString(), 'EX', 172800);

    // ── Enqueue to "result-processing" queue ──────────────────
    await enqueueResult(payload);

    logger.info(`Result webhook received: ${payload.sample_id} (${payload.test_name}) → queued`);

    return res.status(202).json({
      status: 'accepted',
      message: 'Result queued for processing',
      sample_id: payload.sample_id,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
