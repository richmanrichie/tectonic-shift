import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTectonic } from '../context/TectonicContext';
import { getInitials } from '../utils/weeks';

export default function Navbar() {
  const { isFirebaseLive, currentUser, currentWeekInfo, logOut } = useTectonic();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <>
      <header className="app-header">
        <div className="container header-inner">
          <div
            className="brand"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(currentUser ? '/dashboard' : '/login')}
          >
            <img
              src="/icons/icon-192.svg"
              alt="Tectonic Shift logo"
              className="brand-logo"
              width="40"
              height="40"
            />
            <div>
              <div className="brand-badge-row">
                <span className="brand-title">Tectonic Shift</span>
                <span
                  className={`status-pill ${
                    isFirebaseLive ? 'status-pill--live' : 'status-pill--demo'
                  }`}
                >
                  {isFirebaseLive ? 'Firebase Live' : 'Demo Mode'}
                </span>
              </div>
              <p className="brand-subtitle">Spiritual Alignment &amp; Weekly Covenant</p>
            </div>
          </div>

          <div className="header-actions">
            {deferredPrompt && (
              <button
                className="btn btn-outline btn-sm"
                type="button"
                onClick={handleInstallClick}
              >
                Install App
              </button>
            )}

            {currentUser && (
              <div className="user-chip">
                <span className="user-avatar">
                  {getInitials(currentUser.displayName)}
                </span>
                <div className="user-chip-text">
                  <span className="user-chip-name">{currentUser.displayName}</span>
                  <span className="user-chip-week">{currentWeekInfo.weekKey}</span>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={logOut}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Only authenticated users can see the navigation bar to Dashboard / Community / History */}
      {currentUser && (
        <nav className="app-nav" aria-label="Primary Page Navigation">
          <div className="container nav-tabs">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
            >
              <span className="nav-tab-icon" aria-hidden="true">
                🔥
              </span>
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/community"
              className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
            >
              <span className="nav-tab-icon" aria-hidden="true">
                🌍
              </span>
              <span>Community Progress</span>
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
            >
              <span className="nav-tab-icon" aria-hidden="true">
                📜
              </span>
              <span>History</span>
            </NavLink>

            <NavLink
              to="/account"
              className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
            >
              <span className="nav-tab-icon" aria-hidden="true">
                👤
              </span>
              <span>Account</span>
            </NavLink>
          </div>
        </nav>
      )}
    </>
  );
}
