import React from 'react';

export function Skeleton({ width = '100%', height = '16px', borderRadius = 'var(--radius-xs)', style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--color-ink-100)',
        border: '1px solid var(--color-border)',
        backgroundImage: 'linear-gradient(90deg, var(--color-ink-100) 0%, #FFFFFF 50%, var(--color-ink-100) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s infinite linear',
        ...style,
      }}
    />
  );
}
