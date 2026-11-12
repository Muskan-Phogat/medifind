import React from 'react';
import { ShieldCheck, Clock } from 'lucide-react';

export function ConfidenceMeter({ score = 0, label, minutesAgo = 0, source = 'manual', showMeta = true }) {
  const numScore = Math.max(0, Math.min(100, Math.round(score)));

  let color = 'var(--color-ink-500)';
  let bgTint = 'var(--color-ink-100)';
  let border = 'var(--color-border)';

  if (numScore >= 75) {
    color = 'var(--color-pine-800)';
    bgTint = 'var(--color-pine-100)';
    border = 'var(--color-pine-700)';
  } else if (numScore >= 40) {
    color = 'var(--color-saffron-600)';
    bgTint = 'var(--color-saffron-100)';
    border = 'var(--color-saffron-500)';
  }

  const displayLabel = label || (numScore >= 75 ? 'Confirmed recently' : numScore >= 40 ? 'Likely available' : 'Unverified');

  const sourceLabels = {
    ping: 'Live verified via auto-ping',
    manual: 'Chemist direct stock toggle',
    csv: 'Store inventory upload',
    unverified: 'Historical inference',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Header with Badge & Tabular Score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: bgTint,
            color: color,
            border: `1px solid ${border}`,
            borderRadius: 'var(--radius-xs)',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          <ShieldCheck size={13} strokeWidth={2.2} />
          <span>{displayLabel}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <span className="num" style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color }}>
            {numScore}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--color-ink-500)' }}>/100</span>
        </div>
      </div>

      {/* Tactile 1px Bordered Meter Bar */}
      <div
        role="progressbar"
        aria-valuenow={numScore}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`Stock confidence score ${numScore}%`}
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'var(--color-paper-warm)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xs)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${numScore}%`,
            backgroundColor: color,
            transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      {/* Freshness Microcopy in simple Indian English */}
      {showMeta && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--color-ink-500)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} />
            {minutesAgo <= 2 ? (
              <strong style={{ color: 'var(--color-pine-800)' }}>Confirmed just now</strong>
            ) : minutesAgo < 60 ? (
              <span>Confirmed <span className="num">{minutesAgo}</span> mins ago</span>
            ) : (
              <span>Confirmed <span className="num">{Math.floor(minutesAgo / 60)}h</span> ago</span>
            )}
          </span>

          <span title={sourceLabels[source] || source} style={{ textTransform: 'capitalize' }}>
            {source === 'ping' ? '⚡ Live reply' : source}
          </span>
        </div>
      )}
    </div>
  );
}
