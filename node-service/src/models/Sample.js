// ─── Mongoose Model: Sample ─────────────────────────────────────
const mongoose = require('mongoose');

const sampleSchema = new mongoose.Schema(
  {
    sample_id:        { type: String, required: true, index: true },
    test_id:          { type: String, default: '' },
    test_name:        { type: String, required: true },
    test_code:        { type: String, default: '' },
    method:           { type: String, default: '' },
    specimen_type:    { type: String, default: '' },
    received_at:      { type: Date, required: true },
    agreed_tat_hours: { type: Number, required: true },
    priority_tat:     { type: String, default: 'NORMAL' },

    // Batch assignment
    batch_id:         { type: String, default: '' },
    batch_run_start:  { type: Date },
    batch_cutoff:     { type: Date },

    // Computed fields
    eta:              { type: Date },
    sla_deadline:     { type: Date },
    breach_flag:      { type: Boolean, default: false },
    overage_minutes:  { type: Number, default: 0 },

    // Missed-batch tracking
    missed_batch:     { type: Boolean, default: false },
    delay_reason:     { type: String, default: '' },

    // Result-completion fields
    result_ready_at:         { type: Date },
    actual_tat_minutes:      { type: Number },
    completed_within_sla:    { type: Boolean },
    prediction_error_minutes:{ type: Number },

    // Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'assigned', 'delayed', 'completed', 'error'],
      default: 'pending',
      index: true,
    },
    processed: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound index for dashboard queries
sampleSchema.index({ breach_flag: 1, status: 1 });
sampleSchema.index({ test_name: 1 });
sampleSchema.index({ batch_id: 1 });

module.exports = mongoose.model('Sample', sampleSchema);
