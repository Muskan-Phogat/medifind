import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  style = {},
  ariaLabel,
  ...rest
}) {
  const baseStyles = {
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: 'background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast)',
    textDecoration: 'none',
    lineHeight: 1.2,
    ...style,
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: 'var(--text-xs)' },
    md: { padding: '9px 16px', fontSize: 'var(--text-sm)' },
    lg: { padding: '12px 22px', fontSize: 'var(--text-base)' },
  }[size] || {};

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-pine-800)',
      color: '#FFFFFF',
      borderColor: 'var(--color-pine-900)',
    },
    secondary: {
      backgroundColor: 'var(--color-paper-warm)',
      color: 'var(--color-ink-900)',
      borderColor: 'var(--color-border)',
    },
    accent: {
      backgroundColor: 'var(--color-saffron-500)',
      color: '#FFFFFF',
      borderColor: 'var(--color-saffron-600)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-pine-800)',
      borderColor: 'var(--color-pine-800)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-ink-700)',
      borderColor: 'transparent',
    },
    danger: {
      backgroundColor: 'var(--color-error)',
      color: '#FFFFFF',
      borderColor: 'var(--color-error)',
    },
  }[variant] || {};

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-label={ariaLabel}
      style={{ ...baseStyles, ...sizeStyles, ...variantStyles }}
      className={`btn ${className}`}
      {...rest}
    >
      {isLoading ? (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 600ms linear infinite',
          }}
        />
      ) : null}
      {children}
    </button>
  );
}
