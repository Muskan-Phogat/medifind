import React, { useState } from 'react';
import { Link, useLocation as useRouteLocation } from 'react-router-dom';
import { MapPin, Smartphone, Store, HelpCircle, ChevronDown, Check } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { Button } from './common/Button';

export function Header() {
  const { location, localities, setManualLocation, requestBrowserLocation, geoState } = useLocation();
  const [isLocOpen, setIsLocOpen] = useState(false);
  const routeLocation = useRouteLocation();

  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-subtle)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', gap: '16px' }}>
        {/* Brand Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--color-pine-900)',
                letterSpacing: '-0.02em',
              }}
            >
              MediFind
            </span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-saffron-500)',
                display: 'inline-block',
              }}
            />
          </Link>

          {/* Location Picker Pill */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsLocOpen(!isLocOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                backgroundColor: 'var(--color-paper-warm)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-ink-700)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <MapPin size={13} color="var(--color-pine-800)" />
              <span style={{ fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {location.name}
              </span>
              <ChevronDown size={12} />
            </button>

            {/* Dropdown Menu */}
            {isLocOpen && (
              <div
                className="paper-card"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '6px',
                  width: '240px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-float)',
                  zIndex: 200,
                  maxHeight: '320px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-paper-warm)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      requestBrowserLocation();
                      setIsLocOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: 'var(--color-pine-800)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                    }}
                  >
                    {geoState === 'requesting' ? 'Locating...' : 'Use Device GPS'}
                  </button>
                </div>

                <div style={{ padding: '4px 0' }}>
                  <div style={{ padding: '4px 12px', fontSize: '10px', fontWeight: 700, color: 'var(--color-ink-500)', textTransform: 'uppercase' }}>
                    Seeded Localities
                  </div>
                  {localities.map((loc) => {
                    const isSelected = location.name === loc.name;
                    return (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => {
                          setManualLocation(loc);
                          setIsLocOpen(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '6px 12px',
                          border: 'none',
                          backgroundColor: isSelected ? 'var(--color-pine-50)' : 'transparent',
                          color: isSelected ? 'var(--color-pine-900)' : 'var(--color-ink-700)',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{loc.name}</span>
                        {isSelected && <Check size={13} color="var(--color-pine-800)" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to="/how-it-works" style={{ textDecoration: 'none' }}>
            <Button variant={routeLocation.pathname === '/how-it-works' ? 'secondary' : 'ghost'} size="sm">
              <HelpCircle size={14} /> How it Works
            </Button>
          </Link>

          <Link to="/pharmacist-sim" style={{ textDecoration: 'none' }}>
            <Button variant={routeLocation.pathname === '/pharmacist-sim' ? 'accent' : 'secondary'} size="sm">
              <Smartphone size={14} /> Pharmacist Sim
            </Button>
          </Link>

          <Link to="/pharmacy" style={{ textDecoration: 'none' }}>
            <Button variant={routeLocation.pathname.startsWith('/pharmacy') ? 'primary' : 'outline'} size="sm">
              <Store size={14} /> Chemist Portal
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
