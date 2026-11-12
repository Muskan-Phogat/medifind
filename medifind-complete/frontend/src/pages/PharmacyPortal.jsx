import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, LogIn, LogOut, Radio, Clock, Package, TrendingUp, Search, Smartphone, Check, X, CheckCheck } from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { StatusPill } from '../components/common/StatusPill';
import { EmptyState } from '../components/common/EmptyState';
import { Skeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';

export function PharmacyPortal() {
  const { addToast } = useToast();

  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
  const [pin, setPin] = useState('1234');
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem('medifind_pharmacy_jwt') || '');
  const [activePharmacy, setActivePharmacy] = useState(() => {
    try {
      const saved = sessionStorage.getItem('medifind_pharmacy_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'stock', 'insights'
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);

  // Load pharmacies for demo picker
  useEffect(() => {
    async function fetchPharmacies() {
      try {
        const list = await api.getPharmacies();
        setPharmacies(list);
        if (list.length > 0 && !selectedPharmacyId) {
          setSelectedPharmacyId(list[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load pharmacies', err);
      }
    }
    fetchPharmacies();
  }, []);

  // Fetch dashboard if authenticated
  useEffect(() => {
    if (authToken && activePharmacy?.id) {
      loadDashboard();
    }
  }, [authToken, activePharmacy?.id]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPharmacyDashboard(activePharmacy.id, authToken);
      setDashboardData(data);
    } catch (err) {
      if (err.status === 401) {
        handleLogout();
        addToast('Session expired. Please sign in again.', 'error');
      } else {
        addToast(err.message || 'Could not load dashboard', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.loginPharmacy(selectedPharmacyId, pin);
      setAuthToken(res.token);
      setActivePharmacy(res.pharmacy);
      sessionStorage.setItem('medifind_pharmacy_jwt', res.token);
      sessionStorage.setItem('medifind_pharmacy_profile', JSON.stringify(res.pharmacy));
      addToast(`Logged in to ${res.pharmacy.name}`, 'success');
    } catch (err) {
      addToast(err.message || 'Login failed', 'error');
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    setActivePharmacy(null);
    setDashboardData(null);
    sessionStorage.removeItem('medifind_pharmacy_jwt');
    sessionStorage.removeItem('medifind_pharmacy_profile');
  };

  // Reply to ping
  const handlePingReply = async (pingId, reply) => {
    setActionInProgress(`ping_${pingId}`);
    try {
      await api.replyToPing(pingId, reply);
      addToast(`Replied '${reply.toUpperCase()}' to incoming customer ping.`, 'success');
      loadDashboard();
    } catch (err) {
      addToast(err.message || 'Failed to reply to ping', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Reservation Status
  const handleReservationUpdate = async (resId, newStatus) => {
    setActionInProgress(`res_${resId}`);
    try {
      await api.updateReservationStatus(resId, newStatus);
      addToast(`Reservation marked as ${newStatus}.`, 'success');
      loadDashboard();
    } catch (err) {
      addToast(err.message || 'Could not update reservation status', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Stock status toggle
  const handleStockToggle = async (medicineId, newStatus, currentPrice) => {
    setActionInProgress(`stock_${medicineId}`);
    try {
      await api.updatePharmacyInventory(activePharmacy.id, authToken, {
        medicine_id: medicineId,
        status: newStatus,
        price: currentPrice,
      });
      addToast('Inventory updated in real time.', 'success');
      loadDashboard();
    } catch (err) {
      addToast(err.message || 'Could not update inventory', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Inline price update
  const handlePriceUpdate = async (medicineId, newPrice, currentStatus) => {
    const p = parseFloat(newPrice);
    if (isNaN(p) || p <= 0) return;
    try {
      await api.updatePharmacyInventory(activePharmacy.id, authToken, {
        medicine_id: medicineId,
        status: currentStatus,
        price: p,
      });
      addToast('Price updated.', 'success');
      loadDashboard();
    } catch (err) {
      addToast(err.message || 'Could not update price', 'error');
    }
  };

  // If not logged in, render Login View
  if (!authToken || !activePharmacy) {
    return (
      <div style={{ flex: 1, padding: 'var(--space-10) 0' }}>
        <div className="container" style={{ maxWidth: '480px' }}>
          <div className="paper-card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-2)' }}>
              <Store size={22} color="var(--color-pine-800)" />
              <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-pine-900)' }}>
                Chemist Partner Portal
              </h2>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', marginBottom: 'var(--space-5)' }}>
              Sign in with your Store ID and PIN to manage incoming auto-pings, 60-min holds, and stock levels.
            </p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-ink-700)', textTransform: 'uppercase' }}>
                  Select Registered Medical Store
                </label>
                <select
                  value={selectedPharmacyId}
                  onChange={(e) => setSelectedPharmacyId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    marginTop: '4px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  {pharmacies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.locality})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="Store PIN"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="1234"
                  required
                  helperText="Demo PIN: 1234 (configured for all seeded stores)"
                />
              </div>

              <Button variant="primary" size="lg" type="submit" style={{ marginTop: 'var(--space-2)' }}>
                <LogIn size={16} /> Enter Partner Dashboard
              </Button>
            </form>

            <div style={{ marginTop: 'var(--space-6)', padding: '10px', backgroundColor: 'var(--color-paper-warm)', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--color-ink-500)' }}>
              💡 Testing on phone? Open the <Link to="/pharmacist-sim" style={{ color: 'var(--color-pine-800)', fontWeight: 600 }}>Pharmacist Phone Simulator</Link> to reply to live pings without logging into the web portal.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filtered inventory for Stock tab
  const inventoryList = dashboardData?.inventory || [];
  const filteredInventory = inventoryList.filter((item) => {
    const q = stockSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.brand_name.toLowerCase().includes(q) ||
      item.generic_name.toLowerCase().includes(q) ||
      item.strength.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ flex: 1, padding: 'var(--space-6) 0 var(--space-12)' }}>
      <div className="container">
        {/* Portal Header */}
        <div
          className="paper-card"
          style={{
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-5)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={20} color="var(--color-pine-800)" />
              <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-pine-900)' }}>
                {activePharmacy.name}
              </h2>
              {activePharmacy.is_24x7 ? <Badge variant="pine">24x7</Badge> : null}
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', marginTop: '2px' }}>
              {activePharmacy.address || activePharmacy.locality} • Owner: {activePharmacy.owner_name} • Phone: {activePharmacy.phone}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/pharmacist-sim" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm">
                <Smartphone size={13} /> Open Phone Simulator
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={13} /> Sign Out
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '10px 18px',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              border: 'none',
              borderBottom: activeTab === 'requests' ? '2px solid var(--color-pine-800)' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'requests' ? 'var(--color-pine-900)' : 'var(--color-ink-500)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Radio size={15} /> Incoming Requests & Holds
            {dashboardData?.pending_pings?.length > 0 && (
              <span style={{ backgroundColor: 'var(--color-saffron-500)', color: '#FFF', fontSize: '10px', padding: '1px 6px', borderRadius: '10px' }}>
                {dashboardData.pending_pings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            style={{
              padding: '10px 18px',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              border: 'none',
              borderBottom: activeTab === 'stock' ? '2px solid var(--color-pine-800)' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'stock' ? 'var(--color-pine-900)' : 'var(--color-ink-500)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Package size={15} /> Manage Medicine Stock ({inventoryList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            style={{
              padding: '10px 18px',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              border: 'none',
              borderBottom: activeTab === 'insights' ? '2px solid var(--color-pine-800)' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'insights' ? 'var(--color-pine-900)' : 'var(--color-ink-500)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <TrendingUp size={15} /> Unmet Market Demand
          </button>
        </div>

        {/* Tab 1: Requests & Reservations */}
        {activeTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Incoming Auto-Pings Section */}
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-pine-900)', marginBottom: 'var(--space-3)' }}>
                Live Customer Auto-Pings ({dashboardData?.pending_pings?.length || 0})
              </h3>

              {!dashboardData?.pending_pings || dashboardData.pending_pings.length === 0 ? (
                <EmptyState
                  icon={Radio}
                  title="No Pending Pings"
                  description="When a patient searches for a medicine you carry and data is stale, live pings appear here with 1-tap reply buttons."
                />
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {dashboardData.pending_pings.map((ping) => (
                    <div
                      key={ping.id}
                      className="paper-card"
                      style={{
                        padding: 'var(--space-4)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        borderColor: 'var(--color-saffron-500)',
                        backgroundColor: 'var(--color-saffron-50)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-saffron-600)', fontWeight: 700 }}>
                            Live Query
                          </span>
                          <span style={{ color: 'var(--color-ink-500)', fontSize: '11px' }}>• {ping.created_at}</span>
                        </div>
                        <h4 style={{ fontSize: 'var(--text-base)', color: 'var(--color-ink-900)', marginTop: '2px' }}>
                          Do you have <strong>{ping.brand_name} {ping.strength}</strong> in stock right now?
                        </h4>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)' }}>
                          {ping.generic_name} • {ping.form}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePingReply(ping.id, 'yes')}
                          isLoading={actionInProgress === `ping_${ping.id}`}
                        >
                          <Check size={14} /> Yes, in Stock
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handlePingReply(ping.id, 'no')}
                          isLoading={actionInProgress === `ping_${ping.id}`}
                        >
                          <X size={14} /> No, Out of Stock
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Holds & Reservations Section */}
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-pine-900)', marginBottom: 'var(--space-3)' }}>
                Active 60-Minute Holds ({dashboardData?.active_reservations?.length || 0})
              </h3>

              {!dashboardData?.active_reservations || dashboardData.active_reservations.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No Active Reservations"
                  description="When customers reserve a medicine online, their 4-digit pickup token and countdown will appear here."
                />
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {dashboardData.active_reservations.map((res) => (
                    <div
                      key={res.id}
                      className="paper-card"
                      style={{
                        padding: 'var(--space-4)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span
                            className="num"
                            style={{
                              fontFamily: 'var(--font-serif)',
                              fontWeight: 800,
                              fontSize: 'var(--text-lg)',
                              color: 'var(--color-pine-900)',
                              backgroundColor: 'var(--color-paper-warm)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            Token: {res.token}
                          </span>
                          <StatusPill status={res.status} type="reservation" />
                        </div>

                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-900)', fontWeight: 600 }}>
                          {res.brand_name} {res.strength} — {res.quantity} Unit(s)
                        </div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', marginTop: '2px' }}>
                          Customer: {res.customer_name} ({res.customer_phone}) • {res.notes ? `Note: "${res.notes}"` : 'No special note'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {res.status === 'requested' || res.status === 'pending' ? (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleReservationUpdate(res.id, 'accepted')}
                              isLoading={actionInProgress === `res_${res.id}`}
                            >
                              <Check size={13} /> Accept Hold
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleReservationUpdate(res.id, 'rejected')}
                              isLoading={actionInProgress === `res_${res.id}`}
                            >
                              <X size={13} /> Decline
                            </Button>
                          </>
                        ) : res.status === 'accepted' || res.status === 'confirmed' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleReservationUpdate(res.id, 'collected')}
                            isLoading={actionInProgress === `res_${res.id}`}
                          >
                            <CheckCheck size={14} /> Mark Collected at Counter
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Stock Management */}
        {activeTab === 'stock' && (
          <div>
            <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <Input
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  placeholder="Filter medicines by name or salt..."
                  prefix={<Search size={14} />}
                />
              </div>
            </div>

            <div className="paper-card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-paper-warm)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--color-ink-700)' }}>Medicine</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--color-ink-700)' }}>Status</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--color-ink-700)' }}>One-Tap Stock Toggle</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--color-ink-700)' }}>Price (₹)</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--color-ink-700)' }}>Last Confirmed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-ink-900)', fontSize: 'var(--text-sm)' }}>
                          {item.brand_name} {item.strength}
                        </div>
                        <div style={{ color: 'var(--color-ink-500)', fontSize: '11px' }}>
                          {item.generic_name} • {item.form}
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <StatusPill status={item.status} type="stock" />
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleStockToggle(item.medicine_id, 'in_stock', item.price)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '2px',
                              border: '1px solid',
                              cursor: 'pointer',
                              backgroundColor: item.status === 'in_stock' ? 'var(--color-pine-800)' : 'var(--color-paper-warm)',
                              color: item.status === 'in_stock' ? '#FFFFFF' : 'var(--color-ink-700)',
                              borderColor: item.status === 'in_stock' ? 'var(--color-pine-900)' : 'var(--color-border)',
                            }}
                          >
                            In Stock
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStockToggle(item.medicine_id, 'low_stock', item.price)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '2px',
                              border: '1px solid',
                              cursor: 'pointer',
                              backgroundColor: item.status === 'low_stock' ? 'var(--color-saffron-500)' : 'var(--color-paper-warm)',
                              color: item.status === 'low_stock' ? '#FFFFFF' : 'var(--color-ink-700)',
                              borderColor: item.status === 'low_stock' ? 'var(--color-saffron-600)' : 'var(--color-border)',
                            }}
                          >
                            Low
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStockToggle(item.medicine_id, 'out_of_stock', item.price)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '2px',
                              border: '1px solid',
                              cursor: 'pointer',
                              backgroundColor: item.status === 'out_of_stock' ? 'var(--color-ink-700)' : 'var(--color-paper-warm)',
                              color: item.status === 'out_of_stock' ? '#FFFFFF' : 'var(--color-ink-700)',
                              borderColor: item.status === 'out_of_stock' ? 'var(--color-ink-900)' : 'var(--color-border)',
                            }}
                          >
                            Out
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>₹</span>
                          <input
                            type="number"
                            step="0.5"
                            defaultValue={item.price}
                            onBlur={(e) => handlePriceUpdate(item.medicine_id, e.target.value, item.status)}
                            style={{
                              width: '75px',
                              padding: '4px 6px',
                              fontSize: 'var(--text-xs)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-xs)',
                            }}
                            className="num"
                          />
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', color: 'var(--color-ink-500)' }}>
                        <div>{item.confirmed_at}</div>
                        <span style={{ fontSize: '10px', textTransform: 'capitalize' }}>via {item.source}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Insights (Clean Inline SVG Bar Chart) */}
        {activeTab === 'insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="paper-card" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-pine-900)', marginBottom: '4px' }}>
                Lost Sales & Local Unmet Demand
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', marginBottom: 'var(--space-6)' }}>
                Medicines searched repeatedly by patients nearby where stores answered 'No' or stock ran out.
              </p>

              {/* Inline SVG Bar Chart */}
              {dashboardData?.unmet_demand && dashboardData.unmet_demand.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {dashboardData.unmet_demand.slice(0, 8).map((item) => {
                      const maxSearch = Math.max(...dashboardData.unmet_demand.map((d) => d.search_count), 40);
                      const barPercent = Math.min(100, Math.round((item.search_count / maxSearch) * 100));

                      return (
                        <div key={item.medicine_id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                            <strong style={{ color: 'var(--color-ink-900)' }}>{item.medicine_name}</strong>
                            <span style={{ color: 'var(--color-ink-500)' }}>
                              <strong className="num" style={{ color: 'var(--color-pine-800)' }}>{item.search_count}</strong> searches ({item.unfulfilled} lost)
                            </span>
                          </div>

                          <div
                            style={{
                              width: '100%',
                              height: '18px',
                              backgroundColor: 'var(--color-paper-warm)',
                              borderRadius: 'var(--radius-xs)',
                              overflow: 'hidden',
                              border: '1px solid var(--color-border)',
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                width: `${barPercent}%`,
                                height: '100%',
                                backgroundColor: item.local_stock_status === 'not_carried' ? 'var(--color-saffron-500)' : 'var(--color-pine-700)',
                                transition: 'width 600ms ease',
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: '8px',
                                color: '#FFFFFF',
                                fontSize: '10px',
                                fontWeight: 600,
                              }}
                            >
                              {item.local_stock_status === 'not_carried' ? 'Not in your stock' : 'Carried'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-500)' }}>
                  No unmet demand recorded yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
