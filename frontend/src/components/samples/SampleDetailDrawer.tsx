'use client';
import { X, Clock, FlaskConical, AlertTriangle, CheckCircle, Layers } from 'lucide-react';
import type { Sample } from '@/types';
import { getSampleUrgency, fmtTime, fmtRelative, fmtOverage } from '@/utils/helpers';
import StatusBadge from '@/components/ui/StatusBadge';
import UrgencyBadge from '@/components/ui/UrgencyBadge';

interface Props {
  sample: Sample;
  onClose: () => void;
}

function DetailRow({ label, value, mono }: { label: string; value: string | React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex" style={{ gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span className="text-xs text-muted" style={{ minWidth: 130, paddingTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label}
      </span>
      <span className={mono ? 'mono' : 'text-sm text-primary'} style={{ flex: 1, wordBreak: 'break-all' }}>
        {value || '—'}
      </span>
    </div>
  );
}

export default function SampleDetailDrawer({ sample, onClose }: Props) {
  const urgency = getSampleUrgency(sample);

  const timelineSteps = [
    {
      label: 'Sample Received',
      time: sample.received_at,
      done: true,
      icon: '📥',
    },
    {
      label: 'Batch Assigned',
      time: sample.batch_cutoff,
      done: !!sample.batch_id,
      error: sample.missed_batch,
      icon: sample.missed_batch ? '⚠️' : '📋',
    },
    {
      label: 'Batch Run Start',
      time: sample.batch_run_start,
      done: !!sample.batch_run_start,
      icon: '🏭',
    },
    {
      label: 'SLA Deadline',
      time: sample.sla_deadline,
      done: false,
      icon: '⏰',
    },
    {
      label: 'ETA (Result)',
      time: sample.eta,
      active: true,
      error: sample.breach_flag,
      icon: sample.breach_flag ? '🚨' : '✅',
    },
  ];

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer animate-scale" role="dialog" aria-modal="true" aria-label="Sample detail">
        {/* Header */}
        <div className="drawer-header">
          <div>
            <div className="flex items-center gap-2 mb-4" style={{ marginBottom: 6 }}>
              <FlaskConical size={16} color="var(--brand-primary)" />
              <span className="mono font-700" style={{ color: 'var(--brand-primary)', fontSize: '0.9rem' }}>
                {sample.sample_id}
              </span>
            </div>
            <div className="text-primary font-700" style={{ fontSize: '1.05rem', marginBottom: 6 }}>
              {sample.test_name}
            </div>
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              <StatusBadge status={sample.status} />
              <UrgencyBadge urgency={urgency} />
              {sample.missed_batch && (
                <span className="badge badge-delayed">Missed Batch</span>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* Alert banner */}
          {(sample.breach_flag || sample.missed_batch) && (
            <div
              className="card"
              style={{
                background: 'var(--glow-critical)',
                borderColor: 'rgba(239,68,68,0.35)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}
            >
              <AlertTriangle size={16} color="var(--color-critical)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="text-sm font-700 text-critical">
                  {sample.breach_flag && sample.missed_batch ? 'Delay Escalation' :
                   sample.breach_flag ? 'SLA Breach' : 'Missed Batch'}
                </div>
                {sample.delay_reason && (
                  <div className="text-xs text-secondary" style={{ marginTop: 4 }}>
                    {sample.delay_reason}
                  </div>
                )}
                {sample.breach_flag && (
                  <div className="text-xs text-critical" style={{ marginTop: 4 }}>
                    Overage: <strong>+{fmtOverage(sample.overage_minutes)}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-4" style={{ marginBottom: 12 }}>
              <Clock size={14} color="var(--text-muted)" />
              <span className="text-xs text-muted font-600 uppercase">Audit Timeline</span>
            </div>
            <div className="timeline">
              {timelineSteps.map((step, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-spine">
                    <div
                      className={`timeline-dot ${step.active ? 'active' : step.error ? 'error' : step.done ? 'done' : ''}`}
                    />
                    {i < timelineSteps.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-label">
                      {step.icon}&nbsp; {step.label}
                    </div>
                    <div className="timeline-time">{fmtTime(step.time)}</div>
                    {step.time && (
                      <div className="timeline-meta">{fmtRelative(step.time)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* Details */}
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <Layers size={14} color="var(--text-muted)" />
              <span className="text-xs text-muted font-600 uppercase">Sample Details</span>
            </div>
            <DetailRow label="Test Code"     value={sample.test_code} mono />
            <DetailRow label="Test ID"       value={sample.test_id} mono />
            <DetailRow label="Method"        value={sample.method} />
            <DetailRow label="Specimen"      value={sample.specimen_type} />
            <DetailRow label="Priority TAT"  value={sample.priority_tat} />
            <DetailRow label="Agreed TAT"    value={`${sample.agreed_tat_hours}h`} />
            <DetailRow label="Batch ID"      value={sample.batch_id} mono />
            <DetailRow label="Batch Cutoff"  value={fmtTime(sample.batch_cutoff)} />
            <DetailRow label="Batch Run"     value={fmtTime(sample.batch_run_start)} />
            <DetailRow label="Created"       value={fmtTime(sample.created_at)} />
            <DetailRow label="Last Updated"  value={fmtTime(sample.updated_at)} />

            {sample.status === 'completed' && (
              <>
                <div className="divider" style={{ margin: '12px 0' }} />
                <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                  <CheckCircle size={14} color="var(--color-normal)" />
                  <span className="text-xs text-muted font-600 uppercase">Completion Analysis</span>
                </div>
                <DetailRow label="Result Ready"   value={fmtTime(sample.result_ready_at)} />
                <DetailRow label="Actual TAT"     value={fmtOverage(sample.actual_tat_minutes)} />
                <DetailRow label="SLA Status"     value={
                  sample.completed_within_sla 
                    ? <span className="text-normal font-600">Within SLA</span>
                    : <span className="text-critical font-600">Breached SLA</span>
                } />
                <DetailRow label="Prediction Err" value={
                  sample.prediction_error_minutes != null
                    ? `${sample.prediction_error_minutes > 0 ? '+' : ''}${sample.prediction_error_minutes}m`
                    : '—'
                } />
              </>
            )}
          </div>

          {/* Success indicator if clean */}
          {!sample.breach_flag && !sample.missed_batch && sample.status === 'assigned' && (
            <div className="flex items-center gap-2" style={{ color: 'var(--color-normal)', padding: '12px 0' }}>
              <CheckCircle size={15} />
              <span className="text-sm font-600">On schedule — No SLA risk detected</span>
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}
