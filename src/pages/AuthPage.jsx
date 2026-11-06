import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTectonic } from '../context/TectonicContext';
import { getInitials } from '../utils/weeks';

export default function AuthPage() {
  const {
    currentUser,
    signInWithGoogle,
    logOut,
    updateUserDisplayName,
    showToast
  } = useTectonic();
  const navigate = useNavigate();

  const [signingIn, setSigningIn] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');

  useEffect(() => {
    if (currentUser) {
      setProfileNameInput(currentUser.displayName || '');
    }
  }, [currentUser]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      showToast(`Google Sign-In error: ${err.message || 'Unable to sign in'}`);
    } finally {
      setSigningIn(false);
    }
  };

  if (!currentUser) {
    return (
      <section className="view-section login-screen-wrapper">
        <div className="card login-hero-card">
          <img
            src="/icons/icon-192.svg"
            alt="Tectonic Shift Logo"
            className="login-logo"
            width="72"
            height="72"
          />
          <span className="eyebrow">SPIRITUAL ALIGNMENT &amp; WEEKLY COVENANT</span>
          <h1 className="login-title">Welcome to Tectonic Shift</h1>
          <p className="login-subtitle">
            Sign in with your Google account to access the Dashboard, submit your weekly
            fasting, prayer, and meditation commitments, and view cohort accountability.
          </p>

          <button
            type="button"
            className="btn btn-google btn-lg btn-block login-google-btn"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>{signingIn ? 'Signing in with Google...' : 'Continue with Google'}</span>
          </button>

          <p className="login-footer-note">
            🔒 Protected Cohort Access • Only authenticated participants can view the
            dashboard and progress board.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="view-section">
      <div className="auth-layout" style={{ gridTemplateColumns: '1fr', maxWidth: '540px' }}>
        <div className="card auth-card">
          <div className="profile-summary">
            <div className="profile-avatar-lg">
              {getInitials(currentUser.displayName)}
            </div>
            <div>
              <span className="eyebrow">SIGNED IN WITH GOOGLE</span>
              <h2 className="auth-title">{currentUser.displayName}</h2>
              <p className="auth-subtitle">{currentUser.email}</p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="updateDisplayNameInput" className="field-label">
              Update Cohort Display Name
            </label>
            <div className="inline-input-row">
              <input
                type="text"
                id="updateDisplayNameInput"
                className="input-text"
                maxLength={80}
                value={profileNameInput}
                onChange={(e) => setProfileNameInput(e.target.value)}
              />
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={() => updateUserDisplayName(profileNameInput)}
              >
                Update
              </button>
            </div>
          </div>

          <div className="profile-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => navigate('/dashboard')}
            >
              Go to My Commitment Dashboard
            </button>
            <button className="btn btn-outline" type="button" onClick={logOut}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
