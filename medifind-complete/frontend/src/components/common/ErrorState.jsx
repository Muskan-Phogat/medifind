import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({ message, onRetry, style = {} }) {
  return (
    <div
      style={{
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: '#FEF2F2',
        border: '1px solid #FCA5A5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-3)',
        textAlign: 'center',
        ...style,
      }}
    >
      <div style={{ color: 'var(--color-error)' }}>
        <AlertCircle size={28} strokeWidth={2} />
      </div>
      <p style={{ fontSize: 'var(--text-sm)', color: '#7F1D1D', fontWeight: 500, maxWidth: '440px' }}>
        {message || 'Unable to load data at this time.'}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} style={{ borderColor: '#FCA5A5', color: '#991B1B' }}>
          <RotateCcw size={14} /> Retry
        </Button>
      )}
    </div>
  );
}
