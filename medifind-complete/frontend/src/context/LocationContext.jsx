import React, { createContext, useContext, useState, useEffect } from 'react';

export const SEEDED_LOCALITIES = [
  { name: 'City Center (Jaipur)', lat: 26.9124, lng: 75.7873 },
  { name: 'Raja Park', lat: 26.9216, lng: 75.8083 },
  { name: 'C-Scheme', lat: 26.9149, lng: 75.7753 },
  { name: 'SMS Hospital / Ashok Nagar', lat: 26.9044, lng: 75.7913 },
  { name: 'Tonk Road', lat: 26.8974, lng: 75.7923 },
  { name: 'Mansarovar', lat: 26.8604, lng: 75.7563 },
  { name: 'Malviya Nagar', lat: 26.8544, lng: 75.8153 },
  { name: 'Vaishali Nagar', lat: 26.9164, lng: 75.7393 },
  { name: 'MI Road / Ajmeri Gate', lat: 26.9234, lng: 75.7823 },
  { name: 'Sodala Metro', lat: 26.8944, lng: 75.7633 },
  { name: 'Bapu Nagar', lat: 26.8904, lng: 75.8023 },
  { name: 'Johari Bazaar (Old City)', lat: 26.9334, lng: 75.8053 },
  { name: 'Gopalpura Bypass', lat: 26.8704, lng: 75.7753 },
  { name: 'Jagatpura', lat: 26.8374, lng: 75.8323 },
  { name: 'Vidyadhar Nagar', lat: 26.9774, lng: 75.7723 },
];

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('medifind_user_location');
      return saved ? JSON.parse(saved) : SEEDED_LOCALITIES[0];
    } catch {
      return SEEDED_LOCALITIES[0];
    }
  });

  const [geoState, setGeoState] = useState('idle'); // idle, requesting, granted, denied

  useEffect(() => {
    try {
      localStorage.setItem('medifind_user_location', JSON.stringify(location));
    } catch {}
  }, [location]);

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setGeoState('denied');
      return;
    }

    setGeoState('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLoc = {
          name: 'Current Device Location',
          lat: roundCoord(pos.coords.latitude),
          lng: roundCoord(pos.coords.longitude),
          isGPS: true,
        };
        setLocation(newLoc);
        setGeoState('granted');
      },
      () => {
        setGeoState('denied');
      },
      { timeout: 8000 }
    );
  };

  const setManualLocation = (locality) => {
    setLocation({
      name: locality.name,
      lat: locality.lat,
      lng: locality.lng,
      isGPS: false,
    });
    setGeoState('granted');
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        geoState,
        requestBrowserLocation,
        setManualLocation,
        localities: SEEDED_LOCALITIES,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

function roundCoord(val) {
  return Math.round(val * 10000) / 10000;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
