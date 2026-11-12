import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '../components/common/Button';

export function NotFound() {
  return (
    <div style={{ flex: 1, padding: 'var(--space-12) 0', textAlign: 'center' }}>
      <div className="container" style={{ maxWidth: '480px' }}>
        <div className="paper-card" style={{ padding: 'var(--space-8)' }}>
          <FileQuestion size={36} color="var(--color-ink-500)" style={{ margin: '0 auto var(--space-3)' }} />
          <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-pine-900)', marginBottom: 'var(--space-2)' }}>
            Page Not Found
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-500)', marginBottom: 'var(--space-5)' }}>
            The medicine record or page you requested could not be located.
          </p>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="primary">Return to Medicine Search</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
