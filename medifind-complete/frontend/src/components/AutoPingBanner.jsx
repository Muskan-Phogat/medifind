import React from 'react';
import { Radio, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from './common/Button';

export function AutoPingBanner({
  onTriggerPing,
  isPinging,
  pingBatch,
  pingStatuses,
  timeRemaining,
  isComplete,
}) {
  if (!isPinging && !pingBatch) {
    return (
      <div
        className="paper-card"
        style={{
          padding: 'var(--space-4) var(--space-5)',
          backgroundColor: 'var(--color-saffron-50)',
          borderColor: 'var(--color-saffron-500)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: 'var(--color-saffron-600)' }}>
            <Radio size={22} className="spin-slow" />
          </div>
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-900)' }}>
              Stock data is older than 4 hours for nearby chemists
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-700)' }}>
              Ask top 3 pharmacies right now with 1-tap Auto-Ping.
            </p>
          </div>
        </div>

        <Button variant="accent" size="sm" onClick={onTriggerPing}>
          Verify Right Now (Auto-Ping)
        </Button>
      </div>
    );
  }

  // Active / Polling Banner
  const total = pingStatuses ? Object.keys(pingStatuses).length : 3;
  const answered = pingStatuses
    ? Object.values(pingStatuses).filter((s) => s === 'yes' || s === 'no').length
    : 0;

  return (
    <div
      className="paper-card"
      style={{
        padding: 'var(--space-4) var(--space-5)',
        backgroundColor: isComplete ? 'var(--color-pine-50)' : 'var(--color-paper-card)',
        borderColor: isComplete ? 'var(--color-pine-700)' : 'var(--color-pine-800)',
        borderWidth: '1.5px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: isComplete ? 'var(--color-pine-800)' : 'var(--color-saffron-500)' }}>
            {isComplete ? <CheckCircle2 size={22} /> : <RefreshCw size={20} className="spin-fast" />}
          </div>
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-pine-900)' }}>
              {isComplete
                ? 'Auto-Ping verification complete'
                : 'Checking with 3 nearby pharmacies in real-time...'}
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)' }}>
              {isComplete
                ? 'Result cards below have been reordered by live stock availability and confidence.'
                : `Waiting for pharmacists to reply on their phone. (${answered}/${total} replied)`}
            </p>
          </div>
        </div>

        {!isComplete && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)' }}>
            <Clock size={13} />
            <span>Timeout in <strong className="num">{timeRemaining}s</strong></span>
          </div>
        )}
      </div>

      {/* Progress Line */}
      <div
        style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'var(--color-paper-warm)',
          borderRadius: 'var(--radius-xs)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: isComplete ? '100%' : `${Math.max(15, (answered / total) * 100)}%`,
            backgroundColor: isComplete ? 'var(--color-pine-800)' : 'var(--color-saffron-500)',
            transition: 'width 300ms ease',
          }}
        />
      </div>
    </div>
  );
}
