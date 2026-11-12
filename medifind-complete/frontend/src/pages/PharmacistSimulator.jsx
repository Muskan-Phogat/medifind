import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Radio, Check, X, Bell, RefreshCw, Store, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';

export function PharmacistSimulator() {
  const { addToast } = useToast();

  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
  const [pendingPings, setPendingPings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingId, setReplyingId] = useState(null);
  const [recentReplies, setRecentReplies] = useState([]);

  const pollRef = useRef(null);

  // Load pharmacies list for selector
  useEffect(() => {
    async function loadPharmacies() {
      try {
        const list = await api.getPharmacies();
        setPharmacies(list);
      } catch (err) {
        console.error('Failed to load pharmacies', err);
      }
    }
    loadPharmacies();
  }, []);

  // Poll pending pings every 2 seconds
  const fetchPendingPings = async () => {
    try {
      const pings = await api.getPendingPings(selectedPharmacyId ? parseInt(selectedPharmacyId, 10) : null);
      setPendingPings(pings || []);
    } catch (err) {
      console.debug('Error fetching pending pings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPings();
    pollRef.current = setInterval(fetchPendingPings, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedPharmacyId]);

  const handleReply = async (pingId, reply, medicineName) => {
    setReplyingId(pingId);
    try {
      await api.replyToPing(pingId, reply);
      addToast(`Replied '${reply.toUpperCase()}' for ${medicineName}. Search results updated live!`, 'success');
      
      setRecentReplies((prev) => [
        { id: pingId, reply, medicineName, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4),
      ]);

      // Remove from pending immediately
      setPendingPings((prev) => prev.filter((p) => p.ping_id !== pingId));
    } catch (err) {
      addToast(err.message || 'Failed to send reply', 'error');
    } finally {
      setReplyingId(null);
    }
  };

  // Quick simulate button: performs a search on Calpol and triggers Auto-Ping
  const handleQuickDemoPing = async () => {
    try {
      const searchRes = await api.searchPharmacies({
        medicineId: 1, // Calpol 650
        lat: 26.9124,
        lng: 75.7873,
      });
      await api.triggerPing(searchRes.search_id);
      addToast('Incoming customer ping dispatched! Watch phone screen below.', 'info');
      fetchPendingPings();
    } catch (err) {
      addToast(err.message || 'Could not simulate ping', 'error');
    }
  };

  return (
    <div style={{ flex: 1, padding: 'var(--space-6) 0 var(--space-12)', backgroundColor: 'var(--color-paper-warm)' }}>
      <div className="container" style={{ maxWidth: '440px' }}>
        {/* Intro Banner */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-pine-900)', fontWeight: 700, textTransform: 'uppercase' }}>
            <Smartphone size={14} /> Zero-Cost Demo Feature
          </div>
          <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-pine-900)', marginTop: '2px' }}>
            Pharmacist Mobile Simulator
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-700)', marginTop: '2px' }}>
            Mimics the chemist's phone receiving WhatsApp/SMS pings. Open on a phone during demonstrations.
          </p>
        </div>

        {/* Pharmacy Filter Selector */}
        <div
          className="paper-card"
          style={{
            padding: '12px 16px',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-ink-700)', textTransform: 'uppercase' }}>
            Filter Simulator to Pharmacy:
          </label>
          <select
            value={selectedPharmacyId}
            onChange={(e) => setSelectedPharmacyId(e.target.value)}
            style={{
              padding: '8px 10px',
              fontSize: 'var(--text-xs)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: '#FFFFFF',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <option value="">All Registered Pharmacies (Live Demo Mode)</option>
            {pharmacies.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.locality})
              </option>
            ))}
          </select>
        </div>

        {/* Realistic Phone Frame */}
        <div
          style={{
            margin: '0 auto',
            width: '100%',
            maxWidth: '390px',
            backgroundColor: '#18181B',
            borderRadius: '36px',
            padding: '12px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25), 0 0 0 4px #27272A',
            border: '2px solid #3F3F46',
          }}
        >
          {/* Phone Inner Screen */}
          <div
            style={{
              backgroundColor: '#F8F9FA',
              borderRadius: '26px',
              minHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Phone Speaker Notch */}
            <div style={{ height: '24px', backgroundColor: '#18181B', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '4px', backgroundColor: '#3F3F46', borderRadius: '2px' }} />
            </div>

            {/* Simulated WhatsApp / SMS App Bar */}
            <div
              style={{
                backgroundColor: 'var(--color-pine-900)',
                color: '#FFFFFF',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-pine-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>MediFind Chemist Bot</div>
                  <div style={{ fontSize: '10px', color: '#A7F3D0' }}>🟢 Instant Stock Ping</div>
                </div>
              </div>

              <span style={{ fontSize: '10px', opacity: 0.8 }} className="num">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Message Body */}
            <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingPings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--color-ink-500)' }}>
                  <Radio size={28} style={{ opacity: 0.4, marginBottom: '8px' }} className="spin-slow" />
                  <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-900)', marginBottom: '4px' }}>
                    Listening for Incoming Inquiries...
                  </h4>
                  <p style={{ fontSize: '11px', lineHeight: 1.4, marginBottom: '16px' }}>
                    Trigger a search on MediFind or click below to simulate an incoming customer request.
                  </p>
                  <Button variant="secondary" size="sm" onClick={handleQuickDemoPing}>
                    ⚡ Simulate Test Customer Ping
                  </Button>
                </div>
              ) : (
                pendingPings.map((ping) => {
                  const isReplying = replyingId === ping.ping_id;
                  const medDisplay = `${ping.brand_name} ${ping.strength}`;

                  return (
                    <div
                      key={ping.ping_id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid var(--color-pine-800)',
                        borderRadius: '12px',
                        padding: '14px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        animation: 'fadeIn 200ms ease-in',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', backgroundColor: 'var(--color-saffron-100)', color: 'var(--color-saffron-600)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                          ⚡ Urgent Customer Inquiry
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--color-ink-500)' }}>
                          {ping.created_at?.split(' ')[1] || 'Just now'}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--color-ink-500)' }}>
                        Chemist: <strong>{ping.pharmacy_name}</strong>
                      </div>

                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-900)', lineHeight: 1.4 }}>
                        Customer nearby is searching right now:
                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-pine-900)', marginTop: '4px' }}>
                          "Do you have {medDisplay} in stock?"
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-ink-500)' }}>
                          {ping.generic_name} ({ping.form})
                        </div>
                      </div>

                      {/* Large One-Tap Reply Buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          disabled={isReplying}
                          onClick={() => handleReply(ping.ping_id, 'yes', medDisplay)}
                          style={{
                            padding: '10px',
                            backgroundColor: 'var(--color-pine-800)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          <Check size={16} /> YES, IN STOCK
                        </button>

                        <button
                          type="button"
                          disabled={isReplying}
                          onClick={() => handleReply(ping.ping_id, 'no', medDisplay)}
                          style={{
                            padding: '10px',
                            backgroundColor: 'var(--color-error)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          <X size={16} /> NO, FINISHED
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Log of Recent Replies */}
              {recentReplies.length > 0 && (
                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-ink-500)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Recent Replies Sent
                  </div>
                  {recentReplies.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-ink-700)', marginBottom: '3px' }}>
                      <span>{r.medicineName}: <strong>{r.reply === 'yes' ? '✅ In Stock' : '❌ Out'}</strong></span>
                      <span className="num" style={{ color: 'var(--color-ink-500)' }}>{r.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
