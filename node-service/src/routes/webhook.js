// ─── Webhook Route ──────────────────────────────────────────────
// POST /webhook — SAP system intake endpoint
// ────────────────────────────────────────────────────────────────
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { validateWebhook } = require('../middleware/validate');
const { enqueueSample } = require('../services/queueService');
const { getRedisConnection } = require('../config/redis');
const logger = require('../utils/logger');

const router = express.Router();

router.post('/', validateWebhook, async (req, res, next) => {
  try {
    const body = req.body;
    const redis = getRedisConnection();

    // Normalize: support single payload or { tests: [...] }
    let records = [];
    if (Array.isArray(body.tests)) {
      records = body.tests;
    } else {
      records = [body];
    }

    const queued = [];

    for (const record of records) {
      // Normalize
      const sample = {
        sample_id:        (record.sample_id || uuidv4()).toString().trim(),
        test_id:          (record.test_id || '').toString().trim(),
        test_name:        (record.test_name || '').trim(),
        test_code:        (record.test_code || '').trim(),
        method:           (record.method || '').trim(),
        specimen_type:    (record.specimen_type || '').trim(),
        received_at:      record.received_at || new Date().toISOString(),
        agreed_tat_hours: Number(record.agreed_tat_hours),
        priority_tat:     (record.priority_tat || 'NORMAL').toUpperCase(),
        batch_windows:    record.batch_windows || null,
      };

      // Store in Redis cache with pending status
      const cacheKey = `sample:${sample.sample_id}:${sample.test_name}`;
      await redis.hset(cacheKey, {
        ...sample,
        batch_windows: JSON.stringify(sample.batch_windows),
        status: 'pending',
        processed: 'false',
        cached_at: new Date().toISOString(),
      });
      // Set TTL (24 hours) on cache entry
      await redis.expire(cacheKey, 86400);

      // Enqueue to BullMQ
      await enqueueSample(sample);

      queued.push(sample.sample_id);
      logger.info(`Webhook received: ${sample.sample_id} (${sample.test_name})`);
    }

    res.status(202).json({
      status: 'accepted',
      message: 'Queued for processing',
      count: queued.length,
      sample_ids: queued,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
