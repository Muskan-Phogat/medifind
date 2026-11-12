import React from 'react';

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
  style = {},
}) {
  const variantStyles = {
    pine: {
      backgroundColor: 'var(--color-pine-100)',
      color: 'var(--color-pine-900)',
      borderColor: 'var(--color-pine-700)',
    },
    saffron: {
      backgroundColor: 'var(--color-saffron-100)',
      color: 'var(--color-saffron-600)',
      borderColor: 'var(--color-saffron-500)',
    },
    neutral: {
      backgroundColor: 'var(--color-ink-100)',
      color: 'var(--color-ink-700)',
      borderColor: 'var(--color-border)',
    },
    rx: {
      backgroundColor: '#FEF2F2',
      color: '#991B1B',
      borderColor: '#F87171',
    },
  }[variant] || {};

  const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: '11px', fontWeight: 600 },
    md: { padding: '4px 10px', fontSize: '12px', fontWeight: 600 },
  }[size] || {};

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        border: '1px solid',
        borderRadius: 'var(--radius-xs)',
        fontFamily: 'var(--font-sans)',
        lineHeight: 1.2,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        ...variantStyles,
        ...sizeStyles,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
