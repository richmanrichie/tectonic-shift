import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTectonic } from '../context/TectonicContext';
import { STORAGE_KEYS } from '../services/firebase';
import { getInitials } from '../utils/weeks';

export default function AuthPage() {
  const {
    isFirebaseLive,
    activeConfig,
    currentUser,
    authenticateWithEmail,
    signInWithGoogle,
    logOut,
    updateUserDisplayName,
    showToast
  } = useTectonic();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [profileNameInput, setProfileNameInput] = useState('');
  const [configJsonInput, setConfigJsonInput] = useState(() =>
    isFirebaseLive ? JSON.stringify(activeConfig, null, 2) : ''
  );

  useEffect(() => {
    if (currentUser) {
      setProfileNameInput(currentUser.displayName || '');
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('Please enter both your email address and password.');
      return;
    }
    if (authMode === 'signup' && !displayName.trim()) {
      showToast('Please enter your full name so the cohort can identify you.');
      return;
    }

    setSubmitting(true);
    try {
      await authenticateWithEmail({
        mode: authMode,
        email: email.trim(),
        password,
        displayName: displayName.trim()
      });
      navigate('/dashboard');
    } catch (err) {
      showToast(`Auth error: ${err.message || 'Unable to authenticate'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      showToast(`Google Sign-In error: ${err.message}`);
    }
  };

  const handleApplyConfig = () => {
    try {
      const parsed = JSON.parse(configJsonInput.trim());
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('Config must include at least apiKey and projectId.');
      }
      localStorage.setItem(STORAGE_KEYS.FIREBASE_OVERRIDE, JSON.stringify(parsed));
      window.location.reload();
    } catch (err) {
      showToast(`Invalid Firebase JSON: ${err.message}`);
    }
  };

  const handleResetDemo = () => {
    localStorage.removeItem(STORAGE_KEYS.FIREBASE_OVERRIDE);
    window.location.reload();
  };

  return (
    <section className="view-section">
      <div className="auth-layout">
        {!currentUser ? (
          <div className="card auth-card">
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-mode-btn ${authMode === 'signin' ? 'active' : ''}`}
                onClick={() => setAuthMode('signin')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-mode-btn ${authMode === 'signup' ? 'active' : ''}`}
                onClick={() => setAuthMode('signup')}
              >
                Create Account
              </button>
            </div>

            <h2 className="auth-title">
              {authMode === 'signup'
                ? 'Create Your Tectonic Shift Account'
                : 'Sign In to Tectonic Shift'}
            </h2>
            <p className="auth-subtitle">
              Sign in to submit your weekly fasting, prayer, and meditation commitments.
            </p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {authMode === 'signup' && (
                <div className="form-group">
                  <label htmlFor="authDisplayName" className="field-label">
                    Full Name (Displayed on Progress Board) *
                  </label>
                  <input
                    type="text"
                    id="authDisplayName"
                    className="input-text"
                    placeholder="e.g., Grace Okafor"
                    maxLength={80}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="authEmail" className="field-label">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="authEmail"
                  className="input-text"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="authPassword" className="field-label">
                  Password *
                </label>
                <input
                  type="password"
                  id="authPassword"
                  className="input-text"
                  placeholder="At least 6 characters"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={submitting}
              >
                {submitting
                  ? 'Please wait...'
                  : authMode === 'signup'
                  ? 'Create Account & Join Cohort'
                  : 'Sign In'}
              </button>
            </form>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="btn btn-google btn-block"
              onClick={handleGoogle}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
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
              <span>Continue with Google</span>
            </button>
          </div>
        ) : (
          <div className="card auth-card">
            <div className="profile-summary">
              <div className="profile-avatar-lg">
                {getInitials(currentUser.displayName)}
              </div>
              <div>
                <span className="eyebrow">SIGNED IN PARTICIPANT</span>
                <h2 className="auth-title">{currentUser.displayName}</h2>
                <p className="auth-subtitle">{currentUser.email}</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="updateDisplayNameInput" className="field-label">
                Update Display Name
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
                Open Weekly Commitment Form
              </button>
              <button className="btn btn-outline" type="button" onClick={logOut}>
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Firebase Configuration Status & Runtime Switcher */}
        <div className="card firebase-config-card">
          <span className="eyebrow">BACKEND CONFIGURATION</span>
          <h3 className="form-section-title">Firebase Connection Status</h3>
          <p className="form-section-desc">
            {isFirebaseLive ? (
              <>
                Connected to live Firebase project{' '}
                <strong>{activeConfig.projectId}</strong>. Authentication and Firestore
                real-time sync are active.
              </>
            ) : (
              <>
                Currently running in <strong>Local Demo Cohort Mode</strong> so you can
                test all pages right away. To connect your live Firebase project, set{' '}
                <code>VITE_FIREBASE_*</code> in <code>.env</code>, edit{' '}
                <code>src/services/firebase.js</code>, or paste your Firebase config JSON
                below.
              </>
            )}
          </p>

          <details className="config-details">
            <summary className="config-summary">
              Configure Firebase SDK Credentials (Runtime Override)
            </summary>
            <p className="field-hint">
              Paste your Firebase Web App JSON config below to connect directly to your
              live Firebase project.
            </p>
            <textarea
              className="input-textarea code-textarea"
              rows={7}
              placeholder='{"apiKey": "AIza...", "authDomain": "your-app.firebaseapp.com", "projectId": "your-app", "appId": "1:..."}'
              value={configJsonInput}
              onChange={(e) => setConfigJsonInput(e.target.value)}
            />
            <div className="config-btn-row">
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={handleApplyConfig}
              >
                Save &amp; Connect Firebase
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: '#475569', borderColor: '#cbd5e1' }}
                type="button"
                onClick={handleResetDemo}
              >
                Use Local Demo Cohort
              </button>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

