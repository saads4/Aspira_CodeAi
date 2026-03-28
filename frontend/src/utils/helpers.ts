// ─── Utility helpers ─────────────────────────────────────────────────────────

import { formatDistanceToNow, format, differenceInMinutes, isPast } from 'date-fns';
import type { Sample } from '@/types';

export type UrgencyLevel = 'critical' | 'warning' | 'normal' | 'delayed' | 'error';

/**
 * Classify a sample's urgency for colour-coding.
 * Priority order: error → delayed/missed → breach → warning → normal
 */
export function getSampleUrgency(sample: Sample): UrgencyLevel {
  if (sample.status === 'error') return 'error';
  if (sample.missed_batch || sample.status === 'delayed') return 'delayed';
  if (sample.breach_flag) return 'critical';

  // Warn if ETA is within 30 min of SLA
  if (sample.eta && sample.sla_deadline) {
    const etaMs = new Date(sample.eta).getTime();
    const slaMs = new Date(sample.sla_deadline).getTime();
    if (etaMs > 0 && slaMs > 0 && slaMs - etaMs < 30 * 60 * 1_000) {
      return 'warning';
    }
  }
  return 'normal';
}

/** Returns Tailwind-compatible CSS variable classes for urgency rings/badges */
export function urgencyToClass(level: UrgencyLevel): string {
  switch (level) {
    case 'critical': return 'urgency-critical';
    case 'warning':  return 'urgency-warning';
    case 'delayed':  return 'urgency-delayed';
    case 'error':    return 'urgency-error';
    default:         return 'urgency-normal';
  }
}

/** Format an ISO date string to a human-readable short format (IST) */
export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'dd MMM, HH:mm');
  } catch {
    return '—';
  }
}

/** "3 minutes ago" style */
export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '—';
  }
}

/** Overage in "2h 30m" format */
export function fmtOverage(minutes: number): string {
  if (!minutes || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Minutes until ETA (negative if past) */
export function minutesUntilEta(eta: string | null | undefined): number | null {
  if (!eta) return null;
  try {
    return -differenceInMinutes(new Date(), new Date(eta));
  } catch {
    return null;
  }
}

/** Is the ETA already in the past? */
export function isEtaPast(eta: string | null | undefined): boolean {
  if (!eta) return false;
  try {
    return isPast(new Date(eta));
  } catch {
    return false;
  }
}

/** Status → human label */
export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending:    'Pending',
    processing: 'Processing',
    assigned:   'Assigned',
    delayed:    'Delayed',
    error:      'Error',
  };
  return map[status] ?? status;
}

/** Truncate long string */
export function truncate(s: string, max = 30): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/** clsx-lite: merge class strings, filtering falsy */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
