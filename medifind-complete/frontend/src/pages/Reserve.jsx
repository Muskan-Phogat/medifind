import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck, ShieldAlert, Store, Pill } from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';

export function Reserve() {
  const { pharmacyId, medicineId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [pharmacy, setPharmacy] = useState(null);
  const [medicine, setMedicine] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Fetch pharmacies list to find this pharmacy
        const pharms = await api.getPharmacies();
        const foundPharm = pharms.find((p) => p.id === parseInt(pharmacyId, 10));
        setPharmacy(foundPharm);

        // Fetch medicine via search endpoint
        const searchData = await api.searchPharmacies({
          medicineId: parseInt(medicineId, 10),
          lat: foundPharm ? foundPharm.lat : 26.9124,
          lng: foundPharm ? foundPharm.lng : 75.7873,
          radiusKm: 25.0,
        });
        setMedicine(searchData.medicine);
      } catch (err) {
        addToast(err.message || 'Error loading store information', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [pharmacyId, medicineId]);

  const validate = () => {
    const errs = {};
    if (!customerName.trim() || customerName.trim().length < 2) {
      errs.customerName = 'Please enter your full name (minimum 2 characters)';
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.customerPhone = 'Please enter a valid 10-digit mobile number';
    }
    if (quantity < 1 || quantity > 10) {
      errs.quantity = 'Quantity must be between 1 and 10';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await api.createReservation({
        pharmacy_id: parseInt(pharmacyId, 10),
        medicine_id: parseInt(medicineId, 10),
        quantity: parseInt(quantity, 10),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        notes: notes.trim() || undefined,
      });

      addToast('Reservation hold created! Showing your 4-digit pickup code.', 'success');
      navigate(`/reservation/${res.id}`);
    } catch (err) {
      addToast(err.message || 'Could not place reservation hold', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ maxWidth: '640px', padding: 'var(--space-8) 0' }}>
        <Skeleton height="32px" width="200px" style={{ marginBottom: '16px' }} />
        <Skeleton height="140px" width="100%" style={{ marginBottom: '16px' }} />
        <Skeleton height="300px" width="100%" />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: 'var(--space-6) 0 var(--space-12)' }}>
      <div className="container" style={{ maxWidth: '640px' }}>
        <Link
          to={-1}
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
          <ArrowLeft size={16} /> Back to Results
        </Link>

        <div className="paper-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-2)' }}>
            <span style={{ color: 'var(--color-pine-800)' }}>
              <Clock size={20} />
            </span>
            <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-pine-900)' }}>
              Request 60-Minute Stock Hold
            </h2>
          </div>

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-700)', marginBottom: 'var(--space-5)', lineHeight: 1.45 }}>
            The chemist will set aside your medicine for 60 minutes. Pay in person when you pick it up.
          </p>

          {/* Store & Medicine Confirmation Pill */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-paper-warm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: 'var(--text-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Store size={14} color="var(--color-pine-800)" />
              <strong style={{ color: 'var(--color-ink-900)' }}>{pharmacy?.name}</strong>
              <span style={{ color: 'var(--color-ink-500)' }}>• {pharmacy?.locality}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Pill size={14} color="var(--color-pine-800)" />
              <strong style={{ color: 'var(--color-ink-900)' }}>{medicine?.brand_name} {medicine?.strength}</strong>
              <span style={{ color: 'var(--color-ink-500)' }}>• MRP ₹{medicine?.mrp}</span>
            </div>
          </div>

          {/* Prescription Notice */}
          {medicine?.requires_prescription && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                color: '#991B1B',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: 'var(--space-5)',
              }}
            >
              <ShieldAlert size={16} />
              <span>
                <strong>Prescription Notice: </strong>
                The pharmacist will verify your physical or digital doctor's prescription in person before dispensing.
              </span>
            </div>
          )}

          {/* Reservation Request Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Patient / Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
              error={errors.customerName}
            />

            <Input
              label="Mobile Number (for pickup SMS/token)"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 98290 12345"
              required
              prefix="+91"
              error={errors.customerPhone}
            />

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-ink-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quantity (Packs / Strips) *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{
                    width: '90px',
                    padding: '9px 12px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${errors.quantity ? 'var(--color-error)' : 'var(--color-border)'}`,
                    textAlign: 'center',
                  }}
                  className="num"
                />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)' }}>
                  {medicine?.pack_size || 'Packs'}
                </span>
              </div>
              {errors.quantity && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>{errors.quantity}</span>}
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-ink-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Note for Pharmacist (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Arriving around 5 PM, elderly patient"
                rows={2}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  marginTop: '4px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>

            <Button variant="primary" size="lg" type="submit" isLoading={isSubmitting} style={{ marginTop: 'var(--space-2)' }}>
              Confirm 60-Minute Hold Request
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
