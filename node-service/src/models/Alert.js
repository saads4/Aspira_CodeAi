// ─── Mongoose Model: Alert ──────────────────────────────────────
// Persists every alert (MISSED_BATCH, SLA_BREACH, DELAY_ESCALATION)
// so the dashboard can query and display recent events.
// ────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['MISSED_BATCH', 'SLA_BREACH', 'DELAY_ESCALATION', 'RESULT_COMPLETED'],
      required: true,
      index: true,
    },
    sample_id:   { type: String, required: true, index: true },
    test_name:   { type: String, required: true },
    priority:    { type: String, default: 'NORMAL' },
    alert_data: {
      received_at:              { type: String },
      batch_id:                 { type: String },
      batch_run_start:          { type: String },
      eta:                      { type: String },
      sla_deadline:             { type: String },
      overage_minutes:          { type: Number, default: 0 },
      reason:                   { type: String },
      recommended_action:       { type: String },
      // Result-completion fields
      result_ready_at:          { type: String },
      actual_tat_minutes:       { type: Number },
      completed_within_sla:     { type: Boolean },
      prediction_error_minutes: { type: Number },
    },
    acknowledged: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound index for dashboard: recent alerts of a specific type
alertSchema.index({ type: 1, created_at: -1 });

module.exports = mongoose.model('Alert', alertSchema);
