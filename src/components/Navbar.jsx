import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTectonic } from '../context/TectonicContext';
import { getInitials } from '../utils/weeks';

function detectMobileDevice() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  const isTouchMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
  const isSmallViewport = window.innerWidth <= 768;
  return isTouchMobile || isSmallViewport;
}

function isRunningStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function Navbar() {
  const { currentUser, currentWeekInfo, logOut, openWalkthrough, showToast } =
    useTectonic();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isMobile, setIsMobile] = useState(detectMobileDevice);
  const [isStandalone, setIsStandalone] = useState(isRunningStandalone);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const resizeHandler = () => {
      setIsMobile(detectMobileDevice());
      setIsStandalone(isRunningStandalone());
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('resize', resizeHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      showToast(
        'To install on your phone: tap your browser menu or Share icon and select "Add to Home Screen".'
      );
    }
  };

  const showInstallButton = !isStandalone && (deferredPrompt || isMobile);

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
              </div>
              <p className="brand-subtitle">Spiritual Alignment &amp; Weekly Commitment</p>
            </div>
          </div>

          <div className="header-actions">
            {showInstallButton && (
              <button
                className={`btn btn-sm ${
                  isMobile ? 'btn-install-mobile-highlight' : 'btn-outline'
                }`}
                type="button"
                onClick={handleInstallClick}
              >
                📲 Install App
              </button>
            )}

            {currentUser && (
              <>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={openWalkthrough}
                  title="Open App Walkthrough"
                >
                  ❓ Guide
                </button>
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
              </>
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
