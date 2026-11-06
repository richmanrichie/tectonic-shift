import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  initializeFirebaseServices,
  STORAGE_KEYS
} from '../services/firebase';
import {
  buildRecentWeeksList,
  computeAdherenceMetrics,
  createDefaultDailyStatus,
  createDefaultPillarChecks,
  DAYS_OF_WEEK,
  deriveDayStatusFromPillars,
  ensureSeedDemoData
} from '../utils/weeks';

const DEMO_COMMENTS_KEY = 'tectonic_shift_demo_comments_v1';

const TectonicContext = createContext(null);

export function TectonicProvider({ children }) {
  const weeksList = useMemo(() => buildRecentWeeksList(6), []);
  const currentWeekInfo = useMemo(
    () => weeksList.find((w) => w.isCurrent) || weeksList[0],
    [weeksList]
  );

  const [firebaseState] = useState(() => {
    ensureSeedDemoData(weeksList);
    return initializeFirebaseServices();
  });

  const { isLive: isFirebaseLive, auth, db, config: activeConfig } = firebaseState;

  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [commitmentsById, setCommitmentsById] = useState({});
  const [comments, setComments] = useState([]);
  const [selectedFormWeek, setSelectedFormWeek] = useState(currentWeekInfo.weekKey);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  const checkAndTriggerOnboarding = (uid) => {
    if (!uid) return;
    const key = `tectonic_shift_onboarded_v1_${uid}`;
    if (!localStorage.getItem(key)) {
      setShowWalkthrough(true);
    }
  };

  const closeWalkthrough = () => {
    if (currentUser?.uid) {
      localStorage.setItem(`tectonic_shift_onboarded_v1_${currentUser.uid}`, 'true');
    }
    setShowWalkthrough(false);
  };

  const openWalkthrough = () => {
    setShowWalkthrough(true);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 3600);
  };

  const ensureParticipantDoc = async (userObj) => {
    if (!isFirebaseLive || !db || !userObj) return;
    try {
      const ref = doc(db, 'participants', userObj.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: userObj.uid,
          displayName: userObj.displayName.slice(0, 80),
          cohortRole: 'Participant',
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn('Could not upsert participant profile doc:', err);
    }
  };

  const loadDemoData = () => {
    const savedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMO_USER) || 'null');
    if (savedUser && savedUser.uid) {
      setCurrentUser(savedUser);
      checkAndTriggerOnboarding(savedUser.uid);
    } else {
      setCurrentUser(null);
    }

    setParticipants(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMO_PARTICIPANTS) || '[]')
    );
    setCommitmentsById(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMO_COMMITMENTS) || '{}')
    );
    setComments(JSON.parse(localStorage.getItem(DEMO_COMMENTS_KEY) || '[]'));
    setAuthLoading(false);
  };

  // 1. Listen to Firebase Authentication state
  useEffect(() => {
    if (!isFirebaseLive) {
      loadDemoData();
      return undefined;
    }

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const displayName =
          user.displayName || (user.email ? user.email.split('@')[0] : 'Participant');
        const userObj = {
          uid: user.uid,
          displayName,
          email: user.email || '',
          photoURL: user.photoURL || ''
        };
        setCurrentUser(userObj);
        checkAndTriggerOnboarding(userObj.uid);
        await ensureParticipantDoc(userObj);
      } else {
        setCurrentUser(null);
        setParticipants([]);
        setCommitmentsById({});
        setComments([]);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubAuth();
    };
  }, [isFirebaseLive, auth, db]);

  // 2. Subscribe to Firestore collections ONLY when a user is signed in
  useEffect(() => {
    if (!isFirebaseLive || !db || !currentUser) {
      return undefined;
    }

    const unsubParticipants = onSnapshot(
      collection(db, 'participants'),
      (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ uid: docSnap.id, ...docSnap.data() });
        });
        setParticipants(list);
      },
      (err) => console.warn('Participants listener warning:', err)
    );

    const unsubCommitments = onSnapshot(
      collection(db, 'commitments'),
      (snap) => {
        const map = {};
        snap.forEach((docSnap) => {
          map[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        });
        setCommitmentsById(map);
      },
      (err) => console.warn('Commitments listener warning:', err)
    );

    const unsubComments = onSnapshot(
      collection(db, 'comments'),
      (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const createdMs = data.createdAt?.toMillis
            ? data.createdAt.toMillis()
            : data.createdAtISO
            ? new Date(data.createdAtISO).getTime()
            : Date.now();
          list.push({ id: docSnap.id, ...data, createdMs });
        });
        setComments(list);
      },
      (err) => console.warn('Comments listener warning:', err)
    );

    return () => {
      unsubParticipants();
      unsubCommitments();
      unsubComments();
    };
  }, [isFirebaseLive, db, currentUser?.uid]);

  // Helper to normalize pillarChecks from an existing commitment
  const getNormalizedPillarChecks = (commitment) => {
    const base = createDefaultPillarChecks();
    if (!commitment) return base;

    const dailyStatus = commitment.dailyStatus || {};
    const existingChecks = commitment.pillarChecks || {};

    DAYS_OF_WEEK.forEach(({ key }) => {
      if (existingChecks[key]) {
        base[key] = {
          fasting: Boolean(existingChecks[key].fasting),
          prayer: Boolean(existingChecks[key].prayer),
          meditation: Boolean(existingChecks[key].meditation)
        };
      } else if (dailyStatus[key] === 'completed') {
        base[key] = { fasting: true, prayer: true, meditation: true };
      }
    });

    return base;
  };

  // Save or update weekly commitment (dailyStatus is strictly derived from pillarChecks)
  const saveCommitment = async (weekKey, formValues) => {
    if (!currentUser) {
      throw new Error('Please sign in with Google first to save your commitment.');
    }

    const weekObj = weeksList.find((w) => w.weekKey === weekKey) || currentWeekInfo;
    const docId = `${currentUser.uid}_${weekKey}`;
    const existing = commitmentsById[docId];
    const pillarChecks = formValues.pillarChecks || getNormalizedPillarChecks(existing);

    const derivedDailyStatus = createDefaultDailyStatus();
    DAYS_OF_WEEK.forEach(({ key }) => {
      derivedDailyStatus[key] = deriveDayStatusFromPillars(pillarChecks[key], 'pending');
    });

    const metrics = computeAdherenceMetrics(derivedDailyStatus);

    const payloadBase = {
      uid: currentUser.uid,
      displayName: currentUser.displayName.slice(0, 80),
      weekKey: weekObj.weekKey,
      weekLabel: weekObj.weekLabel,
      fastingCommitment: formValues.fastingCommitment.trim().slice(0, 300),
      prayerMinutes: Math.min(720, Math.max(1, Math.round(Number(formValues.prayerMinutes)))),
      prayerTimes: formValues.prayerTimes.trim().slice(0, 200),
      prayerAltTimes: formValues.prayerAltTimes.trim().slice(0, 200),
      meditationMinutes: Math.min(
        720,
        Math.max(1, Math.round(Number(formValues.meditationMinutes)))
      ),
      meditationTimeRange: formValues.meditationTimeRange.trim().slice(0, 200),
      reflectionNotes: (formValues.reflectionNotes || '').trim().slice(0, 500),
      dailyStatus: derivedDailyStatus,
      pillarChecks,
      completedCount: metrics.completedCount,
      skippedCount: metrics.skippedCount,
      adherenceStatus: metrics.adherenceStatus
    };

    if (isFirebaseLive && db) {
      const ref = doc(db, 'commitments', docId);
      const existingSnap = await getDoc(ref);
      await setDoc(ref, {
        ...payloadBase,
        createdAt: existingSnap.exists()
          ? existingSnap.data().createdAt
          : serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      const storedCommitments = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.DEMO_COMMITMENTS) || '{}'
      );
      storedCommitments[docId] = {
        ...payloadBase,
        updatedAtISO: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.DEMO_COMMITMENTS, JSON.stringify(storedCommitments));

      const storedParticipants = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.DEMO_PARTICIPANTS) || '[]'
      );
      if (!storedParticipants.some((p) => p.uid === currentUser.uid)) {
        storedParticipants.push({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          cohortRole: 'Participant'
        });
        localStorage.setItem(
          STORAGE_KEYS.DEMO_PARTICIPANTS,
          JSON.stringify(storedParticipants)
        );
        setParticipants(storedParticipants);
      }
      setCommitmentsById(storedCommitments);
    }

    showToast(`Commitment saved for ${weekObj.weekKey}!`);
  };

  // Toggle an individual commitment checkbox (Fasting, Prayer, or Meditation) for a day
  const toggleCommitmentPillar = async (weekKey, dayKey, pillarKey) => {
    if (!currentUser) return;
    const docId = `${currentUser.uid}_${weekKey}`;
    const existing = commitmentsById[docId];
    if (!existing) return;

    const pillarChecks = getNormalizedPillarChecks(existing);
    const currentDayChecks = pillarChecks[dayKey] || {
      fasting: false,
      prayer: false,
      meditation: false
    };

    const nextValue = !currentDayChecks[pillarKey];
    const updatedDayChecks = {
      ...currentDayChecks,
      [pillarKey]: nextValue
    };
    const updatedPillarChecks = {
      ...pillarChecks,
      [dayKey]: updatedDayChecks
    };

    const currentDailyStatus = {
      ...createDefaultDailyStatus(),
      ...(existing.dailyStatus || {})
    };
    const updatedDayStatus = deriveDayStatusFromPillars(
      updatedDayChecks,
      currentDailyStatus[dayKey]
    );
    const updatedDailyStatus = {
      ...currentDailyStatus,
      [dayKey]: updatedDayStatus
    };

    const metrics = computeAdherenceMetrics(updatedDailyStatus);

    const updatedRecord = {
      uid: existing.uid,
      displayName: existing.displayName,
      weekKey: existing.weekKey,
      weekLabel: existing.weekLabel,
      fastingCommitment: existing.fastingCommitment,
      prayerMinutes: existing.prayerMinutes,
      prayerTimes: existing.prayerTimes,
      prayerAltTimes: existing.prayerAltTimes,
      meditationMinutes: existing.meditationMinutes,
      meditationTimeRange: existing.meditationTimeRange,
      reflectionNotes: existing.reflectionNotes || '',
      dailyStatus: updatedDailyStatus,
      pillarChecks: updatedPillarChecks,
      completedCount: metrics.completedCount,
      skippedCount: metrics.skippedCount,
      adherenceStatus: metrics.adherenceStatus
    };

    // Optimistic state update
    setCommitmentsById((prev) => ({
      ...prev,
      [docId]: {
        ...existing,
        ...updatedRecord
      }
    }));

    if (isFirebaseLive && db) {
      const ref = doc(db, 'commitments', docId);
      await setDoc(ref, {
        ...updatedRecord,
        createdAt: existing.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      const storedCommitments = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.DEMO_COMMITMENTS) || '{}'
      );
      storedCommitments[docId] = {
        ...existing,
        ...updatedRecord,
        updatedAtISO: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.DEMO_COMMITMENTS, JSON.stringify(storedCommitments));
    }

    const labelMap = {
      fasting: 'Fasting Commitment',
      prayer: 'Prayer Commitment',
      meditation: 'Meditation Commitment'
    };
    showToast(
      `${labelMap[pillarKey]} marked ${nextValue ? 'Done ✓' : 'Pending'} for ${dayKey.toUpperCase()}`
    );
  };

  // Add a comment or reply to the weekly experience feed
  const addComment = async ({ weekKey, text, parentId = '' }) => {
    if (!currentUser) {
      throw new Error('Please sign in first to post a comment.');
    }
    const cleanText = text.trim().slice(0, 1000);
    if (!cleanText) return;

    if (isFirebaseLive && db) {
      await addDoc(collection(db, 'comments'), {
        uid: currentUser.uid,
        displayName: currentUser.displayName.slice(0, 80),
        weekKey,
        text: cleanText,
        parentId: parentId || '',
        createdAt: serverTimestamp()
      });
    } else {
      const stored = JSON.parse(localStorage.getItem(DEMO_COMMENTS_KEY) || '[]');
      const newComment = {
        id: `demo-c-${Date.now()}`,
        uid: currentUser.uid,
        displayName: currentUser.displayName.slice(0, 80),
        weekKey,
        text: cleanText,
        parentId: parentId || '',
        createdAtISO: new Date().toISOString(),
        createdMs: Date.now()
      };
      const updated = [...stored, newComment];
      localStorage.setItem(DEMO_COMMENTS_KEY, JSON.stringify(updated));
      setComments(updated);
    }

    showToast(parentId ? 'Reply posted!' : 'Experience shared to the weekly feed!');
  };

  // Google Sign-In
  const signInWithGoogle = async () => {
    if (isFirebaseLive && auth) {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, provider);
      const name =
        res.user.displayName ||
        (res.user.email ? res.user.email.split('@')[0] : 'Participant');
      await ensureParticipantDoc({
        uid: res.user.uid,
        displayName: name,
        email: res.user.email
      });
      showToast(`Signed in with Google as ${name}`);
    } else {
      const demoGoogleUser = {
        uid: 'demo-p1',
        displayName: 'Hannah Mensah',
        email: 'hannah.mensah@gmail.com'
      };
      localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(demoGoogleUser));
      loadDemoData();
      showToast('Signed in with Google (Demo Cohort)');
    }
  };

  const logOut = async () => {
    if (isFirebaseLive && auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem(STORAGE_KEYS.DEMO_USER);
      loadDemoData();
    }
    showToast('Signed out.');
  };

  const updateUserDisplayName = async (newName) => {
    const trimmed = newName.trim();
    if (!trimmed || !currentUser) return;
    const updatedUser = { ...currentUser, displayName: trimmed };
    setCurrentUser(updatedUser);

    if (isFirebaseLive && auth?.currentUser) {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      await setDoc(
        doc(db, 'participants', currentUser.uid),
        {
          uid: currentUser.uid,
          displayName: trimmed.slice(0, 80),
          cohortRole: 'Participant',
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } else {
      localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(updatedUser));
      const storedParticipants = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.DEMO_PARTICIPANTS) || '[]'
      );
      const idx = storedParticipants.findIndex((p) => p.uid === currentUser.uid);
      if (idx >= 0) storedParticipants[idx].displayName = trimmed;
      localStorage.setItem(
        STORAGE_KEYS.DEMO_PARTICIPANTS,
        JSON.stringify(storedParticipants)
      );
      loadDemoData();
    }
    showToast('Display name updated!');
  };

  const value = {
    isFirebaseLive,
    activeConfig,
    authLoading,
    weeksList,
    currentWeekInfo,
    currentUser,
    participants,
    commitmentsById,
    comments,
    selectedFormWeek,
    setSelectedFormWeek,
    showWalkthrough,
    openWalkthrough,
    closeWalkthrough,
    toastMessage,
    showToast,
    saveCommitment,
    toggleCommitmentPillar,
     getNormalizedPillarChecks,
    addComment,
    signInWithGoogle,
    logOut,
    updateUserDisplayName
  };

  return <TectonicContext.Provider value={value}>{children}</TectonicContext.Provider>;
}

export function useTectonic() {
  const ctx = useContext(TectonicContext);
  if (!ctx) {
    throw new Error('useTectonic must be used inside a TectonicProvider');
  }
  return ctx;
}
