import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useTectonic } from './context/TectonicContext';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  const { toastMessage } = useTectonic();

  return (
    <>
      <Navbar />

      {toastMessage && (
        <div className="toast-banner" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <main className="container main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="container footer-inner">
          <span>
            <strong>Tectonic Shift</strong> • Spiritual Program React PWA
          </span>
          <span>Offline-Ready • Firebase Auth &amp; Firestore</span>
        </div>
      </footer>
    </>
  );
}

