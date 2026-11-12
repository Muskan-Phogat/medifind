import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Custom lightweight SVG Pin without Leaflet image asset dependencies
function createCustomPin(color = '#1B4332', text = '') {
  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid #FFFFFF;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: #FFFFFF;
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 700;
        ">${text}</span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

const userPin = L.divIcon({
  className: 'user-pin',
  html: `
    <div style="
      background-color: #D97706;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 3px solid #FFFFFF;
      box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.4);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export function MapView({ pharmacies = [], userLocation, medicineId }) {
  const centerLat = userLocation?.lat || 26.9124;
  const centerLng = userLocation?.lng || 75.7873;

  return (
    <div style={{ width: '100%', height: '420px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizer />

        {/* User Location Pin */}
        <Marker position={[centerLat, centerLng]} icon={userPin}>
          <Popup>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
              <strong>Your Selected Location</strong>
              <p style={{ margin: 0, color: 'var(--color-ink-500)' }}>{userLocation?.name || 'Jaipur'}</p>
            </div>
          </Popup>
        </Marker>

        {/* Pharmacies Pins */}
        {pharmacies.map((p, index) => {
          let pinColor = '#1B4332'; // In stock
          if (p.stock_status === 'low_stock') pinColor = '#D97706';
          if (p.stock_status === 'out_of_stock') pinColor = '#71717A';

          return (
            <Marker
              key={p.pharmacy_id}
              position={[p.lat, p.lng]}
              icon={createCustomPin(pinColor, `${index + 1}`)}
            >
              <Popup>
                <div style={{ minWidth: '180px', fontFamily: 'var(--font-sans)', fontSize: '12px' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-ink-900)' }}>
                    {p.pharmacy_name}
                  </h4>
                  <p style={{ margin: '0 0 4px', color: 'var(--color-ink-500)' }}>
                    {p.distance_km} km • {p.is_24x7 ? '24x7' : p.open_now ? 'Open' : 'Closed'}
                  </p>
                  <p style={{ margin: '0 0 8px', fontWeight: 600, color: pinColor }}>
                    {p.stock_status === 'in_stock' ? 'In Stock' : p.stock_status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                    {' '}— Confidence: {p.confidence_score}%
                  </p>
                  {p.stock_status !== 'out_of_stock' && medicineId && (
                    <Link
                      to={`/reserve/${p.pharmacy_id}/${medicineId}`}
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        backgroundColor: 'var(--color-pine-800)',
                        color: '#FFFFFF',
                        borderRadius: '2px',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Reserve 60m
                    </Link>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
