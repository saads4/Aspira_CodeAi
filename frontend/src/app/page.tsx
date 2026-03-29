'use client';
import Link from 'next/link';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Real-Time Pipeline',
    desc: 'Live visibility into every sample — from SAP intake to result ETA. Updates every 4 seconds without page refresh.',
    accent: '#3b82f6',
  },
  {
    icon: '🎯',
    title: 'SLA Breach Detection',
    desc: 'Automatic breach flagging when ETA exceeds SLA deadline. Overage calculated to the minute with instant alerts.',
    accent: '#ef4444',
  },
  {
    icon: '📦',
    title: 'Smart Batch Assignment',
    desc: '30-day window scan finds the next valid EDOS batch automatically. Missed cutoffs trigger immediate re-assignment.',
    accent: '#f59e0b',
  },
  {
    icon: '🧠',
    title: 'EDOS Intelligence',
    desc: '1,070+ test rules parsed from EDOS CSV. Schedules like "Tue/Fri 6pm" resolved to exact IST batch windows.',
    accent: '#22c55e',
  },
  {
    icon: '🔔',
    title: 'Multi-Channel Alerts',
    desc: 'Console, email, and MongoDB persistent alerts for MISSED_BATCH, SLA_BREACH and DELAY_ESCALATION events.',
    accent: '#f97316',
  },
  {
    icon: '📡',
    title: 'SAP Webhook Intake',
    desc: 'Accepts single or bulk test payloads from SAP. Validated, normalized, and queued via BullMQ within milliseconds.',
    accent: '#a855f7',
  },
];

const STATS = [
  { value: '1,070+', label: 'EDOS Test Rules' },
  { value: '4s',     label: 'Update Interval'  },
  { value: '30-day', label: 'Batch Scan Window' },
  { value: '< 1ms',  label: 'Queue Latency'     },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>

      {/* ── Ambient glow orbs ─────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '30%',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '-10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(10,12,16,0.80)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        padding: '0 48px',
        display: 'flex', alignItems: 'center', height: 60, gap: 16,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: '#fff', fontSize: 14,
          }}>A</div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Aspira TAT Monitor
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px',
            borderRadius: 99, background: 'rgba(59,130,246,0.14)',
            border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6',
            letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>v3.0</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 0 3px rgba(34,197,94,0.25)',
              animation: 'pulse-green 2s infinite',
              display: 'inline-block',
            }} />
            Live System
          </span>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        <section style={{
          padding: '96px 48px 80px',
          maxWidth: 1200, margin: '0 auto',
          textAlign: 'center',
        }}>
          {/* Pill badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99,
            border: '1px solid rgba(59,130,246,0.3)',
            background: 'rgba(59,130,246,0.08)',
            fontSize: '0.75rem', fontWeight: 600,
            color: '#93c5fd', letterSpacing: '0.3px',
            marginBottom: 28,
            animation: 'slideDown 0.5s ease-out',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
            Automated TAT &amp; Batch Monitoring · Node.js + BullMQ + MongoDB
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-2px',
            color: 'var(--text-primary)',
            marginBottom: 20,
            animation: 'slideDown 0.6s ease-out 0.1s both',
          }}>
            Real-Time Lab Pipeline{' '}
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Intelligence</span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            maxWidth: 640, margin: '0 auto 40px',
            animation: 'slideDown 0.6s ease-out 0.2s both',
          }}>
            Track every lab sample from SAP intake to result ETA. Catch SLA breaches,
            missed batches, and escalations — in real time, before patients are impacted.
          </p>

          {/* CTAs */}
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
            animation: 'slideDown 0.6s ease-out 0.3s both',
            marginBottom: 64,
          }}>
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              textDecoration: 'none',
              boxShadow: '0 0 40px rgba(59,130,246,0.3)',
              transition: 'box-shadow 200ms, transform 200ms',
            }}>
              🚀 Launch Dashboard
            </Link>
            <Link href="/dashboard/scan" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 10,
              background: 'transparent',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem',
              textDecoration: 'none',
              transition: 'background 200ms, border-color 200ms',
            }}>
              📡 Submit a Sample
            </Link>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 0, justifyContent: 'center',
            border: '1px solid var(--border-subtle)',
            borderRadius: 14,
            background: 'var(--bg-surface)',
            overflow: 'hidden',
            animation: 'slideDown 0.6s ease-out 0.4s both',
            maxWidth: 640, margin: '0 auto',
          }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{
                flex: 1, padding: '20px 16px', textAlign: 'center',
                borderRight: i < STATS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div style={{
                  fontSize: '1.5rem', fontWeight: 800,
                  color: 'var(--text-primary)', letterSpacing: '-1px',
                  marginBottom: 4,
                }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Dashboard Preview Mockup ──────────────────────────────────── */}
        <section style={{ padding: '0 48px 80px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            border: '1px solid var(--border-default)',
            borderRadius: 18,
            overflow: 'hidden',
            background: 'var(--bg-surface)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            animation: 'slideDown 0.8s ease-out 0.5s both',
          }}>
            {/* Window chrome */}
            <div style={{
              height: 40, background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px',
            }}>
              {['#ef4444','#f59e0b','#22c55e'].map((c) => (
                <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.85 }} />
              ))}
              <div style={{
                flex: 1, margin: '0 16px',
                background: 'var(--bg-overlay)', borderRadius: 5,
                height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', color: 'var(--text-muted)',
              }}>
                localhost:3000/dashboard
              </div>
            </div>

            {/* Fake dashboard interior */}
            <div style={{ display: 'flex', height: 380 }}>
              {/* Sidebar strip */}
              <div style={{ width: 52, background: 'var(--bg-elevated)', borderRight: '1px solid var(--border-subtle)', padding: '14px 8px', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800 }}>A</div>
                {['■','□','△','◈'].map((s, i) => (
                  <div key={i} style={{ fontSize: 14, color: i === 0 ? '#3b82f6' : 'var(--text-muted)', opacity: i === 0 ? 1 : 0.5 }}>{s}</div>
                ))}
              </div>

              {/* Main content */}
              <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
                {/* KPI row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                  {[
                    { label: 'Total', val: '142', color: 'var(--text-primary)' },
                    { label: 'Assigned', val: '118', color: '#22c55e' },
                    { label: 'Delayed', val: '14', color: '#f97316' },
                    { label: 'Breach', val: '7', color: '#ef4444' },
                    { label: 'Missed', val: '3', color: '#f59e0b' },
                  ].map((k) => (
                    <div key={k.label} style={{
                      background: 'var(--bg-elevated)', borderRadius: 10,
                      padding: '10px 12px', border: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>{k.label}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: k.color }}>{k.val}</div>
                    </div>
                  ))}
                </div>

                {/* Table preview */}
                <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr 1fr 80px', gap: 0, padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)' }}>
                    {['SAMPLE ID','TEST','STATUS','ETA','SLA','OVERAGE'].map((h) => (
                      <div key={h} style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
                    ))}
                  </div>
                  {[
                    { id: 'SAP-001', test: 'test_1', status: 'Assigned', statusColor: '#22c55e', eta: '28 Mar, 20:00', sla: '29 Mar, 14:30', ovr: '—' },
                    { id: 'SAP-002', test: 'test_5', status: 'Delayed',  statusColor: '#f97316', eta: '30 Mar, 08:00', sla: '29 Mar, 22:00', ovr: '+480m' },
                    { id: 'SAP-003', test: 'test_2', status: 'Breach',   statusColor: '#ef4444', eta: '31 Mar, 14:30', sla: '30 Mar, 18:00', ovr: '+1320m'},
                  ].map((row) => (
                    <div key={row.id} style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr 1fr 80px',
                      padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                      borderLeft: `3px solid ${row.statusColor}`,
                    }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-primary)', fontWeight: 600 }}>{row.id}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{row.test}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: row.statusColor }}>{row.status}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{row.eta}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{row.sla}</div>
                      <div style={{ fontSize: '0.7rem', color: row.ovr !== '—' ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>{row.ovr}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Grid ─────────────────────────────────────────────── */}
        <section style={{ padding: '20px 48px 80px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: 10 }}>
              Built for lab-grade reliability
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Every module designed to handle real-world scheduling complexity
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 14, padding: '22px 20px',
                transition: 'border-color 200ms, transform 200ms',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = f.accent + '55';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10, fontSize: 20,
                  background: `${f.accent}18`,
                  border: `1px solid ${f.accent}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 7 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tech stack strip ──────────────────────────────────────────── */}
        <section style={{ padding: '0 48px 80px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 14, padding: '24px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 20,
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                Infrastructure Stack
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Event-driven · IST timezone-aware · Fully persistent
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['Node.js', 'Express', 'BullMQ', 'Redis', 'MongoDB Atlas', 'Next.js', 'TypeScript', 'Zustand'].map((t) => (
                <span key={t} style={{
                  padding: '5px 12px', borderRadius: 99,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  fontSize: '0.75rem', fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section style={{
          padding: '0 48px 100px', maxWidth: 700, margin: '0 auto', textAlign: 'center',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.10) 0%, rgba(99,102,241,0.10) 100%)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 20, padding: '52px 40px',
          }}>
            <div style={{ fontSize: '2.4rem', marginBottom: 16 }}>🧪</div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.8px', marginBottom: 12 }}>
              Ready to monitor your lab?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 28 }}>
              Open the live dashboard to see your sample pipeline, batch utilisation, and
              exception alerts — all in real time.
            </p>
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#fff', fontWeight: 700, fontSize: '1rem',
              textDecoration: 'none',
              boxShadow: '0 0 40px rgba(59,130,246,0.35)',
            }}>
              Open Live Dashboard →
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '20px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>A</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Aspira TAT Monitor v3.0</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Node.js · BullMQ · MongoDB Atlas · Next.js App Router
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[['Dashboard','/dashboard'],['Batches','/dashboard/batches'],['Exceptions','/dashboard/exceptions'],['Scan','/dashboard/scan']].map(([l,h]) => (
            <Link key={l} href={h} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 120ms' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-green {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          50%      { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
        }
        a:hover { opacity: 0.9; }
        @media (max-width: 768px) {
          section { padding-left: 20px !important; padding-right: 20px !important; }
          nav { padding: 0 20px !important; }
          footer { padding: 20px !important; }
          div[style*="repeat(3,1fr)"] { grid-template-columns: 1fr !important; }
          div[style*="repeat(5,1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
}
