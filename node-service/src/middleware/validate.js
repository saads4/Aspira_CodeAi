// ─── Webhook Payload Validation Middleware ───────────────────────

const REQUIRED_FIELDS = [
  'sample_id',
  'received_at',
  'test_name',
  'method',
  'specimen_type',
  'agreed_tat_hours',
];

/**
 * Validates a single sample record.
 * Returns { valid, errors }
 */
function validateSample(record) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (record.agreed_tat_hours !== undefined && (typeof record.agreed_tat_hours !== 'number' || record.agreed_tat_hours <= 0)) {
    errors.push('agreed_tat_hours must be a positive number');
  }

  if (record.received_at) {
    const d = new Date(record.received_at);
    if (isNaN(d.getTime())) {
      errors.push('received_at must be a valid ISO 8601 timestamp');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Express middleware: validate webhook body.
 * Supports both single payload and { tests: [...] } multi-test format.
 */
function validateWebhook(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({
      status: 'rejected',
      message: 'Request body must be a JSON object',
    });
  }

  // If body has a `tests` array, validate each
  if (Array.isArray(body.tests)) {
    const allErrors = [];
    body.tests.forEach((test, i) => {
      const { valid, errors } = validateSample(test);
      if (!valid) {
        allErrors.push({ index: i, errors });
      }
    });

    if (allErrors.length > 0) {
      return res.status(400).json({
        status: 'rejected',
        message: 'Validation failed for one or more tests',
        details: allErrors,
      });
    }

    return next();
  }

  // Single sample payload
  const { valid, errors } = validateSample(body);
  if (!valid) {
    return res.status(400).json({
      status: 'rejected',
      message: 'Validation failed',
      details: errors,
    });
  }

  next();
}

module.exports = { validateWebhook, validateSample };
