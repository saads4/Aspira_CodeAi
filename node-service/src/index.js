// ─── Express Server Entry Point ─────────────────────────────────
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const { getRedisConnection } = require('./config/redis');
const { loadEdos } = require('./services/edosLoader');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { PORT } = require('./config/env');

// Routes
const webhookRouter  = require('./routes/webhook');
const samplesRouter  = require('./routes/samples');
const statsRouter    = require('./routes/stats');
const batchesRouter  = require('./routes/batches');
const alertsRouter   = require('./routes/alerts');
const resultWebhookRouter = require('./routes/resultWebhook');

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Routes ──────────────────────────────────────────────────
app.use('/webhook',        webhookRouter);
app.use('/webhook/result', resultWebhookRouter);
app.use('/api/samples',    samplesRouter);
app.use('/api/stats',      statsRouter);
app.use('/api/batches',    batchesRouter);
app.use('/api/alerts',     alertsRouter);

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

// ── Error handler ───────────────────────────────────────────
app.use(errorHandler);

// ── Startup ─────────────────────────────────────────────────
let server = null;

async function start() {
  // 1. Connect MongoDB
  await connectDB();

  // 2. Connect Redis + load EDOS
  const redis = getRedisConnection();
  await loadEdos(redis);

  // 3. Start Express
  server = app.listen(PORT, () => {
    logger.success(`🚀 TAT Monitor API running on http://localhost:${PORT}`);
    logger.info('Routes:');
    logger.info('  POST /webhook          — SAP sample intake');
    logger.info('  POST /webhook/result   — SAP result-ready intake');
    logger.info('  GET  /api/samples      — list samples');
    logger.info('  GET  /api/samples/:id  — sample detail');
    logger.info('  GET  /api/stats        — dashboard stats');
    logger.info('  GET  /api/batches      — batch queues');
    logger.info('  GET  /api/alerts       — recent alerts');
    logger.info('  GET  /health           — health check');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`❌ Port ${PORT} is already in use.`);
      logger.info(`Possible fixes:`);
      logger.info(`1. Check if another instance of the backend or frontend is running.`);
      logger.info(`2. Kill the process using port ${PORT}.`);
      logger.info(`3. Change the PORT in .env.`);
      process.exit(1);
    } else {
      logger.error(`❌ Server error: ${err.message}`);
      process.exit(1);
    }
  });
}

// ── Graceful Shutdown ───────────────────────────────────────
async function shutdown(signal) {
  logger.warn(`${signal} received — shutting down gracefully...`);

  if (server) {
    server.close(() => logger.info('HTTP server closed'));
  }

  try {
    const redis = getRedisConnection();
    await redis.quit();
    logger.info('Redis connection closed');
  } catch (_) { /* best effort */ }

  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (_) { /* best effort */ }

  process.exit(0);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((err) => {
  logger.error(`Server startup failed: ${err.message}`);
  process.exit(1);
});

module.exports = app;
