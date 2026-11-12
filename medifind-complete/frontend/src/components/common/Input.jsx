import React from 'react';

export function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  prefix,
  suffix,
  className = '',
  style = {},
  ...rest
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...style }} className={className}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--color-ink-700)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {label} {required && <span style={{ color: 'var(--color-saffron-600)' }}>*</span>}
        </label>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          transition: 'border-color var(--transition-fast)',
        }}
      >
        {prefix && (
          <div style={{ padding: '0 10px', color: 'var(--color-ink-500)', fontSize: 'var(--text-sm)', borderRight: '1px solid var(--color-border)' }}>
            {prefix}
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-ink-900)',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            width: '100%',
          }}
          {...rest}
        />

        {suffix && (
          <div style={{ padding: '0 10px', color: 'var(--color-ink-500)', fontSize: 'var(--text-sm)' }}>
            {suffix}
          </div>
        )}
      </div>

      {error ? (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', marginTop: '2px' }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', marginTop: '2px' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
