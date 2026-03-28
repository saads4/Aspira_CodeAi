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
      completedCount,
      recentBreaches,
      recentMissed,
      resultMetrics,
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
    const rm = resultMetrics[0] || {};
    const sla_compliance_rate = rm.total_completed
      ? Math.round((rm.within_sla_count / rm.total_completed) * 10000) / 100
      : null;

    res.json({
      status: 'ok',
      data: {
        counts: {
          total: totalCount,
          pending: pendingCount,
          assigned: assignedCount,
          delayed: delayedCount,
          breached: breachedCount,
          completed: completedCount,
          error: errorCount,
          missed_batch: missedBatchCount,
        },
        result_metrics: {
          avg_actual_tat:       rm.avg_actual_tat != null ? Math.round(rm.avg_actual_tat * 100) / 100 : null,
          sla_compliance_rate:  sla_compliance_rate,
          avg_prediction_error: rm.avg_prediction_error != null ? Math.round(rm.avg_prediction_error * 100) / 100 : null,
          total_completed:      rm.total_completed || 0,
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
