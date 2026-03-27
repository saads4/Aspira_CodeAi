// ─── MongoDB Connection (Mongoose) ──────────────────────────────
const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');
const logger = require('../utils/logger');

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.success('MongoDB connected');
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { connectDB };
