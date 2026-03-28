'use client';
import { useState } from 'react';
import { X, ScanLine, Loader, CheckCircle } from 'lucide-react';
import { webhookService } from '@/services/api';
import { useUIStore } from '@/store/slices/uiSlice';
import toast from 'react-hot-toast';
import type { ScanPayload } from '@/types';

const DEFAULTS: ScanPayload = {
  sample_id: '',
  test_name: '',
  received_at: new Date().toISOString().slice(0, 16),
  agreed_tat_hours: 24,
  priority_tat: 'NORMAL',
  method: '',
  specimen_type: 'Serum',
  test_id: '',
};

export default function ScanDrawer() {
  const close = useUIStore((s) => s.setScanDrawerOpen);
  const [form, setForm] = useState<ScanPayload>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ count: number; ids: string[] } | null>(null);

  const set = (field: keyof ScanPayload, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sample_id.trim() || !form.test_name.trim()) {
      toast.error('Sample ID and Test Name are required');
      return;
    }
    setLoading(true);
    try {
      const res = await webhookService.submit({
        ...form,
        received_at: new Date(form.received_at).toISOString(),
        agreed_tat_hours: Number(form.agreed_tat_hours),
      });
      setLastResult({ count: res.count, ids: res.sample_ids });
      toast.success(`${res.count} sample(s) queued for processing`);
      setForm({ ...DEFAULTS, received_at: new Date().toISOString().slice(0, 16) });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={() => close(false)} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Scan and submit sample">
        <div className="drawer-header">
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <ScanLine size={16} color="var(--brand-primary)" />
              <span className="font-700 text-primary" style={{ fontSize: '1rem' }}>Scan / Submit Sample</span>
            </div>
            <div className="text-xs text-muted">Manually queue a sample for TAT computation</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => close(false)} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Last result */}
          {lastResult && (
            <div className="card" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)', padding: '12px 14px' }}>
              <div className="flex items-center gap-2">
                <CheckCircle size={15} color="var(--color-normal)" />
                <span className="text-sm font-700" style={{ color: 'var(--color-normal)' }}>
                  Queued {lastResult.count} sample(s)
                </span>
              </div>
              <div className="mono text-xs text-muted" style={{ marginTop: 4 }}>
                {lastResult.ids.join(', ')}
              </div>
            </div>
          )}

          <form id="scan-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="scan-sample-id">Sample ID *</label>
                <input
                  id="scan-sample-id"
                  className="input"
                  placeholder="SAP-2026-00142"
                  value={form.sample_id}
                  onChange={(e) => set('sample_id', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="scan-test-id">Test ID</label>
                <input
                  id="scan-test-id"
                  className="input"
                  placeholder="TID-001"
                  value={form.test_id}
                  onChange={(e) => set('test_id', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="scan-test-name">Test Name *</label>
              <input
                id="scan-test-name"
                className="input"
                placeholder="e.g. test_1"
                value={form.test_name}
                onChange={(e) => set('test_name', e.target.value)}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="scan-method">Method</label>
                <input
                  id="scan-method"
                  className="input"
                  placeholder="EIA"
                  value={form.method}
                  onChange={(e) => set('method', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="scan-specimen">Specimen Type</label>
                <input
                  id="scan-specimen"
                  className="input"
                  placeholder="Serum"
                  value={form.specimen_type}
                  onChange={(e) => set('specimen_type', e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="scan-received-at">Received At *</label>
                <input
                  id="scan-received-at"
                  className="input"
                  type="datetime-local"
                  value={form.received_at}
                  onChange={(e) => set('received_at', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="scan-tat">Agreed TAT (hrs) *</label>
                <input
                  id="scan-tat"
                  className="input"
                  type="number"
                  min={1}
                  max={720}
                  value={form.agreed_tat_hours}
                  onChange={(e) => set('agreed_tat_hours', Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="scan-priority">Priority TAT</label>
              <select
                id="scan-priority"
                className="select"
                value={form.priority_tat}
                onChange={(e) => set('priority_tat', e.target.value as ScanPayload['priority_tat'])}
              >
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
          </form>
        </div>

        <div className="drawer-footer">
          <button className="btn btn-ghost" onClick={() => close(false)}>Cancel</button>
          <button
            className="btn btn-primary"
            form="scan-form"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting…</>
            ) : (
              <><ScanLine size={14} /> Submit Sample</>
            )}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
