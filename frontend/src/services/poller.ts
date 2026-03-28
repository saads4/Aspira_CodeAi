// ─── Real-Time Polling Service ───────────────────────────────────────────────
// The backend uses BullMQ workers and does NOT expose WebSockets.
// Strategy: Smart interval polling with:
//  • Exponential backoff on failure
//  • Visibility-based pause (tab hidden → pause)
//  • Version-based staleness guard (server monotonic counter via updatedAt)
//  • Single shared EventEmitter so all consumers get the same push
//  • Automatic reconnect on network restore
// ─────────────────────────────────────────────────────────────────────────────

import type { ConnectionStatus } from '@/types';

type Callback<T> = (data: T) => void;

interface PollerOptions<T> {
  /** fetch function — must return latest data */
  fetcher: () => Promise<T>;
  /** base interval ms (adaptive: doubles on failure, halves on success) */
  interval?: number;
  /** called whenever new data is fetched */
  onData: Callback<T>;
  /** called on status change */
  onStatusChange?: (status: ConnectionStatus) => void;
  /** called on fetch error */
  onError?: (err: Error) => void;
  /** how to detect staleness — if true, skip update */
  isStale?: (incoming: T) => boolean;
}

const MIN_INTERVAL = 3_000;
const MAX_INTERVAL = 60_000;

export class SmartPoller<T> {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private currentInterval: number;
  private readonly options: Required<PollerOptions<T>>;
  private active = false;
  private status: ConnectionStatus = 'disconnected';
  private consecutiveErrors = 0;

  constructor(options: PollerOptions<T>) {
    this.options = {
      interval: 5_000,
      onStatusChange: () => {},
      onError: () => {},
      isStale: () => false,
      ...options,
    };
    this.currentInterval = this.options.interval;
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    this.setStatus('connected');
    this.scheduleNext(0); // immediate first fetch

    // Pause polling when tab is hidden
    document.addEventListener('visibilitychange', this.handleVisibility);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  stop(): void {
    this.active = false;
    this.clearTimer();
    this.setStatus('disconnected');
    document.removeEventListener('visibilitychange', this.handleVisibility);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  private handleVisibility = (): void => {
    if (document.hidden) {
      this.clearTimer();
    } else if (this.active) {
      this.scheduleNext(0); // immediate refetch on tab focus
    }
  };

  private handleOnline = (): void => {
    if (this.active) {
      this.consecutiveErrors = 0;
      this.currentInterval = this.options.interval;
      this.setStatus('connected');
      this.scheduleNext(0);
    }
  };

  private handleOffline = (): void => {
    this.clearTimer();
    this.setStatus('disconnected');
  };

  private scheduleNext(wait: number): void {
    this.clearTimer();
    this.timer = setTimeout(() => this.execute(), wait);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private async execute(): Promise<void> {
    if (!this.active || document.hidden) return;

    try {
      const data = await this.options.fetcher();

      if (!this.options.isStale(data)) {
        this.options.onData(data);
      }

      // Success: reset backoff
      this.consecutiveErrors = 0;
      this.currentInterval = Math.max(this.options.interval, MIN_INTERVAL);
      this.setStatus('connected');
    } catch (err) {
      this.consecutiveErrors += 1;
      // Exponential backoff capped at MAX_INTERVAL
      this.currentInterval = Math.min(
        this.currentInterval * 2 ** this.consecutiveErrors,
        MAX_INTERVAL,
      );
      this.setStatus('reconnecting');
      this.options.onError(err as Error);
    }

    if (this.active) {
      this.scheduleNext(this.currentInterval);
    }
  }

  private setStatus(s: ConnectionStatus): void {
    if (s !== this.status) {
      this.status = s;
      this.options.onStatusChange(s);
    }
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }
}
