// ─── Stats API Route ────────────────────────────────────────────
// GET /api/stats — aggregated counts + recent alerts
// ────────────────────────────────────────────────────────────────
const express = require('express');
const Sample = require('../models/Sample');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [
      total,
      pending,
      assigned,
      delayed,
      breached,
      error,
      missed_batch,
      completed,
      recent_breaches,
      recent_missed,
      result_metrics,
    ] = await Promise.all([
      Sample.countDocuments(),
      Sample.countDocuments({ status: 'pending' }),
      Sample.countDocuments({ status: 'assigned' }),
      Sample.countDocuments({ status: 'delayed' }),
      Sample.countDocuments({ breach_flag: true }),
      Sample.countDocuments({ status: 'error' }),
      Sample.countDocuments({ missed_batch: true }),
      Sample.countDocuments({ status: 'completed' }),
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
      // Result-completion aggregation
      Sample.aggregate([
        { $match: { status: 'completed', actual_tat_minutes: { $ne: null } } },
        {
          $group: {
            _id: null,
            avg_actual_tat:       { $avg: '$actual_tat_minutes' },
            avg_prediction_error: { $avg: '$prediction_error_minutes' },
            total_completed:      { $sum: 1 },
            within_sla_count:     { $sum: { $cond: ['$completed_within_sla', 1, 0] } },
          },
        },
      ]),
    ]);

    // Extract result metrics (aggregation returns an array)
    const rm = result_metrics[0] || {};
    const sla_compliance_rate = rm.total_completed
      ? Math.round((rm.within_sla_count / rm.total_completed) * 10000) / 100
      : null;

    console.log(`STATS API: completed=${completed}, total=${total}, breached=${breached}`);

    res.json({
      status: 'ok',
      data: {
        counts: {
          total,
          pending,
          assigned,
          delayed,
          breached,
          completed,
          error,
          missed_batch,
        },
        result_metrics: {
          avg_actual_tat:       rm.avg_actual_tat != null ? Math.round(rm.avg_actual_tat * 100) / 100 : null,
          sla_compliance_rate:  sla_compliance_rate,
          avg_prediction_error: rm.avg_prediction_error != null ? Math.round(rm.avg_prediction_error * 100) / 100 : null,
          total_completed:      rm.total_completed || 0,
        },
        recent_breaches,
        recent_missed,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
