// ─── Stats API Route ────────────────────────────────────────────
// GET /api/stats — aggregated counts + recent alerts
// ────────────────────────────────────────────────────────────────
const express = require('express');
const Sample = require('../models/Sample');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [
      totalCount,
      pendingCount,
      assignedCount,
      delayedCount,
      breachedCount,
      errorCount,
      missedBatchCount,
      recentBreaches,
      recentMissed,
    ] = await Promise.all([
      Sample.countDocuments(),
      Sample.countDocuments({ status: 'pending' }),
      Sample.countDocuments({ status: 'assigned' }),
      Sample.countDocuments({ status: 'delayed' }),
      Sample.countDocuments({ breach_flag: true }),
      Sample.countDocuments({ status: 'error' }),
      Sample.countDocuments({ missed_batch: true }),
      Sample.find({ breach_flag: true })
        .sort('-updated_at')
        .limit(10)
        .select('sample_id test_name eta sla_deadline overage_minutes updated_at')
        .lean(),
      Sample.find({ missed_batch: true })
        .sort('-updated_at')
        .limit(10)
        .select('sample_id test_name batch_id delay_reason updated_at')
        .lean(),
    ]);

    res.json({
      status: 'ok',
      data: {
        counts: {
          total: totalCount,
          pending: pendingCount,
          assigned: assignedCount,
          delayed: delayedCount,
          breached: breachedCount,
          error: errorCount,
          missed_batch: missedBatchCount,
        },
        recent_breaches: recentBreaches,
        recent_missed: recentMissed,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
