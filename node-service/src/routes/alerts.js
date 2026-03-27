// ─── Alerts API Route ───────────────────────────────────────────
// GET /api/alerts — paginated list of recent alerts
// ────────────────────────────────────────────────────────────────
const express = require('express');
const Alert = require('../models/Alert');

const router = express.Router();

// GET /api/alerts?type=MISSED_BATCH&page=1&limit=20
router.get('/', async (req, res, next) => {
  try {
    const {
      type,
      sample_id,
      acknowledged,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};
    if (type) filter.type = type.toUpperCase();
    if (sample_id) filter.sample_id = sample_id;
    if (acknowledged === 'true') filter.acknowledged = true;
    if (acknowledged === 'false') filter.acknowledged = false;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const lim = parseInt(limit, 10);

    const [alerts, total] = await Promise.all([
      Alert.find(filter).sort('-created_at').skip(skip).limit(lim).lean(),
      Alert.countDocuments(filter),
    ]);

    res.json({
      status: 'ok',
      page: parseInt(page, 10),
      limit: lim,
      total,
      totalPages: Math.ceil(total / lim),
      data: alerts,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/alerts/summary — counts by type
router.get('/summary', async (req, res, next) => {
  try {
    const pipeline = [
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ];
    const results = await Alert.aggregate(pipeline);

    const summary = {};
    for (const r of results) {
      summary[r._id] = r.count;
    }

    res.json({ status: 'ok', data: summary });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
