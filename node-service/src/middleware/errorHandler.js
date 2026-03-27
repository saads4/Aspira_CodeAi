// ─── Global Error Handler Middleware ─────────────────────────────
const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  logger.error(`${req.method} ${req.path} — ${err.message}`);
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler;
