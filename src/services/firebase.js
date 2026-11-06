import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const STORAGE_KEYS = {
  FIREBASE_OVERRIDE: 'tectonic_shift_firebase_config_v1',
  DEMO_USER: 'tectonic_shift_demo_user_v1',
  DEMO_PARTICIPANTS: 'tectonic_shift_demo_participants_v1',
  DEMO_COMMITMENTS: 'tectonic_shift_demo_commitments_v1'
};

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC8yazcIDroOAnCmm-__lp7jchBm8v-nwU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tectonic-shift.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tectonic-shift',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tectonic-shift.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1080764442805',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:1080764442805:web:dafd5ca5b351a959eb36fc',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-3WZ0P1VQKY'
};

export function getActiveFirebaseConfig() {
  const overrideRaw = localStorage.getItem(STORAGE_KEYS.FIREBASE_OVERRIDE);
  if (overrideRaw) {
    try {
      const parsed = JSON.parse(overrideRaw);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    } catch (err) {
      console.warn('Invalid Firebase override JSON in localStorage:', err);
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function isPlaceholderConfig(cfg) {
  return (
    !cfg ||
    !cfg.apiKey ||
    cfg.apiKey.includes('REPLACE_WITH') ||
    cfg.projectId === 'your-project-id'
  );
}

export function initializeFirebaseServices() {
  const cfg = getActiveFirebaseConfig();
  if (isPlaceholderConfig(cfg)) {
    return { isLive: false, app: null, auth: null, db: null, analytics: null, config: cfg };
  }

  try {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(cfg);
    const auth = getAuth(app);
    const db = getFirestore(app);

    let analytics = null;
    if (typeof window !== 'undefined' && cfg.measurementId) {
      isAnalyticsSupported()
        .then((supported) => {
          if (supported) {
            analytics = getAnalytics(app);
          }
        })
        .catch(() => {});
    }

    return { isLive: true, app, auth, db, analytics, config: cfg };
  } catch (err) {
    console.error('Firebase initialization failed, falling back to Demo Mode:', err);
    return { isLive: false, app: null, auth: null, db: null, analytics: null, config: cfg };
  }
}
