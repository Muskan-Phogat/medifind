import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Phone, MapPin, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { StatusPill } from '../components/common/StatusPill';
import { Skeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';

export function ReservationStatus() {
  const { id } = useParams();
  const { addToast } = useToast();

  const [reservation, setReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const fetchReservation = async () => {
    try {
      const data = await api.getReservation(id);
      setReservation(data);

      // Compute remaining seconds
      if (data.expires_at) {
        const exp = new Date(data.expires_at.replace(' ', 'T') + 'Z').getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((exp - now) / 1000));
        setSecondsLeft(remaining);
      }
    } catch (err) {
      addToast(err.message || 'Error fetching reservation status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservation();

    // Poll every 4 seconds for pharmacist response
    pollRef.current = setInterval(fetchReservation, 4000);

    // 1-second countdown clock
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCancel = async () => {
    try {
      await api.updateReservationStatus(id, 'cancelled');
      addToast('Reservation hold cancelled.', 'info');
      fetchReservation();
    } catch (err) {
      addToast(err.message || 'Could not cancel reservation', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ maxWidth: '580px', padding: 'var(--space-8) 0' }}>
        <Skeleton height="36px" width="180px" style={{ marginBottom: '16px' }} />
        <Skeleton height="280px" width="100%" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="container" style={{ maxWidth: '580px', padding: 'var(--space-8) 0' }}>
        <p>Reservation not found.</p>
      </div>
    );
  }

  const isExpired = secondsLeft === 0 || reservation.status === 'expired';
  const isAccepted = reservation.status === 'accepted' || reservation.status === 'confirmed';
  const isCollected = reservation.status === 'collected' || reservation.status === 'dispensed';
  const isRejected = reservation.status === 'rejected';

  return (
    <div style={{ flex: 1, padding: 'var(--space-6) 0 var(--space-12)' }}>
      <div className="container" style={{ maxWidth: '580px' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-ink-700)',
            textDecoration: 'none',
            fontWeight: 500,
            marginBottom: 'var(--space-4)',
          }}
        >
          <ArrowLeft size={16} /> Home
        </Link>

        <div className="paper-card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          {/* Status Header */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
            <StatusPill status={reservation.status} type="reservation" />
          </div>

          <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-pine-900)', marginBottom: 'var(--space-2)' }}>
            {isAccepted
              ? 'Chemist Confirmed Your Hold!'
              : isCollected
              ? 'Medicine Collected at Store'
              : isRejected
              ? 'Hold Request Declined by Chemist'
              : isExpired
              ? 'Hold Window Has Expired'
              : 'Hold Request Dispatched to Chemist'}
          </h2>

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-700)', maxWidth: '420px', margin: '0 auto var(--space-6)', lineHeight: 1.45 }}>
            {isAccepted
              ? 'Your medicine is packed and waiting at the counter. Show your 4-digit token upon arrival.'
              : 'Keep this page open. Show the 4-digit token below to the pharmacist at the counter.'}
          </p>

          {/* Large 4-Digit Pickup Token Box */}
          <div
            style={{
              padding: 'var(--space-6)',
              backgroundColor: 'var(--color-paper-warm)',
              border: '2px dashed var(--color-pine-800)',
              borderRadius: 'var(--radius-md)',
              margin: '0 auto var(--space-6)',
              maxWidth: '360px',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ink-500)', fontWeight: 700, marginBottom: '6px' }}>
              Pickup Verification Token
            </div>

            <div
              className="num"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '3.5rem',
                fontWeight: 800,
                letterSpacing: '0.25em',
                color: 'var(--color-pine-900)',
                textIndent: '0.25em',
              }}
            >
              {reservation.token}
            </div>

            {/* Countdown Clock */}
            {!isCollected && !isRejected && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '12px',
                  padding: '4px 12px',
                  backgroundColor: isExpired ? '#FEF2F2' : '#FFFFFF',
                  border: `1px solid ${isExpired ? '#FCA5A5' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-xs)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: isExpired ? 'var(--color-error)' : 'var(--color-ink-700)',
                }}
              >
                <Clock size={13} />
                <span>
                  {isExpired ? 'Hold Window Ended' : `Hold expires in ${formatCountdown(secondsLeft)}`}
                </span>
              </div>
            )}
          </div>

          {/* Reservation Summary Details */}
          <div
            style={{
              padding: 'var(--space-4)',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-ink-500)' }}>Medicine:</span>
              <strong style={{ color: 'var(--color-ink-900)' }}>{reservation.medicine_name}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-ink-500)' }}>Quantity:</span>
              <strong className="num">{reservation.quantity} Unit(s)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-ink-500)' }}>Chemist:</span>
              <strong style={{ color: 'var(--color-pine-800)' }}>{reservation.pharmacy_name}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-ink-500)' }}>Reserved For:</span>
              <span>{reservation.customer_name} ({reservation.customer_phone})</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="md">
                Search Another Medicine
              </Button>
            </Link>

            {reservation.status === 'requested' && (
              <Button variant="ghost" size="md" onClick={handleCancel}>
                Cancel Hold
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
