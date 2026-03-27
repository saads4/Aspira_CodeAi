// ─── Environment Configuration ──────────────────────────────────
require('dotenv').config();

module.exports = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/tat_monitoring',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  PORT: parseInt(process.env.PORT, 10) || 3000,

  // SMTP (optional)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  ALERT_EMAIL_TO: process.env.ALERT_EMAIL_TO || '',
  ALERT_EMAIL_FROM: process.env.ALERT_EMAIL_FROM || 'tat-monitor@aspira.lab',
};
