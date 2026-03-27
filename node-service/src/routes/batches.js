// ─── Batches API Route ──────────────────────────────────────────
// GET /api/batches — batch queues with sample counts
// ────────────────────────────────────────────────────────────────
const express = require('express');
const Sample = require('../models/Sample');

const router = express.Router();

// GET /api/batches?date=2026-03-27
router.get('/', async (req, res, next) => {
  try {
    // Aggregate samples by batch_id
    const pipeline = [
      {
        $match: {
          batch_id: { $ne: '' },
          processed: true,
        },
      },
      {
        $group: {
          _id: '$batch_id',
          batch_run_start: { $first: '$batch_run_start' },
          batch_cutoff: { $first: '$batch_cutoff' },
          total_samples: { $sum: 1 },
          breached_count: {
            $sum: { $cond: ['$breach_flag', 1, 0] },
          },
          missed_count: {
            $sum: { $cond: ['$missed_batch', 1, 0] },
          },
          avg_overage: { $avg: '$overage_minutes' },
          test_names: { $addToSet: '$test_name' },
          statuses: { $push: '$status' },
        },
      },
      { $sort: { batch_run_start: -1 } },
      { $limit: 100 },
    ];

    // Optional date filter
    if (req.query.date) {
      const start = new Date(req.query.date);
      const end = new Date(req.query.date);
      end.setDate(end.getDate() + 1);
      pipeline[0].$match.batch_run_start = { $gte: start, $lt: end };
    }

    const batches = await Sample.aggregate(pipeline);

    res.json({
      status: 'ok',
      count: batches.length,
      data: batches.map((b) => ({
        batch_id: b._id,
        batch_run_start: b.batch_run_start,
        batch_cutoff: b.batch_cutoff,
        total_samples: b.total_samples,
        breached_count: b.breached_count,
        missed_count: b.missed_count,
        avg_overage_minutes: Math.round(b.avg_overage || 0),
        test_names: b.test_names,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
