import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Navigation, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from './common/Button';
import { Badge } from './common/Badge';
import { StatusPill } from './common/StatusPill';
import { ConfidenceMeter } from './ConfidenceMeter';

export function PharmacyCard({
  pharmacy,
  medicineId,
  userLocation,
  onReportClick,
  isPingActive = false,
  pingStatus = null, // 'waiting', 'yes', 'no', 'no_reply'
}) {
  const isOutOfStock = pharmacy.stock_status === 'out_of_stock';
  const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLocation?.lat || 26.9124},${userLocation?.lng || 75.7873};${pharmacy.lat},${pharmacy.lng}`;

  return (
    <article
      className="paper-card"
      style={{
        padding: 'var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
        position: 'relative',
        opacity: isOutOfStock && !pingStatus ? 0.75 : 1,
      }}
    >
      {/* Top Bar: Pharmacy Name, Badges & Distance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-ink-900)' }}>
              {pharmacy.pharmacy_name}
            </h3>
            {pharmacy.is_24x7 ? (
              <Badge variant="pine">24x7 Open</Badge>
            ) : pharmacy.open_now ? (
              <Badge variant="neutral">Open Now</Badge>
            ) : (
              <Badge variant="neutral" style={{ opacity: 0.8 }}>Closed Now</Badge>
            )}
          </div>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} />
            <span>{pharmacy.address || pharmacy.locality}</span>
            <span style={{ margin: '0 4px' }}>•</span>
            <span className="num" style={{ fontWeight: 600, color: 'var(--color-ink-700)' }}>
              {pharmacy.distance_km} km away
            </span>
          </p>
        </div>

        {/* Stock Status & Price */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <StatusPill status={pharmacy.stock_status} type="stock" />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-700)' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-ink-500)' }}>MRP </span>
            <strong className="num" style={{ color: 'var(--color-pine-900)', fontSize: 'var(--text-base)' }}>
              ₹{pharmacy.price ? Number(pharmacy.price).toFixed(2) : '--'}
            </strong>
          </div>
        </div>
      </div>

      {/* Live Auto-Ping In-Flight Badge */}
      {pingStatus && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid',
            backgroundColor: pingStatus === 'yes' ? 'var(--color-pine-100)' : pingStatus === 'no' ? '#FEF2F2' : 'var(--color-saffron-50)',
            borderColor: pingStatus === 'yes' ? 'var(--color-pine-700)' : pingStatus === 'no' ? '#F87171' : 'var(--color-saffron-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
          }}
        >
          <span>
            {pingStatus === 'waiting' && '⏳ Waiting for chemist reply to live ping...'}
            {pingStatus === 'yes' && '✅ Chemist just replied: "Yes, we have it in stock!"'}
            {pingStatus === 'no' && '❌ Chemist replied: "Out of stock right now."'}
            {pingStatus === 'no_reply' && '⏱️ No reply after 90 seconds (Store busy)'}
          </span>
          <span style={{ textTransform: 'uppercase', fontSize: '10px', opacity: 0.8 }}>Auto-Ping</span>
        </div>
      )}

      {/* Stock Confidence Meter */}
      <ConfidenceMeter
        score={pharmacy.confidence_score}
        label={pharmacy.confidence_label}
        minutesAgo={pharmacy.minutes_since_confirmation}
        source={pharmacy.source}
      />

      {/* Bottom Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {medicineId && !isOutOfStock ? (
            <Link to={`/reserve/${pharmacy.pharmacy_id}/${medicineId}`} style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">
                Reserve 60m Hold
              </Button>
            </Link>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              Reserve (Unavailable)
            </Button>
          )}

          <a href={`tel:${pharmacy.phone}`} style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" ariaLabel={`Call ${pharmacy.pharmacy_name}`}>
              <Phone size={13} /> Call Chemist
            </Button>
          </a>

          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm" ariaLabel="Get directions">
              <Navigation size={13} /> Directions
            </Button>
          </a>
        </div>

        <button
          type="button"
          onClick={() => onReportClick(pharmacy)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-ink-500)',
            fontSize: '11px',
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          Report wrong stock
        </button>
      </div>
    </article>
  );
}
