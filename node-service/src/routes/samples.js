// ─── Samples API Routes ─────────────────────────────────────────
// GET /api/samples        — list all (paginated, filterable)
// GET /api/samples/:id    — single sample detail
// ────────────────────────────────────────────────────────────────
const express = require('express');
const Sample = require('../models/Sample');

const router = express.Router();

// GET /api/samples?status=assigned&breach=true&page=1&limit=20
router.get('/', async (req, res, next) => {
  try {
    const {
      status,
      breach,
      test_name,
      missed,
      page = 1,
      limit = 50,
      sort = '-created_at',
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (breach === 'true') filter.breach_flag = true;
    if (breach === 'false') filter.breach_flag = false;
    if (missed === 'true') filter.missed_batch = true;
    if (test_name) filter.test_name = new RegExp(test_name, 'i');

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const lim = parseInt(limit, 10);

    const [samples, total] = await Promise.all([
      Sample.find(filter).sort(sort).skip(skip).limit(lim).lean(),
      Sample.countDocuments(filter),
    ]);

    console.log(`SAMPLES API: filter=${JSON.stringify(filter)}, total=${total}, samples.length=${samples.length}`);

    res.json({
      status: 'ok',
      page: parseInt(page, 10),
      limit: lim,
      total,
      totalPages: Math.ceil(total / lim),
      data: samples,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/samples/:id
router.get('/:id', async (req, res, next) => {
  try {
    const sample = await Sample.findOne({ sample_id: req.params.id }).lean();
    if (!sample) {
      return res.status(404).json({ status: 'error', message: 'Sample not found' });
    }
    res.json({ status: 'ok', data: sample });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
