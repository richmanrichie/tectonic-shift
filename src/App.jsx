import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useTectonic } from './context/TectonicContext';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import AuthPage from './pages/AuthPage';

function ProtectedRoute({ children }) {
  const { currentUser } = useTectonic();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const { authLoading, currentUser, toastMessage } = useTectonic();

  return (
    <>
      <Navbar />

      {toastMessage && (
        <div className="toast-banner" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <main className="container main-content">
        {authLoading ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <p className="section-subtitle">Checking authentication session...</p>
          </div>
        ) : (
          <Routes>
            {/* First Page: Login Page (redirects to /dashboard if already signed in) */}
            <Route
              path="/login"
              element={
                currentUser ? <Navigate to="/dashboard" replace /> : <AuthPage />
              }
            />

            {/* Root redirects to /dashboard if signed in, or /login if signed out */}
            <Route
              path="/"
              element={
                <Navigate to={currentUser ? '/dashboard' : '/login'} replace />
              }
            />

            {/* Protected Pages — Only logged-in users can see these */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AuthPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route
              path="*"
              element={
                <Navigate to={currentUser ? '/dashboard' : '/login'} replace />
              }
            />
          </Routes>
        )}
      </main>

      <footer className="app-footer">
        <div className="container footer-inner">
          <span>
            <strong>Tectonic Shift</strong> • Spiritual Program React PWA
          </span>
          <span>Google Sign-In • Firebase Auth &amp; Firestore</span>
        </div>
      </footer>
    </>
  );
}
