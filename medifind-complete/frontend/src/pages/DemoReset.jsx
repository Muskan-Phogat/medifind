import React, { useState } from 'react';
import { RotateCcw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useToast } from '../context/ToastContext';

export function DemoReset() {
  const { addToast } = useToast();
  const [adminKey, setAdminKey] = useState('medifind-demo-secret-2025');
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  const handleReset = async (e) => {
    e?.preventDefault();
    setIsResetting(true);
    setResetResult(null);

    try {
      const res = await api.resetDemo(adminKey);
      setResetResult(res);
      addToast(res.message || 'Demo environment restored successfully!', 'success');
      // Clear any session storage or local storage related to previous demo tests
      try {
        sessionStorage.removeItem('medifind_pharmacy_jwt');
        sessionStorage.removeItem('medifind_pharmacy_profile');
      } catch {}
    } catch (err) {
      addToast(err.message || 'Failed to reset demo environment', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: 'var(--space-10) 0' }}>
      <div className="container" style={{ maxWidth: '520px' }}>
        <div className="paper-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-3)' }}>
            <div style={{ color: 'var(--color-saffron-600)' }}>
              <RotateCcw size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-pine-900)' }}>
                Demo Environment Reset
              </h2>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)' }}>
                Hidden judge & evaluator tool
              </span>
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-paper-warm)',
              borderLeft: '3px solid var(--color-saffron-500)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-5)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-ink-700)',
              lineHeight: 1.5,
            }}
          >
            <p style={{ margin: 0 }}>
              Instantly purges test transactions and restores the SQLite database to its seeded state:
              <strong> 14 fictional independent pharmacies</strong>, <strong>74 verified medicines</strong>, and realistic stock confidence levels in under <strong>2 seconds</strong>.
            </p>
          </div>

          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Admin Key"
              type="text"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="medifind-demo-secret-2025"
              required
              helperText="Pre-filled with default DEMO_ADMIN_KEY"
            />

            <Button
              variant="accent"
              size="lg"
              type="submit"
              disabled={isResetting}
              style={{ marginTop: 'var(--space-2)' }}
            >
              <RotateCcw size={16} className={isResetting ? 'spin-fast' : ''} />
              {isResetting ? 'Restoring Database...' : 'Restore Seeded Database Now'}
            </Button>
          </form>

          {resetResult && (
            <div
              style={{
                marginTop: 'var(--space-5)',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--color-pine-50)',
                border: '1px solid var(--color-pine-300)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <CheckCircle2 size={20} color="var(--color-pine-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-pine-900)' }}>
                  Database Clean & Ready
                </strong>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-pine-800)', margin: '4px 0 0 0' }}>
                  {resetResult.message}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
