import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Aspira TAT Monitor — Real-Time Lab Pipeline',
  description:
    'Real-time turnaround time and batch monitoring system for laboratory sample processing. Track SLA breaches, missed batches, and pipeline health live.',
  keywords: 'lab monitoring, TAT, turnaround time, batch tracking, SLA breach, LIMS dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0c10" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧪</text></svg>" />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-overlay)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              fontSize: '0.825rem',
              fontFamily: "'Inter', sans-serif",
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0a0c10' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0a0c10' } },
          }}
        />
      </body>
    </html>
  );
}
