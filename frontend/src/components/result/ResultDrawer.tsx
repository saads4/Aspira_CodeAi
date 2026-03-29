'use client';
import { useState } from 'react';
import { X, CheckCircle, Loader } from 'lucide-react';
import { resultService } from '@/services/api';
import { useUIStore } from '@/store/slices/uiSlice';
import { useStatsStore } from '@/store/slices/statsSlice';
import toast from 'react-hot-toast';

interface ResultPayload {
  sample_id: string;
  test_name: string;
  result_ready_at: string;
}

const DEFAULTS: ResultPayload = {
  sample_id: '',
  test_name: '',
  result_ready_at: new Date().toISOString().slice(0, 16),
};

export default function ResultDrawer() {
  // ⚠️ ALL hooks must be at the top — before any conditional returns.
  // The parent guards with {resultOpen && <ResultDrawer />} so this
  // component only mounts when the drawer is open.
  const { setResultDrawerOpen } = useUIStore();
  const [form, setForm] = useState<ResultPayload>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);

  const close = setResultDrawerOpen;

  const set = (field: keyof ResultPayload, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const isNotEmpty = (value: string): boolean => {
    // Remove all whitespace including non-breaking spaces and check if anything remains
    const cleaned = value.replace(/[\s\u200B-\u200D\uFEFF]/g, '');
    return cleaned.length > 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNotEmpty(form.sample_id) || !isNotEmpty(form.test_name)) {
      toast.error('Sample ID and Test Name are required');
      return;
    }
    setLoading(true);
    try {
      await resultService.submit({
        ...form,
        result_ready_at: new Date(form.result_ready_at).toISOString(),
      });
      setLastSubmitted(form.sample_id);
      toast.success('Sample marked as completed');
      setForm({ ...DEFAULTS, result_ready_at: new Date().toISOString().slice(0, 16) });
      
      // Trigger dashboard stats refresh
      console.log('RESULT DRAWER: Triggering stats refresh after submission');
      await useStatsStore.getState().fetch();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={() => close(false)} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Mark sample as completed">
        <div className="drawer-header">
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <CheckCircle size={16} color="var(--color-normal)" />
              <span className="font-700 text-primary" style={{ fontSize: '1rem' }}>Mark Sample Complete</span>
            </div>
            <div className="text-xs text-muted">Submit result completion for TAT calculation</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => close(false)} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Last submitted */}
          {lastSubmitted && (
            <div className="card" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)', padding: '12px 14px' }}>
              <div className="flex items-center gap-2">
                <CheckCircle size={15} color="var(--color-normal)" />
                <span className="text-sm font-700" style={{ color: 'var(--color-normal)' }}>
                  Sample marked as completed
                </span>
              </div>
              <div className="mono text-xs text-muted" style={{ marginTop: 4 }}>
                {lastSubmitted}
              </div>
            </div>
          )}

          <form id="result-form" onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="result-sample-id">Sample ID *</label>
              <input
                id="result-sample-id"
                className={`input ${!isNotEmpty(form.sample_id) && form.sample_id.length > 0 ? 'input-error' : ''}`}
                placeholder="SAP-2026-00142"
                value={form.sample_id}
                onChange={(e) => set('sample_id', e.target.value)}
              />
              {!isNotEmpty(form.sample_id) && form.sample_id.length > 0 && (
                <div className="text-xs text-danger" style={{ marginTop: 4 }}>
                  Sample ID cannot be empty or whitespace only
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="result-test-name">Test Name *</label>
              <input
                id="result-test-name"
                className={`input ${!isNotEmpty(form.test_name) && form.test_name.length > 0 ? 'input-error' : ''}`}
                placeholder="e.g. test_1"
                value={form.test_name}
                onChange={(e) => set('test_name', e.target.value)}
              />
              {!isNotEmpty(form.test_name) && form.test_name.length > 0 && (
                <div className="text-xs text-danger" style={{ marginTop: 4 }}>
                  Test Name cannot be empty or whitespace only
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="result-ready-at">Result Ready At *</label>
              <input
                id="result-ready-at"
                className="input"
                type="datetime-local"
                value={form.result_ready_at}
                onChange={(e) => set('result_ready_at', e.target.value)}
              />
            </div>
          </form>
        </div>

        <div className="drawer-footer">
          <button className="btn btn-ghost" onClick={() => close(false)}>Cancel</button>
          <button
            className="btn btn-primary"
            form="result-form"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Marking as Complete…</>
            ) : (
              <><CheckCircle size={14} /> Mark as Completed</>
            )}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
