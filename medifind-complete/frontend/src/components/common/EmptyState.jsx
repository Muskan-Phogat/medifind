import React from 'react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  style = {},
}) {
  return (
    <div
      className="paper-card"
      style={{
        padding: 'var(--space-8) var(--space-6)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
        ...style,
      }}
    >
      {Icon && (
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-paper-warm)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-ink-700)',
          }}
        >
          <Icon size={24} strokeWidth={1.75} />
        </div>
      )}
      <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-ink-900)' }}>{title}</h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-500)', maxWidth: '420px', lineHeight: 1.45 }}>
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="secondary" size="md" onClick={onAction} style={{ marginTop: 'var(--space-2)' }}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
