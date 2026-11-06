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
            onClick={() => navigate('/')}
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
                  {isFirebaseLive ? 'Firebase Live' : 'Demo Cohort Mode'}
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

            {currentUser ? (
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
            ) : (
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={() => navigate('/auth')}
              >
                Sign In / Join
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="app-nav" aria-label="Primary Page Navigation">
        <div className="container nav-tabs">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          >
            <span className="nav-tab-icon" aria-hidden="true">
              🌍
            </span>
            <span>Community Progress</span>
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          >
            <span className="nav-tab-icon" aria-hidden="true">
              🔥
            </span>
            <span>My Commitment</span>
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
            to="/auth"
            className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          >
            <span className="nav-tab-icon" aria-hidden="true">
              🔐
            </span>
            <span>{currentUser ? 'Account' : 'Sign In'}</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
}

