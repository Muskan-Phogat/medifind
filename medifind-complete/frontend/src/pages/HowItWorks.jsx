import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Radio, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../components/common/Button';

export function HowItWorks() {
  return (
    <div style={{ flex: 1, padding: 'var(--space-8) 0 var(--space-12)' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-ink-700)',
            textDecoration: 'none',
            fontWeight: 500,
            marginBottom: 'var(--space-4)',
          }}
        >
          <ArrowLeft size={16} /> Back to Search
        </Link>

        <div className="paper-card" style={{ padding: 'var(--space-8) var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-pine-900)', marginBottom: 'var(--space-2)' }}>
            How MediFind Works
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-700)', marginBottom: 'var(--space-6)', lineHeight: 1.5 }}>
            Traditional medicine aggregators list thousands of medicines from outdated databases, leaving families wandering between chemists in emergencies. MediFind replaces static lists with an objective verification protocol.
          </p>

          {/* Clean Inline SVG Flow Illustration (Search -> Ping -> Confirm -> Reserve) */}
          <div
            style={{
              padding: 'var(--space-6)',
              backgroundColor: 'var(--color-paper-warm)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              marginBottom: 'var(--space-8)',
              overflowX: 'auto',
            }}
          >
            <svg
              viewBox="0 0 680 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', minWidth: '580px', display: 'block' }}
            >
              {/* Step 1: Search */}
              <rect x="20" y="25" width="130" height="90" rx="6" fill="#FFFFFF" stroke="#1B4332" strokeWidth="1.5" />
              <circle cx="85" cy="55" r="16" fill="#E8F0EC" />
              <path d="M81 51l8 8m-2-5a4 4 0 11-8 0 4 4 0 018 0z" stroke="#1B4332" strokeWidth="1.75" strokeLinecap="round" />
              <text x="85" y="95" textAnchor="middle" fill="#18181B" fontSize="12" fontWeight="600" fontFamily="sans-serif">1. Search Salt/Brand</text>

              {/* Arrow 1 */}
              <path d="M160 70h28m-4-5l5 5-5 5" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />

              {/* Step 2: Auto-Ping */}
              <rect x="198" y="25" width="130" height="90" rx="6" fill="#FFFFFF" stroke="#D97706" strokeWidth="1.5" />
              <circle cx="263" cy="55" r="16" fill="#FEF3C7" />
              <path d="M257 55a6 6 0 0112 0m-9 0a3 3 0 016 0" stroke="#B45309" strokeWidth="1.75" strokeLinecap="round" />
              <text x="263" y="95" textAnchor="middle" fill="#18181B" fontSize="12" fontWeight="600" fontFamily="sans-serif">2. Auto-Ping Top 3</text>

              {/* Arrow 2 */}
              <path d="M338 70h28m-4-5l5 5-5 5" stroke="#1B4332" strokeWidth="2" strokeLinecap="round" />

              {/* Step 3: Chemist Confirms */}
              <rect x="376" y="25" width="130" height="90" rx="6" fill="#FFFFFF" stroke="#1B4332" strokeWidth="1.5" />
              <circle cx="441" cy="55" r="16" fill="#E8F0EC" />
              <path d="M434 55l5 5 10-10" stroke="#1B4332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <text x="441" y="95" textAnchor="middle" fill="#18181B" fontSize="12" fontWeight="600" fontFamily="sans-serif">3. Chemist Verifies</text>

              {/* Arrow 3 */}
              <path d="M516 70h28m-4-5l5 5-5 5" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />

              {/* Step 4: 60m Hold */}
              <rect x="554" y="25" width="116" height="90" rx="6" fill="#FFFFFF" stroke="#1B4332" strokeWidth="1.5" />
              <circle cx="612" cy="55" r="16" fill="#E8F0EC" />
              <path d="M612 47v8l5 3" stroke="#1B4332" strokeWidth="1.75" strokeLinecap="round" />
              <text x="612" y="95" textAnchor="middle" fill="#18181B" fontSize="12" fontWeight="600" fontFamily="sans-serif">4. 60-Min Hold</text>
            </svg>
          </div>

          {/* Three Human Paragraphs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--color-ink-900)', lineHeight: 1.6 }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-pine-900)', marginBottom: '4px' }}>
                1. Typo-Tolerant Search & Pure Freshness Decay
              </h3>
              <p style={{ color: 'var(--color-ink-700)' }}>
                You type what you remember — whether it is "Calpol 650", "Paracetamol", or a misspelled brand name. MediFind normalizes the chemical composition and finds all independent chemists near you. Crucially, every stock status has a 240-minute freshness clock: if a chemist hasn't verified their stock in the last 4 hours, their confidence score decays toward zero.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-pine-900)', marginBottom: '4px' }}>
                2. Live Auto-Ping: Asking Chemists Directly
              </h3>
              <p style={{ color: 'var(--color-ink-700)' }}>
                When stock information is stale, MediFind doesn't guess. With one tap, Auto-Ping pings the top 3 nearest pharmacies with a simple prompt: <em>"Customer nearby needs [Medicine]. Do you have it in stock right now?"</em> As soon as a pharmacist taps 'Yes' on their phone, the result cards reorder in real-time, locking in an un-bribable 99% Stock Confidence Score.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-pine-900)', marginBottom: '4px' }}>
                3. The 60-Minute Counter Hold
              </h3>
              <p style={{ color: 'var(--color-ink-700)' }}>
                Finding out a medicine is available means nothing if someone buys the last strip while you are driving there. MediFind lets you request a temporary 60-minute hold. You receive a unique 4-digit pickup code. No money is taken online: you simply show your token at the store counter, present your doctor's prescription for verification, and purchase your medicine with total peace of mind.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg">
                Start Searching Medicines
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
