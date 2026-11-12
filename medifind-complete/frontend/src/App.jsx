import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LocationProvider } from './context/LocationContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

import { Home } from './pages/Home';
import { Results } from './pages/Results';
import { Reserve } from './pages/Reserve';
import { ReservationStatus } from './pages/ReservationStatus';
import { PharmacyPortal } from './pages/PharmacyPortal';
import { PharmacistSimulator } from './pages/PharmacistSimulator';
import { HowItWorks } from './pages/HowItWorks';
import { DemoReset } from './pages/DemoReset';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <LocationProvider>
      <ToastProvider>
        <Header />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/results" element={<Results />} />
            <Route path="/reserve/:pharmacyId/:medicineId" element={<Reserve />} />
            <Route path="/reservation/:id" element={<ReservationStatus />} />
            <Route path="/pharmacy" element={<PharmacyPortal />} />
            <Route path="/pharmacist-sim" element={<PharmacistSimulator />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/demo-reset" element={<DemoReset />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </ToastProvider>
    </LocationProvider>
  );
}
