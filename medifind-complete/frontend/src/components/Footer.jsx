import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--color-border)',
        backgroundColor: '#FFFFFF',
        padding: 'var(--space-8) 0 var(--space-6)',
      }}
    >
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 800, color: 'var(--color-pine-900)' }}>
                MediFind
              </span>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--color-saffron-500)', display: 'inline-block' }} />
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', maxWidth: '380px', lineHeight: 1.5 }}>
              We don't list medicines, we verify them. Designed to connect patients directly with independent neighborhood chemists across Indian localities.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div>
              <h5 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-ink-500)', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Platform
              </h5>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--text-xs)' }}>
                <li><Link to="/" style={{ color: 'var(--color-ink-700)', textDecoration: 'none' }}>Medicine Search</Link></li>
                <li><Link to="/how-it-works" style={{ color: 'var(--color-ink-700)', textDecoration: 'none' }}>How it Works</Link></li>
                <li><Link to="/pharmacist-sim" style={{ color: 'var(--color-ink-700)', textDecoration: 'none' }}>Pharmacist Phone Simulator</Link></li>
                <li><Link to="/pharmacy" style={{ color: 'var(--color-ink-700)', textDecoration: 'none' }}>Chemist Partner Portal</Link></li>
              </ul>
            </div>

            <div>
              <h5 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-ink-500)', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Trust & Verification
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--color-ink-700)' }}>
                <span>• 240-minute freshness decay</span>
                <span>• Auto-Ping verification</span>
                <span>• 60-minute pickup holds</span>
                <span>• Un-bribable confidence score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Medical Disclaimer as required by spec */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--color-paper-warm)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            color: 'var(--color-ink-700)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--color-pine-900)' }}>Medical Disclaimer: </strong>
          MediFind shares real-time availability information only. It does not sell, deliver, or recommend medicines, and provides no medical advice or diagnostic services. All prescription medicines require verification of a valid physical or digital doctor's prescription in person by the licensed chemist before dispensing.
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--color-ink-500)', flexWrap: 'wrap', gap: '8px' }}>
          <span>© 2026 MediFind. Built for Indian community medical stores.</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>Prototype: simulated WhatsApp, fictional pharmacies.</span>
            <span>•</span>
            <Link to="/demo-reset" style={{ color: 'var(--color-ink-500)', textDecoration: 'none' }}>
              Reset Demo
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
