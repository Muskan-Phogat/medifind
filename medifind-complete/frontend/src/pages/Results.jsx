import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { List, Map as MapIcon, AlertTriangle, ArrowLeft, Bell, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import { PharmacyCard } from '../components/PharmacyCard';
import { AutoPingBanner } from '../components/AutoPingBanner';
import { MapView } from '../components/MapView';
import { ReportModal } from '../components/ReportModal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';

export function Results() {
  const [searchParams, setSearchParams] = useSearchParams();
  const medicineId = searchParams.get('medicine_id');
  const emergencyParam = searchParams.get('emergency') === 'true';

  const { location } = useLocation();
  const { addToast } = useToast();

  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchData, setSearchData] = useState(null);
  const [notified, setNotified] = useState(false);

  // Auto-Ping State
  const [isPinging, setIsPinging] = useState(false);
  const [pingBatch, setPingBatch] = useState(null);
  const [pingStatuses, setPingStatuses] = useState({}); // { pharmacy_id: 'waiting'|'yes'|'no'|'no_reply' }
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [isPingComplete, setIsPingComplete] = useState(false);

  // Report Modal State
  const [reportingPharmacy, setReportingPharmacy] = useState(null);

  const pollIntervalRef = useRef(null);
  const timerRef = useRef(null);

  const loadSearchResults = async () => {
    if (!medicineId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.searchPharmacies({
        medicineId: parseInt(medicineId, 10),
        lat: location.lat,
        lng: location.lng,
        radiusKm: 12.0,
        emergency: emergencyParam,
      });
      setSearchData(data);
    } catch (err) {
      setError(err.message || 'Unable to fetch search results.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSearchResults();
    // Check if notify me already stored
    try {
      const savedNotify = localStorage.getItem(`medifind_notify_${medicineId}`);
      if (savedNotify) setNotified(true);
    } catch {}

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [medicineId, location.lat, location.lng, emergencyParam]);

  // Trigger Auto-Ping
  const handleTriggerPing = async () => {
    if (!searchData?.search_id) return;

    setIsPinging(true);
    setIsPingComplete(false);
    setTimeRemaining(90);

    try {
      const batchRes = await api.triggerPing(searchData.search_id);
      setPingBatch(batchRes);

      // Initialize statuses
      const initialMap = {};
      batchRes.pings.forEach((p) => {
        initialMap[p.pharmacy_id] = 'waiting';
      });
      setPingStatuses(initialMap);
      addToast('Auto-Ping sent to 3 nearest pharmacies. Waiting for replies...', 'info');

      // Countdown Timer
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            clearInterval(pollIntervalRef.current);
            setIsPingComplete(true);
            refreshDataQuietly();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Poll batch status every 2 seconds
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollData = await api.getBatchStatus(batchRes.batch_id);
          const updatedStatuses = {};
          let allAnswered = true;
          let anyReplied = false;

          pollData.statuses.forEach((s) => {
            updatedStatuses[s.pharmacy_id] = s.status;
            if (s.status === 'waiting') {
              allAnswered = false;
            } else {
              anyReplied = true;
            }
          });

          setPingStatuses(updatedStatuses);

          if (allAnswered) {
            clearInterval(pollIntervalRef.current);
            clearInterval(timerRef.current);
            setIsPingComplete(true);
            addToast('All pharmacies have replied to the live ping.', 'success');
            refreshDataQuietly();
          } else if (anyReplied) {
            refreshDataQuietly();
          }
        } catch (err) {
          console.debug('Polling error:', err);
        }
      }, 2000);
    } catch (err) {
      addToast(err.message || 'Could not send Auto-Ping', 'error');
      setIsPinging(false);
    }
  };

  const refreshDataQuietly = async () => {
    try {
      const data = await api.searchPharmacies({
        medicineId: parseInt(medicineId, 10),
        lat: location.lat,
        lng: location.lng,
        radiusKm: 12.0,
        emergency: emergencyParam,
      });
      setSearchData(data);
    } catch {}
  };

  const handleNotifyMe = () => {
    try {
      localStorage.setItem(`medifind_notify_${medicineId}`, 'true');
      setNotified(true);
      addToast('You will be alerted when a nearby chemist reports fresh stock.', 'success');
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: 'var(--space-8) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Skeleton height="32px" width="240px" />
          <Skeleton height="80px" width="100%" />
          <Skeleton height="140px" width="100%" />
          <Skeleton height="140px" width="100%" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: 'var(--space-8) 0' }}>
        <ErrorState message={error} onRetry={loadSearchResults} />
      </div>
    );
  }

  const medicine = searchData?.medicine;
  const results = searchData?.results || [];
  const inStockCount = results.filter((r) => r.stock_status !== 'out_of_stock').length;
  const isAllOutOfStock = inStockCount === 0;

  // Stale check for Auto-Ping trigger
  const hasStaleTopResults = results.slice(0, 3).some((r) => r.is_stale || r.confidence_score < 75);

  return (
    <div style={{ flex: 1, padding: 'var(--space-6) 0 var(--space-12)' }}>
      <div className="container">
        {/* Navigation & Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '12px' }}>
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
            }}
          >
            <ArrowLeft size={16} /> Back to Search
          </Link>

          {/* List vs Map Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--color-paper-warm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'list' ? 'var(--color-pine-900)' : 'var(--color-ink-500)',
                boxShadow: viewMode === 'list' ? 'var(--shadow-subtle)' : 'none',
              }}
            >
              <List size={14} /> List View
            </button>

            <button
              type="button"
              onClick={() => setViewMode('map')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: viewMode === 'map' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'map' ? 'var(--color-pine-900)' : 'var(--color-ink-500)',
                boxShadow: viewMode === 'map' ? 'var(--shadow-subtle)' : 'none',
              }}
            >
              <MapIcon size={14} /> Map View
            </button>
          </div>
        </div>

        {/* Medicine Summary Card */}
        {medicine && (
          <div
            className="paper-card"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              marginBottom: 'var(--space-4)',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-pine-900)' }}>
                  {medicine.brand_name}
                </h2>
                <span style={{ fontSize: 'var(--text-xs)', backgroundColor: 'var(--color-paper-warm)', padding: '2px 8px', borderRadius: 'var(--radius-xs)', fontWeight: 600 }}>
                  {medicine.strength}
                </span>
                {medicine.requires_prescription && (
                  <Badge variant="rx">Prescription Required</Badge>
                )}
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', marginTop: '2px' }}>
                {medicine.generic_name} • {medicine.form} • {medicine.manufacturer} • {medicine.pack_size}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-ink-500)', textTransform: 'uppercase' }}>Standard MRP</div>
              <strong className="num" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-ink-900)' }}>
                ₹{Number(medicine.mrp).toFixed(2)}
              </strong>
            </div>
          </div>
        )}

        {/* Mandatory Prescription Notice */}
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
              marginBottom: 'var(--space-4)',
            }}
          >
            <ShieldAlert size={16} />
            <span>
              <strong>Prescription Notice: </strong>
              The pharmacist will verify your physical or digital doctor's prescription in person before dispensing.
            </span>
          </div>
        )}

        {/* Auto-Ping Banner when data is stale or Auto-Ping in progress */}
        {(hasStaleTopResults || isPinging || pingBatch) && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <AutoPingBanner
              onTriggerPing={handleTriggerPing}
              isPinging={isPinging}
              pingBatch={pingBatch}
              pingStatuses={pingStatuses}
              timeRemaining={timeRemaining}
              isComplete={isPingComplete}
            />
          </div>
        )}

        {/* Main Content: No-Stock State OR Pharmacy Results List/Map */}
        {isAllOutOfStock ? (
          <div
            className="paper-card"
            style={{
              padding: 'var(--space-8) var(--space-6)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ color: 'var(--color-saffron-500)' }}>
              <AlertTriangle size={36} />
            </div>
            <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-ink-900)' }}>
              No nearby chemists currently have {medicine?.brand_name} in stock
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-500)', maxWidth: '480px', lineHeight: 1.5 }}>
              We checked verified stock across all registered chemists within 12 km. This search has been logged anonymously to alert local suppliers of unmet demand.
            </p>

            <div style={{ marginTop: 'var(--space-3)' }}>
              {notified ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-pine-800)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> Alert enabled — we'll notify you when stock arrives
                </div>
              ) : (
                <Button variant="accent" size="md" onClick={handleNotifyMe}>
                  <Bell size={16} /> Notify me when verified in stock
                </Button>
              )}
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <MapView pharmacies={results} userLocation={location} medicineId={medicineId} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', padding: '0 4px' }}>
              <span>Showing {results.length} pharmacies near {location.name}</span>
              <span>Ranked by Availability • Confidence • Distance</span>
            </div>

            {results.map((pharmacy) => (
              <PharmacyCard
                key={pharmacy.pharmacy_id}
                pharmacy={pharmacy}
                medicineId={medicineId}
                userLocation={location}
                onReportClick={setReportingPharmacy}
                isPingActive={isPinging}
                pingStatus={pingStatuses[pharmacy.pharmacy_id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Report Wrong Stock Modal */}
      <ReportModal
        isOpen={Boolean(reportingPharmacy)}
        onClose={() => setReportingPharmacy(null)}
        pharmacy={reportingPharmacy}
        medicineId={medicineId}
      />
    </div>
  );
}
