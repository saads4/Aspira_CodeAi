'use client';
import Topbar from '@/components/layout/Topbar';

import { CheckCircle, ArrowRight, Clock, CheckSquare } from 'lucide-react';
import { useUIStore } from '@/store/slices/uiSlice';

export default function ResultPage() {
  const { setResultDrawerOpen } = useUIStore();

  const TIPS = [
    { icon: '✅', title: 'Mark Complete', desc: 'Submit sample_id, test_name, and result_ready_at to mark samples as completed' },
    { icon: '📊', title: 'TAT Calculation', desc: 'Actual TAT minutes are computed from received_at to result_ready_at' },
    { icon: '🎯', title: 'SLA Metrics', desc: 'SLA breach/achievement flags are updated automatically' },
    { icon: '🔄', title: 'Worker Processing', desc: 'Result webhook triggers background worker processing' },
  ];

  return (
    <div className="layout-main">
      <Topbar title="Complete / Result Entry" />
      <main className="page-content">
        {/* Hero card */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(16,185,129,0.08) 100%)',
            borderColor: 'rgba(34,197,94,0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: '40px 48px',
            marginBottom: 24,
            display: 'flex',
            gap: 32,
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
              <div style={{
                width: 48, height: 48,
                background: 'var(--color-normal)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle size={24} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
                  Result Entry Interface
                </h2>
                <div className="text-xs text-muted">Mark samples as completed with TAT calculation</div>
              </div>
            </div>
            <p className="text-secondary text-sm" style={{ lineHeight: 1.7, marginBottom: 20 }}>
              Submit completed sample results to calculate actual turnaround time and update SLA metrics.
              The system will automatically compute TAT from sample receipt to result completion.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setResultDrawerOpen(true)}
              id="open-result-drawer-btn"
              style={{ padding: '11px 24px', fontSize: '0.9rem' }}
            >
              <CheckCircle size={16} />
              Mark Sample Complete
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: 200, height: 200,
              background: 'var(--bg-elevated)',
              border: '2px dashed var(--color-normal)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 10,
              color: 'var(--text-muted)',
            }}>
              <CheckSquare size={40} color="var(--color-normal)" strokeWidth={1.2} />
              <div className="text-xs text-center" style={{ lineHeight: 1.5 }}>
                Enter sample ID or<br/>scan barcode to complete
              </div>
            </div>
          </div>
        </div>

        {/* Tips grid */}
        <div className="section-heading">
          <h2 className="section-title">How It Works</h2>
        </div>
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {TIPS.map((tip) => (
            <div key={tip.title} className="card card-elevated" style={{ display: 'flex', gap: 14, padding: 16 }}>
              <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>{tip.icon}</div>
              <div>
                <div className="text-sm font-700 text-primary" style={{ marginBottom: 4 }}>{tip.title}</div>
                <div className="text-xs text-muted">{tip.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* API quick reference */}
        <div className="card" style={{ padding: 20 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
            <Clock size={14} color="var(--text-muted)" />
            <span className="text-xs text-muted font-600 uppercase">API Quick Reference</span>
          </div>
          <pre
            className="mono"
            style={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: 16,
              fontSize: '0.78rem',
              overflowX: 'auto',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
            }}
          >{`POST http://localhost:3000/webhook/result
Content-Type: application/json

{
  "sample_id": "SAP-2026-00142",
  "test_name": "test_1",
  "result_ready_at": "2026-03-29T14:30:00+05:30"
}`}
          </pre>
        </div>
      </main>


    </div>
  );
}
