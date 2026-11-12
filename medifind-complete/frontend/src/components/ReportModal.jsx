import React, { useState } from 'react';
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export function ReportModal({ isOpen, onClose, pharmacy, medicineId }) {
  const [reason, setReason] = useState('out_of_stock');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pharmacy || !medicineId) return;

    setIsSubmitting(true);
    try {
      await api.submitReport({
        pharmacy_id: pharmacy.pharmacy_id,
        medicine_id: medicineId,
        reason,
        user_note: note || undefined,
      });
      addToast('Thank you. Stock report logged to protect community accuracy.', 'success');
      onClose();
      setNote('');
    } catch (err) {
      addToast(err.message || 'Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Stock Inaccuracy">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', marginBottom: '4px' }}>
            Chemist: <strong>{pharmacy?.pharmacy_name}</strong>
          </p>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-ink-700)', textTransform: 'uppercase' }}>
            What issue did you encounter?
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              marginTop: '4px',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: '#FFFFFF',
              color: 'var(--color-ink-900)',
            }}
          >
            <option value="out_of_stock">Medicine is Out of Stock</option>
            <option value="price_mismatch">Price in store is different from MRP</option>
            <option value="store_closed">Medical store is currently closed</option>
            <option value="other">Other issue</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-ink-700)', textTransform: 'uppercase' }}>
            Additional details (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Chemist said they ran out 1 hour ago"
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              marginTop: '4px',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: '#FFFFFF',
              color: 'var(--color-ink-900)',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" isLoading={isSubmitting}>
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
