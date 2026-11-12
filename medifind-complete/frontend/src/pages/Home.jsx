import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Zap, ShieldCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export function Home() {
  const navigate = useNavigate();
  const { location, requestBrowserLocation, geoState } = useLocation();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);

  // Quick search chips from real seeded medicines
  const quickChips = [
    { name: 'Calpol 650', id: 1, salt: 'Paracetamol' },
    { name: 'Pan 40', id: 11, salt: 'Pantoprazole' },
    { name: 'Electral ORS', id: 20, salt: 'Oral Rehydration' },
  ];

  // Debounced Autocomplete
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const results = await api.suggestMedicines(query.trim());
        setSuggestions(results || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Suggest error:', err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 220);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMedicine = (med) => {
    setIsOpen(false);
    navigate(`/results?medicine_id=${med.id}&q=${encodeURIComponent(med.brand_name)}&emergency=${emergency}`);
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectMedicine(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handleSelectMedicine(suggestions[0]);
      } else if (query.trim().length >= 2) {
        setIsLoadingSuggestions(true);
        try {
          const res = await api.suggestMedicines(query.trim());
          if (res && res.length > 0) {
            handleSelectMedicine(res[0]);
          }
        } catch {
        } finally {
          setIsLoadingSuggestions(false);
        }
      }
      return;
    }

    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: 'var(--space-10) 0' }}>
      <div className="container" style={{ maxWidth: '780px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              backgroundColor: 'var(--color-pine-100)',
              color: 'var(--color-pine-900)',
              border: '1px solid var(--color-pine-700)',
              borderRadius: 'var(--radius-xs)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-4)',
            }}
          >
            <ShieldCheck size={14} /> Real-Time Stock Verification
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              color: 'var(--color-pine-900)',
              marginBottom: 'var(--space-3)',
              lineHeight: 1.15,
            }}
          >
            We don't list medicines,<br />we verify them.
          </h1>

          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--color-ink-700)',
              maxWidth: '560px',
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            Search genuine independent chemists near <strong style={{ color: 'var(--color-pine-800)' }}>{location.name}</strong> with live Stock Confidence Scores and 60-minute holds.
          </p>
        </div>

        {/* Search Card Container */}
        <div
          className="paper-card"
          ref={wrapperRef}
          style={{
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-float)',
            position: 'relative',
            zIndex: 50,
          }}
        >
          {/* Input Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#FFFFFF',
              border: '2px solid var(--color-pine-800)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 14px',
              boxShadow: '0 0 0 3px rgba(27, 67, 50, 0.08)',
            }}
          >
            <Search size={22} color="var(--color-pine-800)" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
              }}
              placeholder="Search by brand or composition (e.g., Calpol 650, Paracetamol, Pantoprazole)..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: 'var(--text-base)',
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-ink-900)',
                padding: '8px 0',
              }}
              aria-label="Search medicine brand or generic composition"
              role="combobox"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              autoComplete="off"
            />
            {isLoadingSuggestions && (
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid var(--color-pine-800)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 600ms linear infinite',
                }}
              />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <div
              className="paper-card"
              role="listbox"
              aria-label="Medicine search suggestions"
              style={{
                position: 'absolute',
                top: 'calc(100% - 10px)',
                left: 'var(--space-5)',
                right: 'var(--space-5)',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-float)',
                maxHeight: '340px',
                overflowY: 'auto',
                zIndex: 100,
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--color-ink-500)', textTransform: 'uppercase', fontWeight: 700, backgroundColor: 'var(--color-paper-warm)' }}>
                Matching Verified Medicines ({suggestions.length})
              </div>

              {suggestions.map((med, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={med.id}
                    onClick={() => handleSelectMedicine(med)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--color-pine-50)' : 'transparent',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: 'var(--color-pine-900)', fontSize: 'var(--text-sm)' }}>
                          {med.brand_name}
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--color-ink-700)', backgroundColor: 'var(--color-paper-warm)', padding: '1px 6px', borderRadius: '2px' }}>
                          {med.strength}
                        </span>
                        {med.requires_prescription && (
                          <Badge variant="rx">Rx</Badge>
                        )}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', marginTop: '2px' }}>
                        {med.generic_name} • {med.form} • {med.manufacturer}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="num" style={{ fontWeight: 700, color: 'var(--color-ink-900)', fontSize: 'var(--text-sm)' }}>
                        ₹{Number(med.mrp).toFixed(2)}
                      </span>
                      <div style={{ fontSize: '10px', color: 'var(--color-ink-500)' }}>
                        {med.pack_size}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Controls below input: Emergency Toggle & Chips */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'var(--space-4)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Quick Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)' }}>Popular:</span>
              {quickChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => navigate(`/results?medicine_id=${chip.id}&q=${encodeURIComponent(chip.name)}&emergency=${emergency}`)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 'var(--text-xs)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-paper-warm)',
                    color: 'var(--color-ink-900)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {chip.name}
                </button>
              ))}
            </div>

            {/* Emergency Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: emergency ? 'var(--color-saffron-600)' : 'var(--color-ink-700)',
              }}
            >
              <input
                type="checkbox"
                checked={emergency}
                onChange={(e) => setEmergency(e.target.checked)}
                style={{ accentColor: 'var(--color-saffron-500)', width: '16px', height: '16px' }}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={14} color={emergency ? 'var(--color-saffron-500)' : 'currentColor'} />
                Emergency (Open Stores Only)
              </span>
            </label>
          </div>
        </div>

        {/* Value Proposition Microcopy Trio */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-4)',
            marginTop: 'var(--space-8)',
          }}
        >
          <div className="paper-card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ color: 'var(--color-pine-800)', marginBottom: '6px' }}>
              <Clock size={20} />
            </div>
            <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-900)', marginBottom: '4px' }}>
              240-Min Freshness Decay
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', lineHeight: 1.45 }}>
              Confidence degrades smoothly if stock wasn't confirmed recently. No outdated catalogs.
            </p>
          </div>

          <div className="paper-card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ color: 'var(--color-saffron-600)', marginBottom: '6px' }}>
              <Zap size={20} />
            </div>
            <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-900)', marginBottom: '4px' }}>
              Live Auto-Ping
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', lineHeight: 1.45 }}>
              When data is stale, MediFind instantly pings the top 3 chemists: "Do you have it right now?"
            </p>
          </div>

          <div className="paper-card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ color: 'var(--color-pine-800)', marginBottom: '6px' }}>
              <ShieldCheck size={20} />
            </div>
            <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-900)', marginBottom: '4px' }}>
              60-Minute Holds
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', lineHeight: 1.45 }}>
              Request a temporary hold so medicine is waiting for you when you reach the chemist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
