import React from 'react';

export function StatusPill({ status, type = 'stock' }) {
  const norm = (status || '').toLowerCase().trim();

  // Stock status mappings
  if (type === 'stock') {
    if (norm === 'in_stock') {
      return (
        <span style={pillStyle('var(--color-pine-100)', 'var(--color-pine-900)', 'var(--color-pine-700)')}>
          <span style={dotStyle('var(--color-pine-800)')} />
          In Stock
        </span>
      );
    }
    if (norm === 'low_stock') {
      return (
        <span style={pillStyle('var(--color-saffron-100)', 'var(--color-saffron-600)', 'var(--color-saffron-500)')}>
          <span style={dotStyle('var(--color-saffron-500)')} />
          Low Stock
        </span>
      );
    }
    return (
      <span style={pillStyle('var(--color-ink-100)', 'var(--color-ink-500)', 'var(--color-border)')}>
        <span style={dotStyle('var(--color-ink-500)')} />
        Out of Stock
      </span>
    );
  }

  // Reservation status mappings
  const resMap = {
    requested: { label: 'Hold Requested', bg: 'var(--color-saffron-100)', text: 'var(--color-saffron-600)', border: 'var(--color-saffron-500)' },
    pending: { label: 'Hold Requested', bg: 'var(--color-saffron-100)', text: 'var(--color-saffron-600)', border: 'var(--color-saffron-500)' },
    accepted: { label: 'Confirmed by Chemist', bg: 'var(--color-pine-100)', text: 'var(--color-pine-900)', border: 'var(--color-pine-700)' },
    confirmed: { label: 'Confirmed by Chemist', bg: 'var(--color-pine-100)', text: 'var(--color-pine-900)', border: 'var(--color-pine-700)' },
    collected: { label: 'Collected in Store', bg: 'var(--color-ink-100)', text: 'var(--color-ink-700)', border: 'var(--color-border)' },
    dispensed: { label: 'Collected in Store', bg: 'var(--color-ink-100)', text: 'var(--color-ink-700)', border: 'var(--color-border)' },
    rejected: { label: 'Declined by Chemist', bg: '#FEF2F2', text: '#991B1B', border: '#F87171' },
    expired: { label: 'Hold Expired', bg: 'var(--color-ink-100)', text: 'var(--color-ink-500)', border: 'var(--color-border)' },
    cancelled: { label: 'Cancelled', bg: 'var(--color-ink-100)', text: 'var(--color-ink-500)', border: 'var(--color-border)' },
  };

  const conf = resMap[norm] || { label: norm, bg: 'var(--color-ink-100)', text: 'var(--color-ink-700)', border: 'var(--color-border)' };

  return (
    <span style={pillStyle(conf.bg, conf.text, conf.border)}>
      <span style={dotStyle(conf.text)} />
      {conf.label}
    </span>
  );
}

function pillStyle(bg, color, border) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 9px',
    backgroundColor: bg,
    color: color,
    border: `1px solid ${border}`,
    borderRadius: 'var(--radius-xs)',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '0.01em',
  };
}

function dotStyle(color) {
  return {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: color,
    display: 'inline-block',
  };
}
