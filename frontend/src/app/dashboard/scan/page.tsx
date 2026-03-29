'use client';
import Topbar from '@/components/layout/Topbar';

import { ScanLine, ArrowRight, FlaskConical, Clock } from 'lucide-react';
import { useUIStore } from '@/store/slices/uiSlice';

export default function ScanPage() {
  const { setScanDrawerOpen } = useUIStore();

  const TIPS = [
    { icon: '🧪', title: 'Single Sample', desc: 'Submit one sample with a unique Sample ID and test name' },
    { icon: '📦', title: 'Batch Submit', desc: 'POST /webhook with a tests:[] array for multi-test payloads' },
    { icon: '⏱️', title: 'ETA Computation', desc: 'TAT is calculated from EDOS schedule + batch window in IST' },
    { icon: '🚨', title: 'Alerts', desc: 'Missed batch and SLA breach alerts fire automatically post-processing' },
  ];

  return (
    <div className="layout-main">
      <Topbar title="Scan / Submit Sample" />
      <main className="page-content">
        {/* Hero card */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.08) 100%)',
            borderColor: 'rgba(59,130,246,0.25)',
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
                background: 'var(--brand-primary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ScanLine size={24} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
                  Barcode Scan Interface
                </h2>
                <div className="text-xs text-muted">Manual sample submission + TAT queue</div>
              </div>
            </div>
            <p className="text-secondary text-sm" style={{ lineHeight: 1.7, marginBottom: 20 }}>
              Submit a lab sample for ETA computation, batch assignment, and SLA monitoring.
              The system will automatically find the next valid EDOS batch window and compute
              the turnaround time in IST.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setScanDrawerOpen(true)}
              id="open-scan-drawer-btn"
              style={{ padding: '11px 24px', fontSize: '0.9rem' }}
            >
              <ScanLine size={16} />
              Open Scan Interface
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: 200, height: 200,
              background: 'var(--bg-elevated)',
              border: '2px dashed var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 10,
              color: 'var(--text-muted)',
            }}>
              <FlaskConical size={40} color="var(--brand-primary)" strokeWidth={1.2} />
              <div className="text-xs text-center" style={{ lineHeight: 1.5 }}>
                Scan barcode or<br/>enter sample ID manually
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
          >{`POST http://localhost:3000/webhook
Content-Type: application/json

{
  "sample_id": "SAP-2026-00142",
  "test_name": "test_1",
  "received_at": "2026-03-28T14:30:00+05:30",
  "agreed_tat_hours": 24,
  "priority_tat": "NORMAL",
  "method": "EIA",
  "specimen_type": "Serum"
}`}
          </pre>
        </div>
      </main>


    </div>
  );
}
